import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { buildPasswordResetEmail } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter =
      host && port && user && pass
        ? createTransport({
            host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user, pass },
          })
        : null;
    this.from = this.config.get<string>(
      'EMAIL_FROM',
      user ?? 'no-reply@cookroots.app',
    );
  }

  /**
   * Returns `sent: false` whenever real email isn't configured (or fails),
   * signaling callers to fall back to dev-mode (display the link directly).
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<{ sent: boolean }> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — skipping email send. Reset link for ${to}: ${resetUrl}`,
      );
      return { sent: false };
    }

    try {
      const { subject, html, text } = buildPasswordResetEmail(resetUrl);
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      return { sent: true };
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${err instanceof Error ? err.message : err}`,
      );
      return { sent: false };
    }
  }
}
