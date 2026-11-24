import { IsEmail, IsString, Length, Matches } from 'class-validator';

export const PHONE_PATTERN = /^\+?[0-9][0-9 ]{7,15}$/;

export class DevSignInDto {
  @IsEmail()
  email: string;
}

export class DevSignUpDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsEmail()
  email: string;

  @Matches(PHONE_PATTERN, { message: 'Enter a phone number with 8 to 15 digits.' })
  phone: string;
}
