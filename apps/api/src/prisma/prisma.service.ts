import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// No $connect() on startup: Prisma connects on the first query, so the API
// can boot (and /health can answer) before a database is configured.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
