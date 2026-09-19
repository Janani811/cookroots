import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
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
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
