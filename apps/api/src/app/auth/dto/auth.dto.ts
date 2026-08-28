import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty()
  @IsString()
  businessName!: string;

  // Invisible honeypot field for bots — humans never fill it.
  @IsOptional()
  @IsString()
  website?: string;
}

export class CustomerRegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  // Invisible honeypot field for bots — humans never fill it.
  @IsOptional()
  @IsString()
  website?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  // Invisible honeypot field for bots — humans never fill it.
  @IsOptional()
  @IsString()
  website?: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
