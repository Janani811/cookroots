const BRAND_COLOR = '#EA580C';
const TEXT_COLOR = '#292524';
const MUTED_COLOR = '#78716c';
const BORDER_COLOR = '#e7e5e4';
const BG_COLOR = '#f5f4f2';

export function buildPasswordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Reset your CookRoots password',
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your CookRoots password</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid ${BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid ${BORDER_COLOR};">
                <span style="font-size:20px;font-weight:700;color:${TEXT_COLOR};">🍳 CookRoots</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;color:${TEXT_COLOR};">
                  Reset your password
                </h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:${MUTED_COLOR};">
                  We received a request to reset the password for your CookRoots account.
                  Click the button below to choose a new one. This link expires in 1 hour.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:${BRAND_COLOR};">
                      <a
                        href="${resetUrl}"
                        style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;"
                      >
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:13px;line-height:20px;color:${MUTED_COLOR};">
                  Or copy and paste this link into your browser:<br />
                  <a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${resetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:${BG_COLOR};border-top:1px solid ${BORDER_COLOR};">
                <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED_COLOR};">
                  If you didn't request a password reset, you can safely ignore this email —
                  your password won't be changed.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Reset your CookRoots password

We received a request to reset the password for your CookRoots account.
Open the link below to choose a new one. This link expires in 1 hour.

${resetUrl}

If you didn't request a password reset, you can safely ignore this email — your password won't be changed.`,
  };
}
