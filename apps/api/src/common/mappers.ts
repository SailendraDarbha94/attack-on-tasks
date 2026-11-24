import type {
  Address as AddressDto,
  Me,
  Order as OrderDto,
  StoreSummary,
} from '@nukkad/core';
import type { Address, Order, OrderItem, Store, User } from '@prisma/client';

/** Database rows to the shapes in @nukkad/core. Nothing else leaves the API. */

export function toStoreSummary(store: Store): StoreSummary {
  return {
    id: store.id,
    name: store.name,
    area: store.area,
    addressText: store.addressText,
    phone: store.phone,
    lat: store.lat,
    lng: store.lng,
    isOpen: store.isOpen,
    deliveryRadiusM: store.deliveryRadiusM,
    deliveryFeePaise: store.deliveryFeePaise,
    freeDeliveryAbovePaise: store.freeDeliveryAbovePaise,
    minOrderPaise: store.minOrderPaise,
    prepMinutes: store.prepMinutes,
  };
}

export function toMe(user: User & { store: Store | null }): Me {
  return {
    id: user.id,
    role: user.role,
    status: user.status,
    name: user.name,
    email: user.email,
    phone: user.phone,
    store: user.store ? toStoreSummary(user.store) : null,
  };
}

export function toAddress(address: Address): AddressDto {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    area: address.area,
    city: address.city,
    pincode: address.pincode,
    lat: address.lat,
    lng: address.lng,
    isDefault: address.isDefault,
  };
}

/** One line a delivery person can read: house, street, area, city and pincode. */
export function addressText(address: Address): string {
  const parts = [address.line1, address.line2, address.area, `${address.city} ${address.pincode}`];
  const text = parts.filter((part) => part && part.trim().length > 0).join(', ');
  return address.landmark ? `${text} (near ${address.landmark})` : text;
}

/** What every order query must load for `toOrder`. */
export const ORDER_INCLUDE = {
  items: true,
  store: { select: { id: true, name: true, area: true, phone: true } },
} as const;

export type OrderRow = Order & {
  items: OrderItem[];
  store: Pick<Store, 'id' | 'name' | 'area' | 'phone'>;
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export function toOrder(order: OrderRow): OrderDto {
  return {
    id: order.id,
    shortCode: order.shortCode,
    status: order.status,
    store: order.store,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      unitLabel: item.unitLabel,
      emoji: item.emoji,
      unitPricePaise: item.unitPricePaise,
      qty: item.qty,
    })),
    subtotalPaise: order.subtotalPaise,
    deliveryFeePaise: order.deliveryFeePaise,
    totalPaise: order.totalPaise,
    paymentMethod: order.paymentMethod,
    dropoff: {
      name: order.dropoffName,
      phone: order.dropoffPhone,
      text: order.dropoffText,
      lat: order.dropoffLat,
      lng: order.dropoffLng,
    },
    notes: order.notes,
    placedAt: order.placedAt.toISOString(),
    acceptedAt: iso(order.acceptedAt),
    readyAt: iso(order.readyAt),
    dispatchedAt: iso(order.dispatchedAt),
    deliveredAt: iso(order.deliveredAt),
    cancelledAt: iso(order.cancelledAt),
    cancelReason: order.cancelReason,
  };
}
