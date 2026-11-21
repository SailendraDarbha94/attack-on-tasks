"use client";

// The demo's "backend": everything lives in this browser's localStorage, shared
// across tabs, so an order placed as a customer shows up in the store dashboard.
// Swap these actions for real API calls when a server exists.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DAY } from "./format";
import { buildSeed, EMPTY_SEED, type SeedData } from "./seed";
import type {
  Account,
  Address,
  Category,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  PurchaseOrder,
  PurchaseOrderLine,
  Role,
  Store,
  Vendor,
} from "./types";

export const DB_KEY = "nukkad-demo-db-v1";

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export interface NewAccountInput {
  role: Role;
  name: string;
  email: string;
  phone: string;
  storeName?: string;
  storeArea?: string;
}

export interface ProductInput {
  id?: string;
  storeId: string;
  name: string;
  category: Category;
  unit: string;
  emoji: string;
  price: number;
  mrp: number;
  stock: number;
  lowStockAt: number;
  active: boolean;
}

export interface PlaceOrderInput {
  storeId: string;
  customer: Account;
  address: Address;
  lines: { productId: string; qty: number }[];
  payment: PaymentMethod;
}

export interface NewVendorInput {
  storeId: string;
  name: string;
  contact: string;
  phone: string;
  area: string;
  supplies: Category[];
  terms: string;
  leadTime: string;
}

interface DbActions {
  createAccount: (input: NewAccountInput) => Account;
  addAddress: (accountId: string, address: Omit<Address, "id">) => Address;
  removeAddress: (accountId: string, addressId: string) => void;
  placeOrder: (input: PlaceOrderInput) => Order | null;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  saveProduct: (input: ProductInput) => void;
  setStoreOpen: (storeId: string, open: boolean) => void;
  createVendor: (input: NewVendorInput) => void;
  activateVendor: (vendorId: string) => void;
  requestQuote: (vendorId: string) => void;
  createPurchaseOrder: (storeId: string, vendorId: string, lines: PurchaseOrderLine[]) => void;
  receivePurchaseOrder: (purchaseOrderId: string) => void;
  resetDemo: () => void;
}

export type Db = SeedData & DbActions;

