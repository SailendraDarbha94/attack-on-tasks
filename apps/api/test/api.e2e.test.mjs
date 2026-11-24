// End-to-end checks against a running API and a freshly seeded database:
//
//   pnpm db:seed && pnpm --filter @nukkad/api dev      (one terminal)
//   pnpm --filter @nukkad/api test:e2e                 (another)
//
// The tests place and move real orders, so seed again before a second run.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, it } from 'node:test';

const API = process.env.API_URL ?? 'http://localhost:4000';

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Fastify rejects a JSON content type with no body, so only send it with one.
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

const signIn = async (email) => (await call('POST', '/auth/dev/sign-in', { body: { email } })).data.token;
const key = () => randomUUID();

let customer, jayanagarDesk, indiranagarDesk, jayanagar, indiranagar, catalog, address;
const item = (name) => catalog.items.find((i) => i.name === name);
const stockOf = async (name) =>
  (await call('GET', '/store/inventory', { token: jayanagarDesk })).data.items.find((i) => i.name === name).stock;

before(async () => {
  const health = await call('GET', '/health').catch(() => null);
  assert.equal(health?.status, 200, `The API is not running at ${API}`);
  [customer, jayanagarDesk, indiranagarDesk] = await Promise.all(
    ['rohan@nukkad.test', 'jayanagar@nukkad.test', 'indiranagar@nukkad.test'].map(signIn),
  );
  const stores = (await call('GET', '/stores')).data;
  jayanagar = stores.find((s) => s.area === 'Jayanagar');
  indiranagar = stores.find((s) => s.area === 'Indiranagar');
  catalog = (await call('GET', `/stores/${jayanagar.id}/catalog`)).data;
});

describe('public catalogue', () => {
  it('lists both stores', () => {
    assert.ok(jayanagar && indiranagar);
  });

  it('shows a store its own prices and hides nothing a customer can buy', () => {
    assert.ok(catalog.items.length > 60);
    assert.ok(catalog.categories.length >= 8);
    assert.equal(item('Vanilla ice cream').maxQty, 0, 'sold-out products stay listed');
    assert.equal(item('Paneer').maxQty, 3, 'low stock caps the quantity');
  });

  it('answers 404 for a store that does not exist', async () => {
    const { status, data } = await call('GET', `/stores/${randomUUID()}/catalog`);
    assert.equal(status, 404);
    assert.equal(data.code, 'store_not_found');
  });
});

describe('sign-in and roles', () => {
  it('refuses requests with no token or a bad one', async () => {
    assert.equal((await call('GET', '/me')).status, 401);
    assert.equal((await call('GET', '/me', { token: 'not-a-token' })).status, 401);
  });

  it('returns the signed-in account', async () => {
    const { data } = await call('GET', '/me', { token: customer });
    assert.equal(data.email, 'rohan@nukkad.test');
    assert.equal(data.role, 'customer');
    assert.equal(data.store, null);
  });

  it('keeps customers out of the store routes and stores out of customer routes', async () => {
    assert.equal((await call('GET', '/store/dashboard', { token: customer })).status, 403);
    assert.equal((await call('GET', '/orders', { token: jayanagarDesk })).status, 403);
  });

  it('signs up a new customer and rejects a repeated email', async () => {
    const email = `test-${Date.now()}@example.com`;
    const first = await call('POST', '/auth/dev/sign-up', { body: { name: 'Test Person', email, phone: '+91 98765 43210' } });
    assert.equal(first.status, 201);
    assert.equal(first.data.me.role, 'customer');
    const again = await call('POST', '/auth/dev/sign-up', { body: { name: 'Test Person', email, phone: '+91 98765 43210' } });
    assert.equal(again.status, 409);
    assert.equal(again.data.code, 'email_taken');
  });
});

describe('addresses', () => {
  it('starts with none, then makes the newest address the default', async () => {
    assert.deepEqual((await call('GET', '/me/addresses', { token: customer })).data, []);
    const base = { label: 'Home', line1: '18, 2nd Main', area: 'JP Nagar', pincode: '560078', lat: 12.9063, lng: 77.5857 };
    address = (await call('POST', '/me/addresses', { token: customer, body: base })).data;
    assert.equal(address.isDefault, true);
    assert.equal(address.city, 'Bengaluru');
    const far = (await call('POST', '/me/addresses', {
      token: customer,
      body: { ...base, label: 'Whitefield', area: 'Whitefield', pincode: '560066', lat: 12.9698, lng: 77.75 },
    })).data;
    const list = (await call('GET', '/me/addresses', { token: customer })).data;
    assert.deepEqual(list.map((a) => [a.label, a.isDefault]), [['Whitefield', true], ['Home', false]]);
    address.farId = far.id;
  });

  it('rejects a bad pincode', async () => {
    const { status } = await call('POST', '/me/addresses', {
      token: customer,
      body: { label: 'X', line1: '1 Road', area: 'Area', pincode: '12', lat: 12.9, lng: 77.5 },
    });
    assert.equal(status, 400);
  });
});

