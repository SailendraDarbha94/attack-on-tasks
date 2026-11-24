import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** ₹1 to ₹1,00,000. */
const MIN_PRICE_PAISE = 100;
const MAX_PRICE_PAISE = 10_000_000;
const MAX_STOCK = 9999;

export class SetOpenDto {
  @IsBoolean()
  isOpen: boolean;
}

export class OrdersQueryDto {
  @IsOptional()
  @IsIn(['active', 'finished'])
  scope?: 'active' | 'finished';
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(MIN_PRICE_PAISE)
  @Max(MAX_PRICE_PAISE)
  pricePaise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class AddInventoryDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(MIN_PRICE_PAISE)
  @Max(MAX_PRICE_PAISE)
  pricePaise: number;

  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stock: number;
}
