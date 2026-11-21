export type Role = "customer" | "store";

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  area: string;
  city: string;
  pincode: string;
}

export interface Account {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  /** Saved delivery addresses. Only customers use these. */
  addresses: Address[];
  /** The store this account runs. Only store accounts have one. */
  storeId?: string;
  /** Seeded demo account, listed on the sign-in page. */
  demo?: boolean;
}

export type Tint = "tomato" | "mint" | "mango" | "sky" | "berry" | "grape" | "lime";

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  emoji: string;
  tint: Tint;
  area: string;
  city: string;
  rating: number;
  ratingCount: number;
  deliveryMins: number;
  deliveryFee: number;
  minOrder: number;
  open: boolean;
}

export const CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Staples",
  "Snacks & Drinks",
  "Household",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: Category;
  unit: string;
  emoji: string;
  price: number;
  mrp: number;
  stock: number;
  /** At or below this many units the item counts as running low. */
  lowStockAt: number;
  /** Hidden from customers when false. */
  active: boolean;
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "rejected";

export type PaymentMethod = "upi" | "cod";

export interface OrderLine {
  productId: string;
  name: string;
  unit: string;
  emoji: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  code: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: Address;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: PaymentMethod;
  status: OrderStatus;
  placedAt: number;
  history: { status: OrderStatus; at: number }[];
}

export type VendorStage = "active" | "potential";

export interface Vendor {
  id: string;
  storeId: string;
  name: string;
  contact: string;
  phone: string;
  area: string;
  supplies: Category[];
  stage: VendorStage;
  rating: number;
  leadTime: string;
  terms: string;
  /** Amount the store currently owes this vendor. */
  outstanding: number;
  lastDeliveryAt?: number;
  /** Why a potential vendor is worth a look. */
  pitch?: string;
  quoteRequestedAt?: number;
}

export type PurchaseOrderStatus = "sent" | "confirmed" | "received";

export interface PurchaseOrderLine {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  storeId: string;
  vendorId: string;
  lines: PurchaseOrderLine[];
  total: number;
  status: PurchaseOrderStatus;
  createdAt: number;
  expectedAt: number;
}
