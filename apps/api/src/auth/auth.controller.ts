import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
} from './auth.constants';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
  UpdateProfileDto,
  UserIdParamDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      domain: this.config.get<string>('COOKIE_DOMAIN'),
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);
    this.setAuthCookie(res, result.token);
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookie(res, result.token);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      path: '/',
      domain: this.config.get<string>('COOKIE_DOMAIN'),
    });
    return { message: 'Logged out' };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() userId: string) {
    return this.authService.getProfile(userId);
  }

  @Get('users/:userId')
  getProfile(@Param() params: UserIdParamDto) {
    return this.authService.getProfile(params.userId);
  }

  @Patch('users/:userId')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Param() params: UserIdParamDto,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() userId: string,
  ) {
    if (userId !== params.userId) {
      throw new ForbiddenException("Cannot update another user's profile");
    }
    return this.authService.updateProfile(params.userId, dto);
  }

  @Post('users/:userId/upgrade-creator')
  @UseGuards(JwtAuthGuard)
  upgradeToCreator(
    @Param() params: UserIdParamDto,
    @CurrentUser() userId: string,
  ) {
    if (userId !== params.userId) {
      throw new ForbiddenException("Cannot upgrade another user's role");
    }
    return this.authService.upgradeToCreator(params.userId);
  }
}
