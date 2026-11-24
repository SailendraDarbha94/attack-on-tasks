import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { PHONE_PATTERN } from '../auth/dev-auth.dto';

const PINCODE = /^[1-9][0-9]{5}$/;

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'Enter a phone number with 8 to 15 digits.' })
  phone?: string;
}

export class CreateAddressDto {
  @IsString()
  @Length(1, 30)
  label: string;

  @IsString()
  @Length(3, 120)
  line1: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  landmark?: string;

  @IsString()
  @Length(2, 60)
  area: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  city?: string;

  @Matches(PINCODE, { message: 'Enter a 6-digit pincode.' })
  pincode: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(3, 120)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  landmark?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  area?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  city?: string;

  @IsOptional()
  @Matches(PINCODE, { message: 'Enter a 6-digit pincode.' })
  pincode?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  /** Only `true` means anything: it moves the default here. */
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