export const useDb = create<Db>()(
  persist(
    (set, get) => ({
      // The server render never shows data (see BrowserApp), so it starts empty
      // and never needs the clock. The browser seeds itself on first load.
      ...(typeof window === "undefined" ? EMPTY_SEED : buildSeed(Date.now())),

      createAccount(input) {
        const account: Account = {
          id: newId(input.role === "store" ? "o" : "c"),
          role: input.role,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          addresses: [],
        };
        if (input.role !== "store") {
          set((s) => ({ accounts: [...s.accounts, account] }));
          return account;
        }
        const store: Store = {
          id: newId("s"),
          ownerId: account.id,
          name: input.storeName?.trim() || `${account.name.split(" ")[0]}'s Store`,
          tagline: "New on Nukkad",
          emoji: "🏪",
          tint: "sky",
          area: input.storeArea?.trim() || "Bengaluru",
          city: "Bengaluru",
          rating: 0,
          ratingCount: 0,
          deliveryMins: 30,
          deliveryFee: 25,
          minOrder: 99,
          open: true,
        };
        account.storeId = store.id;
        set((s) => ({ accounts: [...s.accounts, account], stores: [...s.stores, store] }));
        return account;
      },

      addAddress(accountId, address) {
        const saved: Address = { ...address, id: newId("a") };
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, addresses: [...a.addresses, saved] } : a,
          ),
        }));
        return saved;
      },

      removeAddress(accountId, addressId) {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, addresses: a.addresses.filter((x) => x.id !== addressId) } : a,
          ),
        }));
      },

      placeOrder({ storeId, customer, address, lines, payment }) {
        const state = get();
        const store = state.stores.find((s) => s.id === storeId);
        if (!store) return null;
        // Never sell more than the shelf holds, whatever the cart says.
        const orderLines = lines.flatMap(({ productId, qty }) => {
          const product = state.products.find((p) => p.id === productId && p.storeId === storeId);
          const allowed = product?.active ? Math.min(qty, product.stock) : 0;
          return product && allowed > 0
            ? [{ productId, name: product.name, unit: product.unit, emoji: product.emoji, price: product.price, qty: allowed }]
            : [];
        });
        if (orderLines.length === 0) return null;
        const now = Date.now();
        const subtotal = orderLines.reduce((sum, l) => sum + l.price * l.qty, 0);
        const order: Order = {
          id: newId("ord"),
          code: `NK-${state.nextOrderNo}`,
          storeId,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: address.phone || customer.phone,
          address,
          lines: orderLines,
          subtotal,
          deliveryFee: store.deliveryFee,
          total: subtotal + store.deliveryFee,
          payment,
          status: "placed",
          placedAt: now,
          history: [{ status: "placed", at: now }],
        };
        const sold = new Map(orderLines.map((l) => [l.productId, l.qty]));
        set((s) => ({
          orders: [...s.orders, order],
          nextOrderNo: s.nextOrderNo + 1,
          products: s.products.map((p) => (sold.has(p.id) ? { ...p, stock: p.stock - sold.get(p.id)! } : p)),
        }));
        return order;
      },

      setOrderStatus(orderId, status) {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status === status) return;
        const now = Date.now();
        // A rejected order puts its items back on the shelf.
        const returned = status === "rejected" ? new Map(order.lines.map((l) => [l.productId, l.qty])) : null;
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status, history: [...o.history, { status, at: now }] } : o,
          ),
          products: returned
            ? s.products.map((p) => (returned.has(p.id) ? { ...p, stock: p.stock + returned.get(p.id)! } : p))
            : s.products,
        }));
      },

      saveProduct(input) {
        const product: Product = { ...input, id: input.id ?? newId(input.storeId) };
        set((s) => ({
          products: input.id
            ? s.products.map((p) => (p.id === input.id ? product : p))
            : [...s.products, product],
        }));
      },

      setStoreOpen(storeId, open) {
        set((s) => ({ stores: s.stores.map((x) => (x.id === storeId ? { ...x, open } : x)) }));
      },

      createVendor(input) {
        const vendor: Vendor = { ...input, id: newId("v"), stage: "active", rating: 0, outstanding: 0 };
        set((s) => ({ vendors: [...s.vendors, vendor] }));
      },

      activateVendor(vendorId) {
        set((s) => ({
          vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, stage: "active" as const } : v)),
        }));
      },

      requestQuote(vendorId) {
        const now = Date.now();
        set((s) => ({
          vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, quoteRequestedAt: now } : v)),
        }));
      },

      createPurchaseOrder(storeId, vendorId, lines) {
        const now = Date.now();
        const purchaseOrder: PurchaseOrder = {
          id: newId("po"),
          code: `PO-${get().nextPoNo}`,
          storeId,
          vendorId,
          lines,
          total: lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0),
          status: "sent",
          createdAt: now,
          expectedAt: now + DAY,
        };
        set((s) => ({ purchaseOrders: [...s.purchaseOrders, purchaseOrder], nextPoNo: s.nextPoNo + 1 }));
      },

      receivePurchaseOrder(purchaseOrderId) {
        const purchaseOrder = get().purchaseOrders.find((p) => p.id === purchaseOrderId);
        if (!purchaseOrder || purchaseOrder.status === "received") return;
        const now = Date.now();
        const arrived = new Map(purchaseOrder.lines.map((l) => [l.productId, l.qty]));
        set((s) => ({
          purchaseOrders: s.purchaseOrders.map((p) =>
            p.id === purchaseOrderId ? { ...p, status: "received" as const } : p,
          ),
          // Stock that arrives goes straight onto the shelf, and the vendor is owed for it.
          products: s.products.map((p) => (arrived.has(p.id) ? { ...p, stock: p.stock + arrived.get(p.id)! } : p)),
          vendors: s.vendors.map((v) =>
            v.id === purchaseOrder.vendorId
              ? { ...v, outstanding: v.outstanding + purchaseOrder.total, lastDeliveryAt: now }
              : v,
          ),
        }));
      },

      resetDemo() {
        set(buildSeed(Date.now()));
      },
    }),
    {
      name: DB_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type StockState = "out" | "low" | "ok";

export function stockState(product: Pick<Product, "stock" | "lowStockAt">): StockState {
  if (product.stock <= 0) return "out";
  return product.stock <= product.lowStockAt ? "low" : "ok";
}

export const OPEN_STATUSES: OrderStatus[] = ["placed", "accepted", "packed", "out_for_delivery"];

export function isOpenOrder(order: Order): boolean {
  return OPEN_STATUSES.includes(order.status);
}
