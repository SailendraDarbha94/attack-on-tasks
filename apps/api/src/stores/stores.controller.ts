import { Controller, Get, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import { MAX_QTY_PER_ITEM, type Catalog, type StoreSummary } from '@nukkad/core';

import { AppError } from '../common/app-error';
import { toStoreSummary } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';

/** Public: anyone may see the stores and what they sell, signed in or not. */
@Controller('stores')
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<StoreSummary[]> {
    const stores = await this.prisma.store.findMany({ orderBy: { name: 'asc' } });
    return stores.map(toStoreSummary);
  }

  /** Everything the store has on offer. Sold-out products stay listed with `maxQty: 0`. */
  @Get(':id/catalog')
  async catalog(@Param('id', ParseUUIDPipe) id: string): Promise<Catalog> {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new AppError('store_not_found', HttpStatus.NOT_FOUND);

    const [categories, rows] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { sort: 'asc' } }),
      this.prisma.storeProduct.findMany({
        where: { storeId: id, isAvailable: true, product: { isActive: true } },
        include: { product: true },
        orderBy: { product: { name: 'asc' } },
      }),
    ]);

    const stocked = new Set(rows.map((row) => row.product.categoryId));
    return {
      store: toStoreSummary(store),
      categories: categories
        .filter((category) => stocked.has(category.id))
        .map(({ id: categoryId, slug, name, emoji, sort }) => ({ id: categoryId, slug, name, emoji, sort })),
      items: rows.map((row) => ({
        productId: row.productId,
        categoryId: row.product.categoryId,
        name: row.product.name,
        unitLabel: row.product.unitLabel,
        emoji: row.product.emoji,
        description: row.product.description,
        mrpPaise: row.product.mrpPaise,
        pricePaise: row.pricePaise,
        maxQty: Math.max(0, Math.min(row.stock, MAX_QTY_PER_ITEM)),
      })),
    };
  }
}
