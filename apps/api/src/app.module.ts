import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { DeskModule } from './desk/desk.module';
import { HealthController } from './health/health.controller';
import { MeModule } from './me/me.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MeModule,
    StoresModule,
    OrdersModule,
    DeskModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