describe('placing an order', () => {
  const order = (items, overrides = {}) => ({
    storeId: jayanagar.id,
    addressId: address.id,
    items,
    paymentMethod: 'cash',
    idempotencyKey: key(),
    ...overrides,
  });

  it('prices from the database, charges delivery below the free threshold, and takes the stock', async () => {
    const before = await stockOf('Onion');
    const body = order([{ productId: item('Onion').productId, qty: 2 }, { productId: item('Curd').productId, qty: 1 }]);
    const { status, data } = await call('POST', '/orders', { token: customer, body });
    assert.equal(status, 201);
    const subtotal = item('Onion').pricePaise * 2 + item('Curd').pricePaise;
    assert.equal(data.subtotalPaise, subtotal);
    assert.equal(data.deliveryFeePaise, 2500);
    assert.equal(data.totalPaise, subtotal + 2500);
    assert.equal(data.status, 'placed');
    assert.match(data.shortCode, /^NK-[2-9A-HJ-NP-Z]{5}$/);
    assert.match(data.dropoff.text, /JP Nagar, Bengaluru 560078/);
    assert.equal(await stockOf('Onion'), before - 2);

    const retry = await call('POST', '/orders', { token: customer, body });
    assert.equal(retry.data.id, data.id, 'the same key returns the same order');
    assert.equal(await stockOf('Onion'), before - 2, 'and takes no more stock');
  });

  it('delivers free at the threshold', async () => {
    const { data } = await call('POST', '/orders', {
      token: customer,
      body: order([{ productId: item('Ghee').productId, qty: 1 }]),
    });
    assert.equal(data.deliveryFeePaise, 0);
  });

  it('refuses more than is left, and leaves the rest of the cart on the shelf', async () => {
    const before = await stockOf('Onion');
    const { status, data } = await call('POST', '/orders', {
      token: customer,
      body: order([{ productId: item('Onion').productId, qty: 1 }, { productId: item('Paneer').productId, qty: 4 }]),
    });
    assert.equal(status, 409);
    assert.equal(data.code, 'item_unavailable');
    assert.equal(await stockOf('Onion'), before);
  });

  it('refuses an address outside the delivery area, a small basket, and a closed store', async () => {
    const onion = [{ productId: item('Onion').productId, qty: 3 }];
    const far = await call('POST', '/orders', { token: customer, body: order(onion, { addressId: address.farId }) });
    assert.equal(far.data.code, 'outside_delivery_area');

    const small = await call('POST', '/orders', {
      token: customer,
      body: order([{ productId: item('Matchbox').productId, qty: 1 }]),
    });
    assert.equal(small.data.code, 'below_minimum_order');

    await call('PATCH', '/store', { token: jayanagarDesk, body: { isOpen: false } });
    const closed = await call('POST', '/orders', { token: customer, body: order(onion) });
    assert.equal(closed.data.code, 'store_closed');
    await call('PATCH', '/store', { token: jayanagarDesk, body: { isOpen: true } });
  });

  it('refuses someone else’s address and a product the store does not sell', async () => {
    const others = await call('POST', '/orders', {
      token: customer,
      body: order([{ productId: item('Onion').productId, qty: 3 }], { addressId: randomUUID() }),
    });
    assert.equal(others.data.code, 'address_not_found');
    const unknown = await call('POST', '/orders', { token: customer, body: order([{ productId: randomUUID(), qty: 3 }]) });
    assert.equal(unknown.data.code, 'item_unavailable');
  });
});

