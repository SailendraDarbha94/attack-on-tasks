import { MAX_LINES_PER_ORDER, MAX_QTY_PER_ITEM, ORDER_STATUSES, PAYMENT_METHODS } from '@nukkad/core';
import type { OrderStatus, PaymentMethod } from '@nukkad/core';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderLineDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_ITEM)
  qty: number;
}

/** Product ids and quantities only: the server looks up every price itself. */
export class PlaceOrderDto {
  @IsUUID()
  storeId: string;

  @IsUUID()
  addressId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LINES_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsString()
  @Length(8, 64)
  idempotencyKey: string;
}

export class TransitionDto {
  @IsIn(ORDER_STATUSES)
  to: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
