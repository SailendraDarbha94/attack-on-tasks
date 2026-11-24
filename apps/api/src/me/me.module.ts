import { Module } from '@nestjs/common';

import { AddressesController } from './addresses.controller';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController, AddressesController],
})
export class MeModule {}
