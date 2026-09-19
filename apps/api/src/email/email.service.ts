import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>('EMAIL_FROM', 'onboarding@resend.dev');
  }

  /**
   * Returns `sent: false` whenever real email isn't configured (or fails),
   * signaling callers to fall back to dev-mode (display the link directly).
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<{ sent: boolean }> {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not set — skipping email send. Reset link for ${to}: ${resetUrl}`,
      );
      return { sent: false };
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Reset your CookRoots password',
        html: `
          <p>Someone requested a password reset for your CookRoots account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        `,
      });

      if (error) {
        // The Resend SDK returns API errors as data rather than throwing.
        this.logger.error(
          `Failed to send password reset email to ${to}: ${error.message}`,
        );
        return { sent: false };
      }

      return { sent: true };
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${err instanceof Error ? err.message : err}`,
      );
      return { sent: false };
    }
  }
}
