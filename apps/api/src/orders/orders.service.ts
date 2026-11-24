import { randomInt } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import {
  MAX_QTY_PER_ITEM,
  canTransition,
  deliveryFeePaise,
  distanceMeters,
  returnsStock,
  type Order as OrderDto,
  type OrderStatus,
} from '@nukkad/core';
import { Prisma } from '@prisma/client';

import type { AuthUser } from '../auth/auth.guard';
import { AppError } from '../common/app-error';
import { ORDER_INCLUDE, addressText, toOrder } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import type { PlaceOrderDto } from './orders.dto';

/** No 0/O or 1/I, so a code read out over the phone cannot be misheard. */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function newShortCode(): string {
  let code = 'NK-';
  for (let i = 0; i < 5; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/** The timestamp each status sets when an order reaches it. */
const STAMPS: Partial<Record<OrderStatus, 'acceptedAt' | 'readyAt' | 'dispatchedAt' | 'deliveredAt' | 'cancelledAt'>> = {
  accepted: 'acceptedAt',
  ready: 'readyAt',
  out_for_delivery: 'dispatchedAt',
  delivered: 'deliveredAt',
  rejected: 'cancelledAt',
  cancelled: 'cancelledAt',
};

/** Whose orders the caller may touch. */
type Actor = { id: string; role: 'customer' } | { id: string; role: 'store'; storeId: string };

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private findByKey(customerId: string, idempotencyKey: string) {
    return this.prisma.order.findUnique({
      where: { customerId_idempotencyKey: { customerId, idempotencyKey } },
      include: ORDER_INCLUDE,
    });
  }

  /**
   * Places an order: checks the store and the address, takes the stock,
   * prices everything from the database and writes the order, all or nothing.
   *
   * The same idempotency key always returns the same order, so a retry after
   * a dropped connection cannot place it twice.
   */
  async place(user: AuthUser, dto: PlaceOrderDto): Promise<OrderDto> {
    const before = await this.findByKey(user.id, dto.idempotencyKey);
    if (before) return toOrder(before);

    // The same product on two lines is one line with the quantities added.
    const quantities = new Map<string, number>();
    for (const line of dto.items) {
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.qty);
    }
    for (const qty of quantities.values()) {
      if (qty > MAX_QTY_PER_ITEM) throw new AppError('invalid_quantity');
    }

    const [store, address, customer] = await Promise.all([
      this.prisma.store.findUnique({ where: { id: dto.storeId } }),
      this.prisma.address.findFirst({ where: { id: dto.addressId, userId: user.id } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ]);
    if (!store) throw new AppError('store_not_found', HttpStatus.NOT_FOUND);
    if (!store.isOpen) throw new AppError('store_closed', HttpStatus.CONFLICT);
    if (!address) throw new AppError('address_not_found', HttpStatus.NOT_FOUND);
    if (distanceMeters(address, store) > store.deliveryRadiusM) throw new AppError('outside_delivery_area');

    for (let attempt = 0; ; attempt++) {
      try {
        const order = await this.prisma.$transaction(async (tx) => {
          const rows = await tx.storeProduct.findMany({
            where: {
              storeId: store.id,
              productId: { in: [...quantities.keys()] },
              isAvailable: true,
              product: { isActive: true },
            },
            include: { product: true },
          });
          const byProduct = new Map(rows.map((row) => [row.productId, row]));

          let subtotalPaise = 0;
          const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
          for (const [productId, qty] of quantities) {
            const row = byProduct.get(productId);
            if (!row) throw new AppError('item_unavailable', HttpStatus.CONFLICT);
            // Take the stock only if enough is left at this instant. Two
            // customers after the last packet cannot both get it: the second
            // update matches no row.
            const taken = await tx.storeProduct.updateMany({
              where: { storeId: store.id, productId, isAvailable: true, stock: { gte: qty } },
              data: { stock: { decrement: qty } },
            });
            if (taken.count !== 1) throw new AppError('item_unavailable', HttpStatus.CONFLICT);
            subtotalPaise += row.pricePaise * qty;
            items.push({
              productId,
              name: row.product.name,
              unitLabel: row.product.unitLabel,
              emoji: row.product.emoji,
              unitPricePaise: row.pricePaise,
              qty,
            });
          }

          if (subtotalPaise < store.minOrderPaise) throw new AppError('below_minimum_order');
          const feePaise = deliveryFeePaise(store, subtotalPaise);

          return tx.order.create({
            data: {
              shortCode: newShortCode(),
              customerId: user.id,
              storeId: store.id,
              subtotalPaise,
              deliveryFeePaise: feePaise,
              totalPaise: subtotalPaise + feePaise,
              paymentMethod: dto.paymentMethod,
              dropoffName: customer.name,
              dropoffPhone: customer.phone,
              dropoffText: addressText(address),
              dropoffLat: address.lat,
              dropoffLng: address.lng,
              notes: dto.notes?.trim() || null,
              idempotencyKey: dto.idempotencyKey,
              items: { create: items },
              events: { create: { toStatus: 'placed', actorId: user.id } },
            },
            include: ORDER_INCLUDE,
          });
        });
        return toOrder(order);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // Either this same request arrived twice at once and the other copy
        // won, or the random short code is already taken. The failed
        // transaction rolled back, so the stock it took is back as well.
        const winner = await this.findByKey(user.id, dto.idempotencyKey);
        if (winner) return toOrder(winner);
        if (attempt >= 3) throw error;
      }
    }
  }

  async listForCustomer(customerId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'desc' },
      take: 50,
    });
    return orders.map(toOrder);
  }

  async getForCustomer(customerId: string, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({ where: { id, customerId }, include: ORDER_INCLUDE });
    if (!order) throw new AppError('order_not_found', HttpStatus.NOT_FOUND);
    return toOrder(order);
  }

  /** Orders still being worked on, longest-waiting first; or the most recent finished ones. */
  async listForStore(storeId: string, scope: 'active' | 'finished'): Promise<OrderDto[]> {
    const finished: OrderStatus[] = ['delivered', 'rejected', 'cancelled'];
    const orders = await this.prisma.order.findMany({
      where: { storeId, status: scope === 'active' ? { notIn: finished } : { in: finished } },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: scope === 'active' ? 'asc' : 'desc' },
      take: scope === 'active' ? 200 : 50,
    });
    return orders.map(toOrder);
  }

  /**
   * Moves an order to a new status if the transition table in @nukkad/core
   * allows it for this actor. An order outside the actor's reach answers
   * "not found", the same as one that does not exist.
   */
  async transition(actor: Actor, orderId: string, to: OrderStatus, reason?: string): Promise<OrderDto> {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { id: orderId, ...(actor.role === 'store' ? { storeId: actor.storeId } : { customerId: actor.id }) },
        include: { items: true },
      });
      if (!current) throw new AppError('order_not_found', HttpStatus.NOT_FOUND);
      if (!canTransition(current.status, to, actor.role)) {
        throw new AppError('transition_not_allowed', HttpStatus.CONFLICT);
      }

      const stamp = STAMPS[to];
      // Matching on the status we just read makes this safe against two
      // people acting at once: the slower one updates no row.
      const moved = await tx.order.updateMany({
        where: { id: current.id, status: current.status },
        data: {
          status: to,
          ...(stamp ? { [stamp]: new Date() } : {}),
          ...(returnsStock(to) ? { cancelReason: reason?.trim() || null } : {}),
        },
      });
      if (moved.count !== 1) throw new AppError('transition_not_allowed', HttpStatus.CONFLICT);

      if (returnsStock(to)) {
        for (const item of current.items) {
          await tx.storeProduct.updateMany({
            where: { storeId: current.storeId, productId: item.productId },
            data: { stock: { increment: item.qty } },
          });
        }
      }
      await tx.orderEvent.create({
        data: { orderId: current.id, fromStatus: current.status, toStatus: to, actorId: actor.id },
      });
      return tx.order.findUniqueOrThrow({ where: { id: current.id }, include: ORDER_INCLUDE });
    });
    return toOrder(order);
  }
}
