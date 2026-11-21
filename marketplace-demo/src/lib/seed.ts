// Every name, shop, phone number and address in this file is made up for the demo.
import { DAY, HOUR, MINUTE, startOfDay } from "./format";
import type {
  Account,
  Address,
  Category,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  PurchaseOrder,
  Store,
  Vendor,
} from "./types";

export interface SeedData {
  accounts: Account[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  nextOrderNo: number;
  nextPoNo: number;
}

export const EMPTY_SEED: SeedData = {
  accounts: [],
  stores: [],
  products: [],
  orders: [],
  vendors: [],
  purchaseOrders: [],
  nextOrderNo: 1001,
  nextPoNo: 2001,
};

/** Small deterministic generator, so the demo looks the same on every reset. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// name, category, unit, emoji, MRP
const CATALOGUE = {
  tomato: ["Tomatoes", "Fruits & Vegetables", "500 g", "🍅", 30],
  onion: ["Onions", "Fruits & Vegetables", "1 kg", "🧅", 45],
  potato: ["Potatoes", "Fruits & Vegetables", "1 kg", "🥔", 40],
  banana: ["Bananas", "Fruits & Vegetables", "6 pcs", "🍌", 48],
  apple: ["Shimla apples", "Fruits & Vegetables", "4 pcs", "🍎", 140],
  spinach: ["Spinach", "Fruits & Vegetables", "1 bunch", "🥬", 30],
  carrot: ["Carrots", "Fruits & Vegetables", "500 g", "🥕", 40],
  mango: ["Alphonso mangoes", "Fruits & Vegetables", "1 kg", "🥭", 260],
  lemon: ["Lemons", "Fruits & Vegetables", "250 g", "🍋", 32],
  chilli: ["Green chillies", "Fruits & Vegetables", "100 g", "🌶️", 18],
  coriander: ["Coriander", "Fruits & Vegetables", "1 bunch", "🌿", 15],
  milk: ["Toned milk", "Dairy & Eggs", "500 ml", "🥛", 28],
  curd: ["Fresh curd", "Dairy & Eggs", "400 g", "🥣", 42],
  paneer: ["Paneer", "Dairy & Eggs", "200 g", "🧀", 99],
  butter: ["Salted butter", "Dairy & Eggs", "100 g", "🧈", 60],
  eggs: ["Farm eggs", "Dairy & Eggs", "6 pcs", "🥚", 54],
  ghee: ["Cow ghee", "Dairy & Eggs", "500 ml", "🫙", 380],
  rice: ["Basmati rice", "Staples", "1 kg", "🍚", 155],
  toordal: ["Toor dal", "Staples", "1 kg", "🫘", 175],
  atta: ["Whole wheat atta", "Staples", "5 kg", "🌾", 260],
  oil: ["Sunflower oil", "Staples", "1 L", "🫗", 170],
  sugar: ["Sugar", "Staples", "1 kg", "🍬", 50],
  salt: ["Iodised salt", "Staples", "1 kg", "🧂", 26],
  tea: ["Masala chai tea", "Staples", "250 g", "🍵", 150],
  chips: ["Salted potato chips", "Snacks & Drinks", "52 g", "🍟", 20],
  biscuits: ["Glucose biscuits", "Snacks & Drinks", "100 g", "🍪", 10],
  namkeen: ["Namkeen mixture", "Snacks & Drinks", "200 g", "🥜", 60],
  noodles: ["Instant noodles", "Snacks & Drinks", "4 pack", "🍜", 58],
  juice: ["Mango juice", "Snacks & Drinks", "1 L", "🧃", 115],
  cola: ["Cola", "Snacks & Drinks", "750 ml", "🥤", 40],
  chocolate: ["Milk chocolate bar", "Snacks & Drinks", "50 g", "🍫", 50],
  bread: ["Sandwich bread", "Snacks & Drinks", "400 g", "🍞", 48],
  dishwash: ["Dishwash liquid", "Household", "500 ml", "🧴", 115],
  detergent: ["Detergent powder", "Household", "1 kg", "🧺", 140],
  cleaner: ["Floor cleaner", "Household", "500 ml", "🧽", 95],
  soap: ["Bath soap", "Household", "3 pack", "🧼", 105],
  toothpaste: ["Toothpaste", "Household", "150 g", "🪥", 99],
  tissue: ["Tissue roll", "Household", "4 pack", "🧻", 65],
} as const satisfies Record<string, readonly [string, Category, string, string, number]>;

type CatalogueKey = keyof typeof CATALOGUE;

const LOW_STOCK_AT: Record<Category, number> = {
  "Fruits & Vegetables": 8,
  "Dairy & Eggs": 8,
  Staples: 6,
  "Snacks & Drinks": 10,
  Household: 5,
};

// key, selling price, units in stock
type Assortment = [CatalogueKey, number, number][];

const ASSORTMENTS: Record<string, Assortment> = {
  "s-lakshmi": [
    ["tomato", 26, 40], ["onion", 39, 55], ["potato", 35, 60], ["banana", 42, 18],
    ["lemon", 28, 4], ["coriander", 10, 0], ["milk", 27, 36], ["curd", 38, 14],
    ["paneer", 92, 6], ["eggs", 46, 22], ["butter", 56, 9], ["rice", 139, 25],
    ["toordal", 159, 12], ["atta", 239, 3], ["oil", 155, 16], ["sugar", 46, 30],
    ["salt", 24, 28], ["tea", 135, 11], ["chips", 20, 45], ["biscuits", 10, 60],
    ["noodles", 54, 20], ["cola", 40, 24], ["bread", 42, 5], ["dishwash", 105, 8],
    ["detergent", 129, 10], ["soap", 95, 14], ["toothpaste", 92, 12],
  ],
  "s-greenbasket": [
    ["tomato", 30, 30], ["onion", 45, 35], ["potato", 40, 40], ["banana", 48, 25],
    ["apple", 135, 20], ["spinach", 28, 15], ["carrot", 38, 22], ["mango", 240, 12],
    ["lemon", 32, 18], ["chilli", 16, 20], ["coriander", 14, 25], ["milk", 28, 20],
    ["curd", 42, 10], ["paneer", 99, 7], ["eggs", 54, 15], ["ghee", 360, 6],
    ["rice", 155, 12], ["toordal", 172, 10], ["atta", 255, 8], ["juice", 110, 9],
    ["namkeen", 58, 14], ["bread", 48, 7],
  ],
  "s-dailyneeds": [
    ["milk", 27, 40], ["curd", 40, 18], ["butter", 58, 12], ["eggs", 48, 30],
    ["bread", 45, 16], ["chips", 20, 80], ["biscuits", 10, 90], ["namkeen", 55, 25],
    ["noodles", 56, 35], ["juice", 99, 20], ["cola", 40, 48], ["chocolate", 50, 40],
    ["tea", 140, 9], ["sugar", 48, 22], ["salt", 25, 20], ["oil", 160, 10],
    ["dishwash", 110, 14], ["detergent", 135, 12], ["soap", 99, 20], ["toothpaste", 95, 16],
    ["tissue", 60, 18], ["cleaner", 89, 4], ["onion", 42, 20], ["potato", 38, 25],
    ["banana", 45, 12],
  ],
};

const STORES: Store[] = [
  {
    id: "s-lakshmi",
    ownerId: "o-lakshmi",
    name: "Sri Lakshmi Kirana",
    tagline: "Everyday essentials from your corner shop since 1998",
    emoji: "🛒",
    tint: "tomato",
    area: "Indiranagar",
    city: "Bengaluru",
    rating: 4.6,
    ratingCount: 1240,
    deliveryMins: 20,
    deliveryFee: 25,
    minOrder: 149,
    open: true,
  },
  {
    id: "s-greenbasket",
    ownerId: "o-farhan",
    name: "Green Basket Organics",
    tagline: "Farm-fresh fruit, vegetables and organic staples",
    emoji: "🥬",
    tint: "mint",
    area: "Koramangala",
    city: "Bengaluru",
    rating: 4.8,
    ratingCount: 860,
    deliveryMins: 35,
    deliveryFee: 35,
    minOrder: 249,
    open: true,
  },
  {
    id: "s-dailyneeds",
    ownerId: "o-meera",
    name: "Daily Needs Mart",
    tagline: "Snacks, dairy and household basics, open till midnight",
    emoji: "🧺",
    tint: "mango",
    area: "HSR Layout",
    city: "Bengaluru",
    rating: 4.3,
    ratingCount: 2010,
    deliveryMins: 25,
    deliveryFee: 20,
    minOrder: 99,
    open: true,
  },
];

const ANANYA_HOME: Address = {
  id: "a-ananya-home",
  label: "Home",
  recipient: "Ananya Rao",
  phone: "+91 90000 10001",
  line1: "Flat 302, Lotus Residency",
  line2: "12th Main Road",
  area: "Indiranagar",
  city: "Bengaluru",
  pincode: "560038",
};

const ANANYA_WORK: Address = {
  id: "a-ananya-work",
  label: "Work",
  recipient: "Ananya Rao",
  phone: "+91 90000 10001",
  line1: "4th Floor, Maple Tech Park",
  line2: "80 Feet Road",
  area: "Koramangala",
  city: "Bengaluru",
  pincode: "560095",
};

const ACCOUNTS: Account[] = [
  {
    id: "c-ananya",
    role: "customer",
    name: "Ananya Rao",
    email: "ananya@nukkad.demo",
    phone: "+91 90000 10001",
    addresses: [ANANYA_HOME, ANANYA_WORK],
    demo: true,
  },
  {
    id: "c-kabir",
    role: "customer",
    name: "Kabir Mehta",
    email: "kabir@nukkad.demo",
    phone: "+91 90000 10002",
    addresses: [],
    demo: true,
  },
  {
    id: "o-lakshmi",
    role: "store",
    name: "Lakshmi Narayan",
    email: "lakshmi@nukkad.demo",
    phone: "+91 90000 20001",
    addresses: [],
    storeId: "s-lakshmi",
    demo: true,
  },
  {
    id: "o-farhan",
    role: "store",
    name: "Farhan Sheikh",
    email: "farhan@nukkad.demo",
    phone: "+91 90000 20002",
    addresses: [],
    storeId: "s-greenbasket",
    demo: true,
  },
  {
    id: "o-meera",
    role: "store",
    name: "Meera Iyer",
    email: "meera@nukkad.demo",
    phone: "+91 90000 20003",
    addresses: [],
    storeId: "s-dailyneeds",
    demo: true,
  },
];

// Walk-in names for past orders. These people have no accounts.
const WALK_INS: [string, string, string, string, string][] = [
  ["Rohan Shetty", "18, 2nd Cross", "Defence Colony", "Indiranagar", "560038"],
  ["Divya Nair", "Flat 5B, Sunrise Apartments", "CMH Road", "Indiranagar", "560038"],
  ["Imran Khan", "42, 6th Block", "Near Sony Signal", "Koramangala", "560095"],
  ["Sneha Kulkarni", "Villa 9, Palm Meadows", "27th Main", "HSR Layout", "560102"],
  ["Arjun Reddy", "301, Skyline Heights", "Sector 2", "HSR Layout", "560102"],
  ["Priya Menon", "7, Temple Street", "Domlur", "Indiranagar", "560071"],
  ["Vikram Joshi", "Flat 12, Lakeview Towers", "1st Block", "Koramangala", "560034"],
  ["Fatima Begum", "55, 4th Main", "ST Bed Layout", "Koramangala", "560034"],
  ["Suresh Gowda", "2nd Floor, Gowda Nilaya", "Agara", "HSR Layout", "560102"],
  ["Tanvi Desai", "C-204, Orchid Enclave", "HAL 2nd Stage", "Indiranagar", "560008"],
];

function walkInAddress(index: number): Address {
  const [name, line1, line2, area, pincode] = WALK_INS[index];
  return {
    id: `a-walkin-${index}`,
    label: "Home",
    recipient: name,
    phone: `+91 90000 3${String(index).padStart(4, "0")}`,
    line1,
    line2,
    area,
    city: "Bengaluru",
    pincode,
  };
}

function buildProducts(): Product[] {
  return Object.entries(ASSORTMENTS).flatMap(([storeId, assortment]) =>
    assortment.map(([key, price, stock]) => {
      const [name, category, unit, emoji, mrp] = CATALOGUE[key];
      return {
        id: `${storeId}-${key}`,
        storeId,
        name,
        category,
        unit,
        emoji,
        price,
        mrp,
        stock,
        lowStockAt: LOW_STOCK_AT[category],
        active: true,
      };
    }),
  );
}

const STEP_AFTER_PLACED: [OrderStatus, number][] = [
  ["accepted", 3 * MINUTE],
  ["packed", 11 * MINUTE],
  ["out_for_delivery", 17 * MINUTE],
];

interface OrderDraft {
  storeId: string;
  customerId: string;
  customerName: string;
  address: Address;
  lines: OrderLine[];
  payment: "upi" | "cod";
  status: OrderStatus;
  placedAt: number;
}

function line(product: Product, qty: number): OrderLine {
  return {
    productId: product.id,
    name: product.name,
    unit: product.unit,
    emoji: product.emoji,
    price: product.price,
    qty,
  };
}

function historyFor(status: OrderStatus, placedAt: number, deliveryMins: number) {
  const history: { status: OrderStatus; at: number }[] = [{ status: "placed", at: placedAt }];
  if (status === "placed") return history;
  if (status === "rejected") return [...history, { status, at: placedAt + 4 * MINUTE }];
  for (const [step, offset] of STEP_AFTER_PLACED) {
    history.push({ status: step, at: placedAt + offset });
    if (step === status) return history;
  }
  history.push({ status: "delivered", at: placedAt + (deliveryMins + 6) * MINUTE });
  return history;
}

export function buildSeed(now: number): SeedData {
  const random = mulberry32(20261121);
  const pick = <T,>(list: T[]): T => list[Math.floor(random() * list.length)];
  const products = buildProducts();
  const byStore = (storeId: string) => products.filter((p) => p.storeId === storeId);
  const find = (storeId: string, key: CatalogueKey) => products.find((p) => p.id === `${storeId}-${key}`)!;
  const today = startOfDay(now);
  const drafts: OrderDraft[] = [];

  // A week of delivered orders for every store, so the dashboards have a history.
  for (const store of STORES) {
    const shelf = byStore(store.id);
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const count = 6 + Math.floor(random() * 4);
      for (let i = 0; i < count; i++) {
        const placedAt = today - daysAgo * DAY + 8 * HOUR + Math.floor(random() * 13.5 * HOUR);
        // Today's history stops 90 minutes ago; anything newer is a live order below.
        if (placedAt > now - 90 * MINUTE) continue;
        const who = Math.floor(random() * WALK_INS.length);
        const lineCount = 1 + Math.floor(random() * 5);
        const chosen = new Map<string, OrderLine>();
        for (let n = 0; n < lineCount; n++) {
          const product = pick(shelf);
          chosen.set(product.id, line(product, 1 + Math.floor(random() * 3)));
        }
        drafts.push({
          storeId: store.id,
          customerId: `walkin-${who}`,
          customerName: WALK_INS[who][0],
          address: walkInAddress(who),
          lines: [...chosen.values()],
          payment: random() < 0.65 ? "upi" : "cod",
          status: random() < 0.04 ? "rejected" : "delivered",
          placedAt,
        });
      }
    }
  }

  // Ananya's own past orders, so her order history is not empty.
  drafts.push(
    {
      storeId: "s-lakshmi",
      customerId: "c-ananya",
      customerName: "Ananya Rao",
      address: ANANYA_HOME,
      lines: [line(find("s-lakshmi", "rice"), 1), line(find("s-lakshmi", "toordal"), 1), line(find("s-lakshmi", "oil"), 1)],
      payment: "upi",
      status: "delivered",
      placedAt: today - 2 * DAY + 18.5 * HOUR,
    },
    {
      storeId: "s-greenbasket",
      customerId: "c-ananya",
      customerName: "Ananya Rao",
      address: ANANYA_WORK,
      lines: [line(find("s-greenbasket", "mango"), 1), line(find("s-greenbasket", "apple"), 1), line(find("s-greenbasket", "spinach"), 2)],
      payment: "cod",
      status: "delivered",
      placedAt: today - 5 * DAY + 11.25 * HOUR,
    },
  );

  // Live orders, in every stage, so there is something to act on straight away.
  drafts.push(
    {
      storeId: "s-lakshmi",
      customerId: "walkin-0",
      customerName: WALK_INS[0][0],
      address: walkInAddress(0),
      lines: [line(find("s-lakshmi", "milk"), 2), line(find("s-lakshmi", "bread"), 1), line(find("s-lakshmi", "eggs"), 1), line(find("s-lakshmi", "butter"), 1)],
      payment: "upi",
      status: "placed",
      placedAt: now - 6 * MINUTE,
    },
    {
      storeId: "s-lakshmi",
      customerId: "c-ananya",
      customerName: "Ananya Rao",
      address: ANANYA_HOME,
      lines: [line(find("s-lakshmi", "tomato"), 2), line(find("s-lakshmi", "onion"), 1), line(find("s-lakshmi", "paneer"), 1), line(find("s-lakshmi", "curd"), 1)],
      payment: "upi",
      status: "accepted",
      placedAt: now - 9 * MINUTE,
    },
    {
      storeId: "s-lakshmi",
      customerId: "walkin-1",
      customerName: WALK_INS[1][0],
      address: walkInAddress(1),
      lines: [line(find("s-lakshmi", "atta"), 1), line(find("s-lakshmi", "sugar"), 2), line(find("s-lakshmi", "tea"), 1)],
      payment: "cod",
      status: "packed",
      placedAt: now - 15 * MINUTE,
    },
    {
      storeId: "s-lakshmi",
      customerId: "walkin-9",
      customerName: WALK_INS[9][0],
      address: walkInAddress(9),
      lines: [line(find("s-lakshmi", "detergent"), 1), line(find("s-lakshmi", "soap"), 1), line(find("s-lakshmi", "chips"), 4), line(find("s-lakshmi", "cola"), 2)],
      payment: "upi",
      status: "out_for_delivery",
      placedAt: now - 24 * MINUTE,
    },
    {
      storeId: "s-greenbasket",
      customerId: "walkin-2",
      customerName: WALK_INS[2][0],
      address: walkInAddress(2),
      lines: [line(find("s-greenbasket", "banana"), 1), line(find("s-greenbasket", "carrot"), 2), line(find("s-greenbasket", "ghee"), 1)],
      payment: "upi",
      status: "placed",
      placedAt: now - 8 * MINUTE,
    },
    {
      storeId: "s-dailyneeds",
      customerId: "walkin-4",
      customerName: WALK_INS[4][0],
      address: walkInAddress(4),
      lines: [line(find("s-dailyneeds", "noodles"), 2), line(find("s-dailyneeds", "chocolate"), 3), line(find("s-dailyneeds", "juice"), 1)],
      payment: "cod",
      status: "accepted",
      placedAt: now - 12 * MINUTE,
    },
  );

  drafts.sort((a, b) => a.placedAt - b.placedAt);
  const storeById = new Map(STORES.map((s) => [s.id, s]));
  const orders: Order[] = drafts.map((draft, index) => {
    const store = storeById.get(draft.storeId)!;
    const subtotal = draft.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    return {
      id: `ord-${index + 1}`,
      code: `NK-${1001 + index}`,
      storeId: draft.storeId,
      customerId: draft.customerId,
      customerName: draft.customerName,
      customerPhone: draft.address.phone,
      address: draft.address,
      lines: draft.lines,
      subtotal,
      deliveryFee: store.deliveryFee,
      total: subtotal + store.deliveryFee,
      payment: draft.payment,
      status: draft.status,
      placedAt: draft.placedAt,
      history: historyFor(draft.status, draft.placedAt, store.deliveryMins),
    };
  });

  const vendors: Vendor[] = [
    {
      id: "v-kaveri",
      storeId: "s-lakshmi",
      name: "Kaveri Dairy Distributors",
      contact: "Ravi Kumar",
      phone: "+91 90000 40001",
      area: "Ulsoor",
      supplies: ["Dairy & Eggs"],
      stage: "active",
      rating: 4.7,
      leadTime: "Daily, by 6:30 am",
      terms: "Settled weekly",
      outstanding: 8400,
      lastDeliveryAt: today + 6.2 * HOUR < now ? today + 6.2 * HOUR : today - DAY + 6.2 * HOUR,
    },
    {
      id: "v-venkateshwara",
      storeId: "s-lakshmi",
      name: "Sri Venkateshwara Traders",
      contact: "Mahesh Babu",
      phone: "+91 90000 40002",
      area: "KR Market",
      supplies: ["Staples"],
      stage: "active",
      rating: 4.4,
      leadTime: "Next day",
      terms: "Net 15 days",
      outstanding: 23750,
      lastDeliveryAt: today - 3 * DAY + 11 * HOUR,
    },
    {
      id: "v-freshroute",
      storeId: "s-lakshmi",
      name: "FreshRoute Farms",
      contact: "Shilpa Gowda",
      phone: "+91 90000 40003",
      area: "Hoskote",
      supplies: ["Fruits & Vegetables"],
      stage: "active",
      rating: 4.2,
      leadTime: "Same day before 10 am",
      terms: "Pay on delivery",
      outstanding: 0,
      lastDeliveryAt: today - DAY + 7 * HOUR,
    },
    {
      id: "v-bharat",
      storeId: "s-lakshmi",
      name: "Bharat FMCG Agencies",
      contact: "Anil Agarwal",
      phone: "+91 90000 40004",
      area: "Peenya",
      supplies: ["Snacks & Drinks", "Household"],
      stage: "active",
      rating: 4.0,
      leadTime: "2 to 3 days",
      terms: "Net 30 days",
      outstanding: 41200,
      lastDeliveryAt: today - 6 * DAY + 15 * HOUR,
    },
    {
      id: "v-mandya",
      storeId: "s-lakshmi",
      name: "Mandya Farm Collective",
      contact: "Basavaraj Patil",
      phone: "+91 90000 40005",
      area: "Mandya",
      supplies: ["Fruits & Vegetables"],
      stage: "potential",
      rating: 4.5,
      leadTime: "Next day",
      terms: "Net 7 days",
      outstanding: 0,
      pitch: "Quoted about 8% below what you pay for vegetables now, with farm pickup every morning.",
    },
    {
      id: "v-aarogya",
      storeId: "s-lakshmi",
      name: "Aarogya Organics",
      contact: "Nisha Bhat",
      phone: "+91 90000 40006",
      area: "Yelahanka",
      supplies: ["Staples"],
      stage: "potential",
      rating: 4.6,
      leadTime: "2 to 3 days",
      terms: "Advance for first order",
      outstanding: 0,
      pitch: "Carries organic atta, millets and pulses that customers nearby search for and you do not stock yet.",
    },
    {
      id: "v-deccan",
      storeId: "s-lakshmi",
      name: "Deccan Beverages",
      contact: "Joseph D'Souza",
      phone: "+91 90000 40007",
      area: "Whitefield",
      supplies: ["Snacks & Drinks"],
      stage: "potential",
      rating: 4.1,
      leadTime: "Next day",
      terms: "Net 21 days",
      outstanding: 0,
      pitch: "Distributes regional juice and soda brands. Minimum order of ₹5,000, with a free display fridge.",
    },
    {
      id: "v-quickpack",
      storeId: "s-lakshmi",
      name: "QuickPack Supplies",
      contact: "Harpreet Singh",
      phone: "+91 90000 40008",
      area: "Bommasandra",
      supplies: ["Household"],
      stage: "potential",
      rating: 3.9,
      leadTime: "Same day",
      terms: "45 days credit on first three orders",
      outstanding: 0,
      pitch: "Cleaning supplies and delivery packaging in one drop, with long credit while you try them out.",
    },
    {
      id: "v-nilgiri",
      storeId: "s-greenbasket",
      name: "Nilgiri Hills Produce",
      contact: "Kavitha Raman",
      phone: "+91 90000 40011",
      area: "Ooty",
      supplies: ["Fruits & Vegetables"],
      stage: "active",
      rating: 4.8,
      leadTime: "Next day",
      terms: "Settled weekly",
      outstanding: 12600,
      lastDeliveryAt: today - DAY + 6 * HOUR,
    },
    {
      id: "v-gokul",
      storeId: "s-greenbasket",
      name: "Gokul Organic Dairy",
      contact: "Pradeep Rao",
      phone: "+91 90000 40012",
      area: "Devanahalli",
      supplies: ["Dairy & Eggs"],
      stage: "active",
      rating: 4.5,
      leadTime: "Daily, by 7 am",
      terms: "Settled weekly",
      outstanding: 5300,
      lastDeliveryAt: today - DAY + 7 * HOUR,
    },
    {
      id: "v-sahyadri",
      storeId: "s-greenbasket",
      name: "Sahyadri Millets",
      contact: "Ashwini Hegde",
      phone: "+91 90000 40013",
      area: "Tumakuru",
      supplies: ["Staples"],
      stage: "potential",
      rating: 4.4,
      leadTime: "2 to 3 days",
      terms: "Net 15 days",
      outstanding: 0,
      pitch: "Stone-ground millet flours and unpolished rice, sold in the pack sizes your shoppers already buy.",
    },
    {
      id: "v-metro",
      storeId: "s-dailyneeds",
      name: "Metro Wholesale Agencies",
      contact: "Sanjay Jain",
      phone: "+91 90000 40021",
      area: "Chickpet",
      supplies: ["Snacks & Drinks", "Household", "Staples"],
      stage: "active",
      rating: 4.1,
      leadTime: "Next day",
      terms: "Net 21 days",
      outstanding: 36900,
      lastDeliveryAt: today - 2 * DAY + 13 * HOUR,
    },
    {
      id: "v-sunrise",
      storeId: "s-dailyneeds",
      name: "Sunrise Bakers",
      contact: "Thomas Mathew",
      phone: "+91 90000 40022",
      area: "BTM Layout",
      supplies: ["Snacks & Drinks"],
      stage: "potential",
      rating: 4.3,
      leadTime: "Daily, by 6 am",
      terms: "Pay on delivery",
      outstanding: 0,
      pitch: "Fresh bread, buns and rusk delivered before you open, with unsold stock taken back.",
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "po-1",
      code: "PO-2001",
      storeId: "s-lakshmi",
      vendorId: "v-kaveri",
      lines: [
        { productId: "s-lakshmi-milk", name: "Toned milk", unit: "500 ml", qty: 60, unitCost: 23 },
        { productId: "s-lakshmi-curd", name: "Fresh curd", unit: "400 g", qty: 24, unitCost: 31 },
      ],
      total: 60 * 23 + 24 * 31,
      status: "received",
      createdAt: today - 3 * DAY + 16 * HOUR,
      expectedAt: today - 2 * DAY + 6.5 * HOUR,
    },
    {
      id: "po-2",
      code: "PO-2002",
      storeId: "s-lakshmi",
      vendorId: "v-venkateshwara",
      lines: [
        { productId: "s-lakshmi-atta", name: "Whole wheat atta", unit: "5 kg", qty: 20, unitCost: 205 },
        { productId: "s-lakshmi-toordal", name: "Toor dal", unit: "1 kg", qty: 15, unitCost: 132 },
      ],
      total: 20 * 205 + 15 * 132,
      status: "confirmed",
      createdAt: today - DAY + 17 * HOUR,
      expectedAt: today + DAY + 11 * HOUR,
    },
  ];

  return {
    accounts: ACCOUNTS,
    stores: STORES,
    products,
    orders,
    vendors,
    purchaseOrders,
    nextOrderNo: 1001 + orders.length,
    nextPoNo: 2003,
  };
}
