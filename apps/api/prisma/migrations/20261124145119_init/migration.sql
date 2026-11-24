-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'store', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('placed', 'accepted', 'ready', 'out_for_delivery', 'delivered', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'upi');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "storeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "deliveryRadiusM" INTEGER NOT NULL DEFAULT 4500,
    "deliveryFeePaise" INTEGER NOT NULL DEFAULT 2500,
    "freeDeliveryAbovePaise" INTEGER,
    "minOrderPaise" INTEGER NOT NULL DEFAULT 9900,
    "prepMinutes" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT,
    "mrpPaise" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "storeId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("storeId","productId")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "landmark" TEXT,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Bengaluru',
    "pincode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "shortCode" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'placed',
    "subtotalPaise" INTEGER NOT NULL,
    "deliveryFeePaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "dropoffName" TEXT NOT NULL,
    "dropoffPhone" TEXT,
    "dropoffText" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_unitLabel_key" ON "products"("name", "unitLabel");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shortCode_key" ON "orders"("shortCode");

-- CreateIndex
CREATE INDEX "orders_customerId_placedAt_idx" ON "orders"("customerId", "placedAt");

-- CreateIndex
CREATE INDEX "orders_storeId_status_idx" ON "orders"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_customerId_idempotencyKey_key" ON "orders"("customerId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_events_orderId_idx" ON "order_events"("orderId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
