import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { Me } from '@nukkad/core';

import { AuthGuard, type AuthUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { toMe } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './me.dto';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() user: AuthUser): Promise<Me> {
    return toMe(await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { store: true } }));
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto): Promise<Me> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { name: dto.name?.trim(), phone: dto.phone?.trim() },
      include: { store: true },
    });
    return toMe(updated);
  }
}
