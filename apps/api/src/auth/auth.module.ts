import { Global, Module } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { DevAuthController } from './dev-auth.controller';
import { TokenService } from './token.service';

// Global so any controller can list AuthGuard without importing this module.
@Global()
@Module({
  controllers: [DevAuthController],
  providers: [TokenService, AuthGuard],
  exports: [TokenService, AuthGuard],
})
export class AuthModule {}
