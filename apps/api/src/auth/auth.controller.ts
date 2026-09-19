import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
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
  @UseGuards(AuthGuard)
  getMe(@Req() req: { userId: string }) {
    return this.authService.getProfile(req.userId);
  }

  @Get('users/:userId')
  getProfile(@Param() params: UserIdParamDto) {
    return this.authService.getProfile(params.userId);
  }

  @Patch('users/:userId')
  @UseGuards(AuthGuard)
  updateProfile(
    @Param() params: UserIdParamDto,
    @Body() dto: UpdateProfileDto,
    @Req() req: { userId: string },
  ) {
    if (req.userId !== params.userId) {
      throw new ForbiddenException("Cannot update another user's profile");
    }
    return this.authService.updateProfile(params.userId, dto);
  }

  @Post('users/:userId/upgrade-creator')
  @UseGuards(AuthGuard)
  upgradeToCreator(
    @Param() params: UserIdParamDto,
    @Req() req: { userId: string },
  ) {
    if (req.userId !== params.userId) {
      throw new ForbiddenException("Cannot upgrade another user's role");
    }
    return this.authService.upgradeToCreator(params.userId);
  }
}
