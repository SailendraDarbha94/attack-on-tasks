import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  LOW_STOCK_AT,
  type CatalogProduct,
  type Inventory,
  type InventoryItem,
  type Order,
  type StoreDashboard,
  type StoreSummary,
} from '@nukkad/core';
import type { Product, StoreProduct } from '@prisma/client';

import { AuthGuard, Roles, type AuthUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppError } from '../common/app-error';
import { toStoreSummary } from '../common/mappers';
import { TransitionDto } from '../orders/orders.dto';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddInventoryDto, OrdersQueryDto, SetOpenDto, UpdateInventoryDto } from './desk.dto';

/** India has one time zone and no daylight saving: UTC+5:30, always. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function startOfIndianDay(now: Date): Date {
  const local = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST_OFFSET_MS);
}

function toInventoryItem(row: StoreProduct & { product: Product }): InventoryItem {
  return {
    productId: row.productId,
    categoryId: row.product.categoryId,
    name: row.product.name,
    unitLabel: row.product.unitLabel,
    emoji: row.product.emoji,
    mrpPaise: row.product.mrpPaise,
    pricePaise: row.pricePaise,
    stock: row.stock,
    isAvailable: row.isAvailable,
  };
}

/**
 * The store's side of the counter: its orders, its shelf, and whether it is
 * open. Every route works on the store the signed-in account belongs to and
 * no other; the store is never taken from the request.
 */
@Controller('store')
@UseGuards(AuthGuard)
@Roles('store')
export class DeskController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  private storeIdOf(user: AuthUser): string {
    // A store account that has not been attached to a store yet.
    if (!user.storeId) throw new AppError('not_authorized', HttpStatus.FORBIDDEN);
    return user.storeId;
  }

  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthUser): Promise<StoreDashboard> {
    const storeId = this.storeIdOf(user);
    const [store, today, waiting, inProgress, lowStock] = await Promise.all([
      this.prisma.store.findUniqueOrThrow({ where: { id: storeId } }),
      this.prisma.order.aggregate({
        where: {
          storeId,
          placedAt: { gte: startOfIndianDay(new Date()) },
          status: { notIn: ['rejected', 'cancelled'] },
        },
        _count: true,
        _sum: { totalPaise: true },
      }),
      this.prisma.order.count({ where: { storeId, status: 'placed' } }),
      this.prisma.order.count({ where: { storeId, status: { in: ['accepted', 'ready', 'out_for_delivery'] } } }),
      this.prisma.storeProduct.count({ where: { storeId, isAvailable: true, stock: { lte: LOW_STOCK_AT } } }),
    ]);
    return {
      store: toStoreSummary(store),
      today: { orders: today._count, revenuePaise: today._sum.totalPaise ?? 0 },
      waiting,
      inProgress,
      lowStock,
    };
  }

  /** Closing stops new orders. Orders already placed carry on. */
  @Patch()
  async setOpen(@CurrentUser() user: AuthUser, @Body() dto: SetOpenDto): Promise<StoreSummary> {
    const store = await this.prisma.store.update({
      where: { id: this.storeIdOf(user) },
      data: { isOpen: dto.isOpen },
    });
    return toStoreSummary(store);
  }

  @Get('orders')
  listOrders(@CurrentUser() user: AuthUser, @Query() query: OrdersQueryDto): Promise<Order[]> {
    return this.orders.listForStore(this.storeIdOf(user), query.scope ?? 'active');
  }

  @Post('orders/:id/transition')
  @HttpCode(HttpStatus.OK)
  transition(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDto,
  ): Promise<Order> {
    return this.orders.transition(
      { id: user.id, role: 'store', storeId: this.storeIdOf(user) },
      id,
      dto.to,
      dto.reason,
    );
  }

  @Get('inventory')
  async inventory(@CurrentUser() user: AuthUser): Promise<Inventory> {
    const [categories, rows] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { sort: 'asc' } }),
      this.prisma.storeProduct.findMany({
        where: { storeId: this.storeIdOf(user) },
        include: { product: true },
        orderBy: { product: { name: 'asc' } },
      }),
    ]);
    return {
      categories: categories.map(({ id, slug, name, emoji, sort }) => ({ id, slug, name, emoji, sort })),
      items: rows.map(toInventoryItem),
    };
  }

  /** Catalogue products this store does not stock yet. */
  @Get('inventory/missing')
  async missing(@CurrentUser() user: AuthUser): Promise<CatalogProduct[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, inventory: { none: { storeId: this.storeIdOf(user) } } },
      orderBy: { name: 'asc' },
    });
    return products.map((product) => ({
      productId: product.id,
      categoryId: product.categoryId,
      name: product.name,
      unitLabel: product.unitLabel,
      emoji: product.emoji,
      mrpPaise: product.mrpPaise,
    }));
  }

  @Post('inventory')
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddInventoryDto): Promise<InventoryItem> {
    const storeId = this.storeIdOf(user);
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, isActive: true } });
    if (!product) throw new AppError('product_not_found', HttpStatus.NOT_FOUND);
    const existing = await this.prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId, productId: product.id } },
    });
    if (existing) throw new AppError('already_stocked', HttpStatus.CONFLICT);
    if (dto.pricePaise > product.mrpPaise) throw new AppError('price_above_mrp');
    const row = await this.prisma.storeProduct.create({
      data: { storeId, productId: product.id, pricePaise: dto.pricePaise, stock: dto.stock },
      include: { product: true },
    });
    return toInventoryItem(row);
  }

  @Patch('inventory/:productId')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateInventoryDto,
  ): Promise<InventoryItem> {
    const where = { storeId_productId: { storeId: this.storeIdOf(user), productId } };
    const existing = await this.prisma.storeProduct.findUnique({ where, include: { product: true } });
    if (!existing) throw new AppError('product_not_found', HttpStatus.NOT_FOUND);
    // Selling above the printed maximum retail price is not allowed.
    if (dto.pricePaise !== undefined && dto.pricePaise > existing.product.mrpPaise) {
      throw new AppError('price_above_mrp');
    }
    const row = await this.prisma.storeProduct.update({
      where,
      data: { pricePaise: dto.pricePaise, stock: dto.stock, isAvailable: dto.isAvailable },
      include: { product: true },
    });
    return toInventoryItem(row);
  }
}
