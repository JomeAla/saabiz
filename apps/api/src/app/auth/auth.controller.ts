import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CustomerRegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ValidationPipe()) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-customer')
  async registerCustomer(@Body(new ValidationPipe()) dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('login')
  async login(@Body(new ValidationPipe()) dto: LoginDto) {
    return this.authService.login(dto);
  }
}