describe('the store works an order', () => {
  let placed;
  const move = (token, to, reason) =>
    call('POST', `/store/orders/${placed.id}/transition`, { token, body: { to, ...(reason ? { reason } : {}) } });

  before(async () => {
    placed = (await call('POST', '/orders', {
      token: customer,
      body: { storeId: jayanagar.id, addressId: address.id, paymentMethod: 'upi', idempotencyKey: key(), items: [{ productId: item('Potato').productId, qty: 3 }] },
    })).data;
  });

  it('shows the order to its own store only', async () => {
    const mine = (await call('GET', '/store/orders', { token: jayanagarDesk })).data;
    assert.ok(mine.some((o) => o.id === placed.id));
    const theirs = (await call('GET', '/store/orders', { token: indiranagarDesk })).data;
    assert.ok(!theirs.some((o) => o.id === placed.id));
    assert.equal((await move(indiranagarDesk, 'accepted')).status, 404);
  });

  it('cannot skip a step', async () => {
    const { status, data } = await move(jayanagarDesk, 'ready');
    assert.equal(status, 409);
    assert.equal(data.code, 'transition_not_allowed');
  });

  it('walks from placed to delivered, and the customer can no longer cancel', async () => {
    for (const to of ['accepted', 'ready', 'out_for_delivery', 'delivered']) {
      const { status, data } = await move(jayanagarDesk, to);
      assert.equal(status, 200, to);
      assert.equal(data.status, to);
    }
    const seen = (await call('GET', `/orders/${placed.id}`, { token: customer })).data;
    assert.equal(seen.status, 'delivered');
    assert.ok(seen.acceptedAt && seen.readyAt && seen.dispatchedAt && seen.deliveredAt);
    assert.equal((await call('POST', `/orders/${placed.id}/cancel`, { token: customer })).status, 409);
  });

  it('puts the stock back when the customer cancels or the store rejects', async () => {
    const before = await stockOf('Carrot');
    const place = async () => (await call('POST', '/orders', {
      token: customer,
      body: { storeId: jayanagar.id, addressId: address.id, paymentMethod: 'cash', idempotencyKey: key(), items: [{ productId: item('Carrot').productId, qty: 4 }] },
    })).data;

    const first = await place();
    assert.equal(await stockOf('Carrot'), before - 4);
    const cancelled = await call('POST', `/orders/${first.id}/cancel`, { token: customer });
    assert.equal(cancelled.data.status, 'cancelled');
    assert.equal(await stockOf('Carrot'), before);

    placed = await place();
    const rejected = await move(jayanagarDesk, 'rejected', 'Out of carrots');
    assert.equal(rejected.data.status, 'rejected');
    assert.equal(rejected.data.cancelReason, 'Out of carrots');
    assert.equal(await stockOf('Carrot'), before);
  });

  it('counts today’s orders on the dashboard', async () => {
    const { data } = await call('GET', '/store/dashboard', { token: jayanagarDesk });
    assert.equal(data.store.id, jayanagar.id);
    assert.ok(data.today.orders >= 3);
    assert.ok(data.today.revenuePaise > 0);
  });
});

describe('the store manages its shelf', () => {
  it('changes a price and the customer sees it', async () => {
    const lemon = item('Lemon');
    const { data } = await call('PATCH', `/store/inventory/${lemon.productId}`, { token: jayanagarDesk, body: { pricePaise: 1800, stock: 7 } });
    assert.equal(data.pricePaise, 1800);
    assert.equal(data.stock, 7);
    const fresh = (await call('GET', `/stores/${jayanagar.id}/catalog`)).data.items.find((i) => i.name === 'Lemon');
    assert.equal(fresh.pricePaise, 1800);
    assert.equal(fresh.maxQty, 7);
  });

  it('hides a product it switches off', async () => {
    const soda = item('Soda');
    await call('PATCH', `/store/inventory/${soda.productId}`, { token: jayanagarDesk, body: { isAvailable: false } });
    const fresh = (await call('GET', `/stores/${jayanagar.id}/catalog`)).data;
    assert.ok(!fresh.items.some((i) => i.name === 'Soda'));
    await call('PATCH', `/store/inventory/${soda.productId}`, { token: jayanagarDesk, body: { isAvailable: true } });
  });

  it('adds a catalogue product it did not stock, once', async () => {
    const missing = (await call('GET', '/store/inventory/missing', { token: indiranagarDesk })).data;
    assert.equal(missing.length, 8);
    const mango = missing.find((p) => p.name === 'Mango');
    const body = { productId: mango.productId, pricePaise: 11000, stock: 10 };
    assert.equal((await call('POST', '/store/inventory', { token: indiranagarDesk, body })).status, 201);
    const again = await call('POST', '/store/inventory', { token: indiranagarDesk, body });
    assert.equal(again.data.code, 'already_stocked');
    assert.equal((await call('GET', '/store/inventory/missing', { token: indiranagarDesk })).data.length, 7);
  });

  it('rejects a silly price', async () => {
    const { status } = await call('PATCH', `/store/inventory/${item('Lemon').productId}`, { token: jayanagarDesk, body: { pricePaise: -5 } });
    assert.equal(status, 400);
  });
});
