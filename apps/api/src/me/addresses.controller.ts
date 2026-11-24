import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Address } from '@nukkad/core';

import { AuthGuard, Roles, type AuthUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AppError } from '../common/app-error';
import { toAddress } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './me.dto';

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** A customer's saved delivery addresses. Exactly one is the default whenever any exist. */
@Controller('me/addresses')
@UseGuards(AuthGuard)
@Roles('customer')
export class AddressesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<Address[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toAddress);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto): Promise<Address> {
    const created = await this.prisma.$transaction(async (tx) => {
      // The newest address becomes the default: it is the one just typed in
      // at checkout, so it is the one the customer means.
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return tx.address.create({
        data: {
          userId: user.id,
          label: dto.label.trim(),
          line1: dto.line1.trim(),
          line2: clean(dto.line2),
          landmark: clean(dto.landmark),
          area: dto.area.trim(),
          city: clean(dto.city) ?? 'Bengaluru',
          pincode: dto.pincode,
          lat: dto.lat,
          lng: dto.lng,
          isDefault: true,
        },
      });
    });
    return toAddress(created);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<Address> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!existing) throw new AppError('address_not_found', HttpStatus.NOT_FOUND);
      if (dto.isDefault === true) {
        await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }
      return tx.address.update({
        where: { id },
        data: {
          label: dto.label?.trim(),
          line1: dto.line1?.trim(),
          line2: dto.line2 === undefined ? undefined : clean(dto.line2),
          landmark: dto.landmark === undefined ? undefined : clean(dto.landmark),
          area: dto.area?.trim(),
          city: dto.city?.trim(),
          pincode: dto.pincode,
          lat: dto.lat,
          lng: dto.lng,
          isDefault: dto.isDefault === true ? true : undefined,
        },
      });
    });
    return toAddress(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!existing) throw new AppError('address_not_found', HttpStatus.NOT_FOUND);
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }
}
