import { Controller, Post, Get, Body, ValidationPipe, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CustomerRegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new seller account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Seller registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - email already exists' })
  async register(@Body(new ValidationPipe()) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-customer')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - email already exists' })
  async registerCustomer(@Body(new ValidationPipe()) dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: { email: { type: 'string' }, password: { type: 'string' } },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ status: 200, description: 'Login successful', schema: {
    example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  }})
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(new ValidationPipe()) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email']
    }
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body(new ValidationPipe()) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: { token: { type: 'string' }, newPassword: { type: 'string' } },
      required: ['token', 'newPassword']
    }
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body(new ValidationPipe()) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body(new ValidationPipe()) dto: ForgotPasswordDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
      required: ['refreshToken']
    }
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  async getMe(@Request() req: any) {
    return this.authService.getUserProfile(req.user.userId);
  }
}
