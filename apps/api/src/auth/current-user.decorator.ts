import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthedRequest, AuthUser } from './auth.guard';

/** The account AuthGuard attached to the request. Only meaningful on guarded routes. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  return context.switchToHttp().getRequest<AuthedRequest>().user;
});
