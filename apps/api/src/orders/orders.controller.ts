import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import type { Order } from '@nukkad/core';

import { AuthGuard, Roles, type AuthUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PlaceOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

/** A customer's own orders. */
@Controller('orders')
@UseGuards(AuthGuard)
@Roles('customer')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  place(@CurrentUser() user: AuthUser, @Body() dto: PlaceOrderDto): Promise<Order> {
    return this.orders.place(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Order[]> {
    return this.orders.listForCustomer(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.orders.getForCustomer(user.id, id);
  }

  /** Allowed only until the store accepts. */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.orders.transition({ id: user.id, role: 'customer' }, id, 'cancelled');
  }
}
