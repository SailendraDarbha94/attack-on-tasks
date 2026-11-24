import { randomUUID } from 'node:crypto';

import { Body, Controller, Get, HttpStatus, NotFoundException, OnModuleInit, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DemoAccount, Session } from '@nukkad/core';

import { AppError } from '../common/app-error';
import { toMe } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { DevSignInDto, DevSignUpDto } from './dev-auth.dto';
import { TokenService } from './token.service';

/** Seeded accounts use this reserved domain, which can never receive mail. */
const DEMO_DOMAIN = '@nukkad.test';

/**
 * A stand-in for real sign-in, for development only.
 *
 * Anyone who can reach these routes can sign in as any account without a
 * password, so they answer 404 unless DEV_AUTH=1, and the API refuses to
 * start with DEV_AUTH=1 in production. Real sign-in (Supabase Auth) replaces
 * this controller; everything behind AuthGuard stays as it is.
 */
@Controller('auth/dev')
export class DevAuthController implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    return this.config.get<string>('DEV_AUTH') === '1';
  }

  onModuleInit() {
    if (this.enabled && process.env.NODE_ENV === 'production') {
      throw new Error('DEV_AUTH=1 lets anyone sign in as anyone. Refusing to start with it in production.');
    }
  }

  private assertEnabled() {
    if (!this.enabled) throw new NotFoundException();
  }

  @Get('accounts')
  async accounts(): Promise<DemoAccount[]> {
    this.assertEnabled();
    const users = await this.prisma.user.findMany({
      where: { email: { endsWith: DEMO_DOMAIN } },
      include: { store: true, _count: { select: { addresses: true } } },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      note:
        user.role === 'store'
          ? (user.store?.name ?? 'No store')
          : user._count.addresses > 0
            ? `${user._count.addresses} saved ${user._count.addresses === 1 ? 'address' : 'addresses'}`
            : 'No saved address',
    }));
  }

  @Post('sign-in')
  async signIn(@Body() dto: DevSignInDto): Promise<Session> {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { store: true },
    });
    if (!user) throw new AppError('account_not_found', HttpStatus.NOT_FOUND);
    if (user.status !== 'active') throw new AppError('account_suspended', HttpStatus.FORBIDDEN);
    return { token: await this.tokens.sign(user), me: toMe(user) };
  }

  /** Customers only. Store accounts are created with their store, not here. */
  @Post('sign-up')
  async signUp(@Body() dto: DevSignUpDto): Promise<Session> {
    this.assertEnabled();
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new AppError('email_taken', HttpStatus.CONFLICT);
    }
    const user = await this.prisma.user.create({
      data: { id: randomUUID(), role: 'customer', name: dto.name.trim(), email, phone: dto.phone.trim() },
      include: { store: true },
    });
    return { token: await this.tokens.sign(user), me: toMe(user) };
  }
}
