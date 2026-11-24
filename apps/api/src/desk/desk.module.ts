import { Module } from '@nestjs/common';

import { OrdersModule } from '../orders/orders.module';
import { DeskController } from './desk.controller';

@Module({
  imports: [OrdersModule],
  controllers: [DeskController],
})
export class DeskModule {}
