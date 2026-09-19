import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { eq, passwordResetTokens, users } from '@repo/db';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { DATABASE } from '../db/database.constants';
import { EmailService } from '../email/email.service';
import type { Database } from '@repo/db';
import type { LoginDto, SignupDto, UpdateProfileDto } from './dto/auth.dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        email: dto.email,
        passwordHash,
        profileImage: dto.profileImage ?? null,
        role: 'creator',
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        dietaryPreferences: users.dietaryPreferences,
        location: users.location,
        website: users.website,
        instagram: users.instagram,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return {
      user,
      token: this.createToken(user.id),
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        dietaryPreferences: user.dietaryPreferences,
        location: user.location,
        website: user.website,
        instagram: user.instagram,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: this.createToken(user.id),
    };
  }

  createToken(userId: string) {
    return this.jwtService.sign({ sub: userId });
  }

  verifyToken(token: string): string {
    const payload = this.jwtService.verify<{ sub: string }>(token);
    return payload.sub;
  }

  async getProfile(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        dietaryPreferences: users.dietaryPreferences,
        location: users.location,
        website: users.website,
        instagram: users.instagram,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const [user] = await this.db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        dietaryPreferences: users.dietaryPreferences,
        location: users.location,
        website: users.website,
        instagram: users.instagram,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return user;
  }

  async upgradeToCreator(userId: string) {
    const [user] = await this.db
      .update(users)
      .set({ role: 'creator', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        dietaryPreferences: users.dietaryPreferences,
        location: users.location,
        website: users.website,
        instagram: users.instagram,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return user;
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; devResetUrl?: string }> {
    const genericResponse = {
      message:
        'If that email is registered, a password reset link has been sent.',
    };

    const [user] = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return the same generic message whether or not the email
    // exists, so this endpoint can't be used to enumerate registered users.
    if (!user) return genericResponse;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`;

    const { sent } = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
    );

    return sent
      ? genericResponse
      : { ...genericResponse, devResetUrl: resetUrl };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [record] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'This reset link is invalid or has expired.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId));

    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));

    return { message: 'Your password has been reset.' };
  }
}
