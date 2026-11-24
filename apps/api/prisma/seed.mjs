// Resets the database to the demo data: two stores, the catalogue, four demo
// accounts and three sample orders. Everything here is made up.
//
// It DELETES every order and every shelf row first, so it only runs against a
// local database unless you pass --force.
import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const url = process.env.DATABASE_URL ?? '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url) && !process.argv.includes('--force')) {
  console.error('Refusing to seed: DATABASE_URL is not a local database. Pass --force if you mean it.');
  process.exit(1);
}

/** The same key always gives the same id, so re-seeding keeps every id stable. */
function id(key) {
  const hex = createHash('sha1').update(`nukkad:${key}`).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const rupees = (amount) => Math.round(amount * 100);

const STORES = [
  {
    key: 'jayanagar',
    name: 'Nukkad Jayanagar',
    area: 'Jayanagar',
    addressText: '11th Main Road, 4th Block, Jayanagar, Bengaluru 560011',
    phone: '+91 80 5550 0141',
    lat: 12.9299,
    lng: 77.5826,
    prepMinutes: 8,
  },
  {
    key: 'indiranagar',
    name: 'Nukkad Indiranagar',
    area: 'Indiranagar',
    addressText: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
    phone: '+91 80 5550 0138',
    lat: 12.9719,
    lng: 77.6412,
    prepMinutes: 10,
  },
];

// [name, unit, emoji, MRP in rupees]. No brand names: these are generic goods.
const CATALOGUE = [
  ['fruits-vegetables', 'Fruits & Vegetables', '🥬', [
    ['Banana', '6 pcs', '🍌', 48],
    ['Apple', '4 pcs', '🍎', 140],
    ['Tomato', '500 g', '🍅', 30],
    ['Onion', '1 kg', '🧅', 45],
    ['Potato', '1 kg', '🥔', 40],
    ['Carrot', '500 g', '🥕', 35],
    ['Cucumber', '500 g', '🥒', 25],
    ['Lemon', '4 pcs', '🍋', 20],
    ['Coriander', '100 g', '🌿', 15],
    ['Green chilli', '100 g', '🌶️', 12],
    ['Coconut', '1 pc', '🥥', 38],
    ['Mango', '1 kg', '🥭', 120],
  ]],
  ['dairy-bread-eggs', 'Dairy, Bread & Eggs', '🥛', [
    ['Toned milk', '500 ml', '🥛', 28],
    ['Curd', '400 g', '🥣', 40],
    ['Paneer', '200 g', '🧀', 95],
    ['Butter', '100 g', '🧈', 60],
    ['Eggs', '6 pcs', '🥚', 54],
    ['Sandwich bread', '400 g', '🍞', 45],
    ['Cheese slices', '200 g', '🧀', 150],
  ]],
  ['atta-rice-dal', 'Atta, Rice & Dal', '🌾', [
    ['Whole wheat atta', '5 kg', '🌾', 265],
    ['Sona masoori rice', '5 kg', '🍚', 420],
    ['Basmati rice', '1 kg', '🍚', 165],
    ['Toor dal', '1 kg', '🫘', 180],
    ['Moong dal', '500 g', '🫘', 85],
    ['Sugar', '1 kg', '🍬', 52],
    ['Salt', '1 kg', '🧂', 28],
    ['Poha', '500 g', '🥣', 48],
  ]],
  ['oil-ghee-masala', 'Oil, Ghee & Masala', '🫙', [
    ['Sunflower oil', '1 L', '🌻', 155],
    ['Groundnut oil', '1 L', '🥜', 210],
    ['Ghee', '500 ml', '🫙', 340],
    ['Turmeric powder', '100 g', '🟡', 38],
    ['Red chilli powder', '100 g', '🌶️', 55],
    ['Sambar powder', '100 g', '🍲', 65],
    ['Mustard seeds', '100 g', '⚫', 22],
    ['Jeera', '100 g', '🌱', 60],
  ]],
  ['snacks', 'Snacks & Munchies', '🍿', [
    ['Potato chips', '52 g', '🍟', 20],
    ['Banana chips', '150 g', '🍌', 70],
    ['Marie biscuits', '250 g', '🍪', 35],
    ['Cream biscuits', '120 g', '🍪', 30],
    ['Namkeen mixture', '200 g', '🥨', 60],
    ['Roasted peanuts', '200 g', '🥜', 55],
    ['Dark chocolate', '80 g', '🍫', 99],
  ]],
  ['tea-coffee-drinks', 'Tea, Coffee & Drinks', '☕', [
    ['Tea powder', '250 g', '🍵', 140],
    ['Filter coffee powder', '200 g', '☕', 180],
    ['Instant coffee', '50 g', '☕', 165],
    ['Tender coconut water', '200 ml', '🥥', 40],
    ['Mango drink', '600 ml', '🧃', 40],
    ['Cola', '750 ml', '🥤', 40],
    ['Soda', '750 ml', '🫧', 20],
    ['Buttermilk', '200 ml', '🥛', 15],
  ]],
  ['instant-frozen', 'Instant & Frozen', '🍜', [
    ['Instant noodles', '4 pack', '🍜', 56],
    ['Idli dosa batter', '1 kg', '🫓', 75],
    ['Frozen peas', '500 g', '🫛', 95],
    ['Vermicelli', '400 g', '🍝', 45],
    ['Upma mix', '200 g', '🥣', 55],
    ['Vanilla ice cream', '500 ml', '🍨', 130],
    ['Frozen paratha', '5 pcs', '🫓', 99],
  ]],
  ['cleaning-household', 'Cleaning & Household', '🧽', [
    ['Dishwash liquid', '500 ml', '🧴', 105],
    ['Detergent powder', '1 kg', '🧺', 130],
    ['Floor cleaner', '1 L', '🧹', 180],
    ['Toilet cleaner', '500 ml', '🚽', 99],
    ['Garbage bags', '30 pcs', '🗑️', 85],
    ['Scrub pads', '3 pcs', '🧽', 45],
    ['Matchbox', '10 pack', '🔥', 10],
    ['Agarbatti', '1 box', '🪔', 40],
  ]],
  ['personal-care', 'Personal Care', '🧼', [
    ['Bath soap', '4 x 100 g', '🧼', 140],
    ['Shampoo', '180 ml', '🧴', 150],
    ['Toothpaste', '150 g', '🪥', 95],
    ['Hand wash', '200 ml', '🫧', 85],
    ['Coconut hair oil', '200 ml', '🥥', 120],
    ['Sanitary pads', '8 pcs', '🌸', 45],
  ]],
];

/** Products Indiranagar has not put on its shelf, so "add from catalogue" has something to show. */
const NOT_AT_INDIRANAGAR = new Set([
  'Mango|1 kg', 'Groundnut oil|1 L', 'Banana chips|150 g', 'Filter coffee powder|200 g',
  'Idli dosa batter|1 kg', 'Agarbatti|1 box', 'Sona masoori rice|5 kg', 'Coconut|1 pc',
]);
/** `storeKey|name|unit` -> stock, to show the "few left" and "sold out" states. */
const STOCK_OVERRIDES = {
  'jayanagar|Paneer|200 g': 3,
  'jayanagar|Vanilla ice cream|500 ml': 0,
  'jayanagar|Mango|1 kg': 4,
  'indiranagar|Eggs|6 pcs': 2,
  'indiranagar|Dark chocolate|80 g': 0,
};

const productId = (name, unit) => id(`product:${name}|${unit}`);

async function main() {
  await prisma.order.deleteMany();
  await prisma.storeProduct.deleteMany();
  await prisma.address.deleteMany({ where: { user: { email: { endsWith: '@nukkad.test' } } } });
  // Accounts made through sign-up go too; only the demo accounts below survive a reset.
  await prisma.user.deleteMany({ where: { NOT: { email: { endsWith: '@nukkad.test' } } } });

  for (const store of STORES) {
    const { key, ...data } = store;
    const full = { ...data, isOpen: true, deliveryRadiusM: 4500, deliveryFeePaise: rupees(25), freeDeliveryAbovePaise: rupees(299), minOrderPaise: rupees(99) };
    await prisma.store.upsert({ where: { id: id(`store:${key}`) }, create: { id: id(`store:${key}`), ...full }, update: full });
  }

  let index = 0;
  const shelf = [];
  for (const [sort, [slug, name, emoji, products]] of CATALOGUE.entries()) {
    const category = { slug, name, emoji, sort };
    await prisma.category.upsert({ where: { id: id(`category:${slug}`) }, create: { id: id(`category:${slug}`), ...category }, update: category });
    for (const [productName, unitLabel, productEmoji, mrp] of products) {
      const product = { categoryId: id(`category:${slug}`), name: productName, unitLabel, emoji: productEmoji, mrpPaise: rupees(mrp), isActive: true };
      const pid = productId(productName, unitLabel);
      await prisma.product.upsert({ where: { id: pid }, create: { id: pid, ...product }, update: product });

      for (const [storeIndex, store] of STORES.entries()) {
        const tag = `${productName}|${unitLabel}`;
        if (store.key === 'indiranagar' && NOT_AT_INDIRANAGAR.has(tag)) continue;
        // Roughly a third of the shelf sells below the printed price.
        const percentOff = (index + storeIndex) % 3 === 0 ? 5 + ((index * 3 + storeIndex * 4) % 4) * 5 : 0;
        shelf.push({
          storeId: id(`store:${store.key}`),
          productId: pid,
          pricePaise: Math.max(100, Math.round((mrp * (100 - percentOff)) / 100) * 100),
          stock: STOCK_OVERRIDES[`${store.key}|${tag}`] ?? 14 + ((index * 7 + storeIndex * 5) % 40),
        });
      }
      index++;
    }
  }
  await prisma.storeProduct.createMany({ data: shelf });

  const users = [
    { key: 'aditi', role: 'customer', name: 'Aditi Rao', email: 'aditi@nukkad.test', phone: '+91 90000 00101', storeId: null },
    { key: 'rohan', role: 'customer', name: 'Rohan Shetty', email: 'rohan@nukkad.test', phone: '+91 90000 00102', storeId: null },
    { key: 'sunitha', role: 'store', name: 'Sunitha Gowda', email: 'jayanagar@nukkad.test', phone: '+91 90000 00201', storeId: id('store:jayanagar') },
    { key: 'imran', role: 'store', name: 'Imran Khan', email: 'indiranagar@nukkad.test', phone: '+91 90000 00202', storeId: id('store:indiranagar') },
  ];
  for (const { key, ...data } of users) {
    const full = { ...data, status: 'active' };
    await prisma.user.upsert({ where: { email: data.email }, create: { id: id(`user:${key}`), ...full }, update: full });
  }

  const home = { id: id('address:aditi-home'), userId: id('user:aditi'), label: 'Home', line1: '42, 9th Cross', line2: '4th T Block', landmark: 'Opposite the park', area: 'Jayanagar', city: 'Bengaluru', pincode: '560041', lat: 12.9265, lng: 77.5858, isDefault: true };
  const work = { id: id('address:aditi-work'), userId: id('user:aditi'), label: 'Work', line1: '3rd floor, 714 12th Main', line2: 'HAL 2nd Stage', landmark: null, area: 'Indiranagar', city: 'Bengaluru', pincode: '560038', lat: 12.9698, lng: 77.6389, isDefault: false };
  await prisma.address.createMany({ data: [home, work] });

  const priceOf = new Map(shelf.map((row) => [`${row.storeId}|${row.productId}`, row.pricePaise]));
  const infoOf = new Map(CATALOGUE.flatMap(([, , , products]) => products.map(([name, unit, emoji]) => [productId(name, unit), { name, unitLabel: unit, emoji }])));
  const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000);

  async function order({ shortCode, storeKey, address, lines, status, placed, stamps = {}, paymentMethod = 'upi', notes = null }) {
    const storeId = id(`store:${storeKey}`);
    const items = lines.map(([name, unit, qty]) => {
      const pid = productId(name, unit);
      return { productId: pid, ...infoOf.get(pid), unitPricePaise: priceOf.get(`${storeId}|${pid}`), qty };
    });
    const subtotalPaise = items.reduce((sum, item) => sum + item.unitPricePaise * item.qty, 0);
    const deliveryFeePaise = subtotalPaise >= rupees(299) ? 0 : rupees(25);
    await prisma.order.create({
      data: {
        shortCode, customerId: id('user:aditi'), storeId, status, subtotalPaise, deliveryFeePaise,
        totalPaise: subtotalPaise + deliveryFeePaise, paymentMethod, notes,
        dropoffName: 'Aditi Rao', dropoffPhone: '+91 90000 00101',
        dropoffText: [address.line1, address.line2, address.area, `${address.city} ${address.pincode}`].filter(Boolean).join(', ') + (address.landmark ? ` (near ${address.landmark})` : ''),
        dropoffLat: address.lat, dropoffLng: address.lng,
        idempotencyKey: `seed-${shortCode}`, placedAt: placed, ...stamps,
        items: { create: items },
        events: { create: { toStatus: status } },
      },
    });
  }

  await order({
    shortCode: 'NK-7Q4D2', storeKey: 'jayanagar', address: home, status: 'delivered', paymentMethod: 'cash',
    placed: minutesAgo(26 * 60), stamps: { acceptedAt: minutesAgo(26 * 60 - 2), readyAt: minutesAgo(26 * 60 - 9), dispatchedAt: minutesAgo(26 * 60 - 11), deliveredAt: minutesAgo(26 * 60 - 24) },
    lines: [['Toned milk', '500 ml', 2], ['Sandwich bread', '400 g', 1], ['Eggs', '6 pcs', 1], ['Banana', '6 pcs', 1], ['Tea powder', '250 g', 1]],
  });
  await order({
    shortCode: 'NK-M3K8P', storeKey: 'jayanagar', address: home, status: 'placed',
    placed: minutesAgo(2), notes: 'Please ring the bell twice.',
    lines: [['Tomato', '500 g', 2], ['Onion', '1 kg', 1], ['Curd', '400 g', 1], ['Toor dal', '1 kg', 1], ['Sunflower oil', '1 L', 1]],
  });
  await order({
    shortCode: 'NK-X9T5R', storeKey: 'indiranagar', address: work, status: 'accepted',
    placed: minutesAgo(6), stamps: { acceptedAt: minutesAgo(4) },
    lines: [['Instant noodles', '4 pack', 2], ['Cola', '750 ml', 1], ['Potato chips', '52 g', 3], ['Instant coffee', '50 g', 1]],
  });

  const counts = await Promise.all([prisma.store.count(), prisma.category.count(), prisma.product.count(), prisma.storeProduct.count(), prisma.user.count(), prisma.order.count()]);
  console.log(`Seeded: ${counts[0]} stores, ${counts[1]} categories, ${counts[2]} products, ${counts[3]} shelf rows, ${counts[4]} users, ${counts[5]} orders.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
