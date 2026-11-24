import { CanActivate, ExecutionContext, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@nukkad/core';
import type { FastifyRequest } from 'fastify';

import { AppError } from '../common/app-error';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

/** Who is making the request, as the database knows them right now. */
export type AuthUser = { id: string; role: Role; storeId: string | null; email: string };

export type AuthedRequest = FastifyRequest & { user: AuthUser };

const ROLES_KEY = 'roles';

/** Limits a controller or handler to these roles. Without it, any signed-in account passes. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * "Signed in, active, and of the right role", in one place.
 *
 * The role and status are read from the database on every request rather
 * than trusted from the token, so a suspension or a role change takes effect
 * immediately instead of when the token expires.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new AppError('not_signed_in', HttpStatus.UNAUTHORIZED);

    let sub: string;
    try {
      ({ sub } = await this.tokens.verify(token));
    } catch {
      throw new AppError('not_signed_in', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, role: true, status: true, storeId: true, email: true },
    });
    if (!user) throw new AppError('not_signed_in', HttpStatus.UNAUTHORIZED);
    if (user.status !== 'active') throw new AppError('account_suspended', HttpStatus.FORBIDDEN);

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(user.role)) throw new AppError('not_authorized', HttpStatus.FORBIDDEN);

    request.user = { id: user.id, role: user.role, storeId: user.storeId, email: user.email };
    return true;
  }
}
