import type { OrderStatus, PaymentMethod } from './order';
import type { Role } from './roles';

/** The shapes the API sends and receives. Timestamps are ISO strings. */

export type StoreSummary = {
  id: string;
  name: string;
  area: string;
  addressText: string;
  phone: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  deliveryRadiusM: number;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number | null;
  minOrderPaise: number;
  /** Minutes the store needs to pack an order. */
  prepMinutes: number;
};

export type CatalogCategory = { id: string; slug: string; name: string; emoji: string; sort: number };

export type CatalogItem = {
  productId: string;
  categoryId: string;
  name: string;
  /** What one unit is: "500 g", "1 L", "6 pcs". */
  unitLabel: string;
  emoji: string;
  description: string | null;
  /** The printed maximum retail price. */
  mrpPaise: number;
  /** What this store charges. */
  pricePaise: number;
  /** How many one order may take right now. 0 means sold out. */
  maxQty: number;
};

export type Catalog = { store: StoreSummary; categories: CatalogCategory[]; items: CatalogItem[] };

export type Me = {
  id: string;
  role: Role;
  status: 'active' | 'suspended';
  name: string;
  email: string;
  phone: string | null;
  /** The store a store account works at. Null for everyone else. */
  store: StoreSummary | null;
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  area: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
};

export type AddressInput = {
  label: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  area: string;
  city?: string;
  pincode: string;
  lat: number;
  lng: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  unitLabel: string;
  emoji: string;
  unitPricePaise: number;
  qty: number;
};

export type Order = {
  id: string;
  shortCode: string;
  status: OrderStatus;
  store: { id: string; name: string; area: string; phone: string };
  items: OrderItem[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  dropoff: { name: string; phone: string | null; text: string; lat: number; lng: number };
  notes: string | null;
  placedAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
};

export type PlaceOrderInput = {
  storeId: string;
  addressId: string;
  items: { productId: string; qty: number }[];
  paymentMethod: PaymentMethod;
  notes?: string;
  /** Sent again on a retry, so a flaky connection cannot place the order twice. */
  idempotencyKey: string;
};

/** A store's own view of one product on its shelf. */
export type InventoryItem = {
  productId: string;
  categoryId: string;
  name: string;
  unitLabel: string;
  emoji: string;
  mrpPaise: number;
  pricePaise: number;
  stock: number;
  isAvailable: boolean;
};

/** Every category, and everything on the store's shelf, on offer or not. */
export type Inventory = { categories: CatalogCategory[]; items: InventoryItem[] };

/** A catalogue product the store does not stock yet. */
export type CatalogProduct = {
  productId: string;
  categoryId: string;
  name: string;
  unitLabel: string;
  emoji: string;
  mrpPaise: number;
};

export type StoreDashboard = {
  store: StoreSummary;
  /** Since midnight, India time. Rejected and cancelled orders are left out. */
  today: { orders: number; revenuePaise: number };
  waiting: number;
  inProgress: number;
  lowStock: number;
};

export type Session = { token: string; me: Me };

/** One-tap accounts on the demo sign-in screen. */
export type DemoAccount = { email: string; name: string; role: Role; note: string };
