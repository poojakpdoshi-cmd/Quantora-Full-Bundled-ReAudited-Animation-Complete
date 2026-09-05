export interface EmailOtpPayload {
  toEmail: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export interface EmailDispatchConfig {
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  gmailUserEmail?: string;
  environment?: string; // 'production' | 'development' | 'test'
}

export const OFFICIAL_GMAIL_SENDER = 'quantoraby.quantacy@gmail.com';
export const OFFICIAL_GMAIL_SENDER_NAME = 'Quantora by Quantacy AI';

// Server-side test mail sink (used strictly during automated testing)
type TestMailSink = (payload: EmailOtpPayload) => void;
let globalTestMailSink: TestMailSink | null = null;

export function setTestMailSink(sink: TestMailSink | null): void {
  globalTestMailSink = sink;
}

export function getTestMailSink(): TestMailSink | null {
  return globalTestMailSink;
}

/**
 * Builds high-converting, professional HTML template for 6-digit OTP delivery
 */
export function buildQuantoraOtpHtml(otpCode: string, toEmail: string, minutes: number = 10): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quantora Verification Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 30px 15px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 20px; text-align: center; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);">
        <div style="font-size: 32px; margin-bottom: 6px;">💎</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px;">QUANTORA</h1>
        <p style="margin: 4px 0 0; color: #e0f2fe; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Powered by Quantacy AI</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 32px 32px 24px;">
        <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 18px; font-weight: 700;">Account Verification</h2>
        <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.5;">
          Hello,<br>
          Use the 6-digit verification code below to sign in to your <strong>Quantora</strong> workspace.
        </p>

        <!-- OTP Code Card -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f0f9ff; border: 1.5px dashed #0284c7; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <span style="display: block; font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Your 6-Digit Code</span>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0369a1; font-family: monospace; line-height: 1;">
                ${otpCode}
              </div>
              <span style="display: block; font-size: 12px; color: #64748b; margin-top: 8px;">Valid for <strong>${minutes} minutes</strong></span>
            </td>
          </tr>
        </table>

        <div style="background: #f8fafc; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
            🎁 <strong>200 AI Website Generation Credits</strong> will be added to your workspace automatically upon verification.
          </p>
        </div>

        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">
          If you did not request this verification code, please ignore this email. Official verification authority: <strong>quantoraby.quantacy@gmail.com</strong>.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">
          © ${new Date().getFullYear()} Quantora by Quantacy AI. All rights reserved.<br>
          Military-Grade Security Protocol • Official Auth Desk: quantoraby.quantacy@gmail.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Creates RFC 2822 formatted MIME message and base64url encodes it for Gmail API
 */
function createBase64UrlMimeMessage(
  from: string,
  to: string,
  subject: string,
  textContent: string,
  htmlContent: string
): string {
  const boundary = `====_Quantora_Boundary_${Date.now()}_====`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textContent,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    htmlContent,
    ``,
    `--${boundary}--`
  ];

  const rawMime = lines.join('\r\n');
  const base64 = btoa(unescape(encodeURIComponent(rawMime)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Exchanges Google OAuth2 Refresh Token for a short-lived Access Token
 */
async function getGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken?: string; error?: string }> {
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { error: `Google OAuth2 token exchange failed (${response.status}): ${errText.slice(0, 200)}` };
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      return { error: 'Google OAuth2 response did not include access_token.' };
    }

    return { accessToken: data.access_token };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Google OAuth2 token exchange exception.' };
  }
}

/**
 * Dispatches email via official Gmail REST API
 */
async function sendViaGmailApi(
  payload: EmailOtpPayload,
  config: EmailDispatchConfig,
  subject: string,
  textContent: string,
  htmlContent: string
): Promise<{ success: boolean; provider: string; error?: string }> {
  const { gmailClientId, gmailClientSecret, gmailRefreshToken } = config;

  if (!gmailClientId || !gmailClientSecret || !gmailRefreshToken) {
    return {
      success: false,
      provider: 'gmail',
      error: 'Official Gmail OAuth2 credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) are not configured.'
    };
  }

  const configuredSender = (config.gmailUserEmail || '').trim().toLowerCase();
  if (configuredSender !== OFFICIAL_GMAIL_SENDER) {
    return {
      success: false,
      provider: 'gmail',
      error: `Gmail sender must be ${OFFICIAL_GMAIL_SENDER}.`
    };
  }

  // The From header is fixed to the official Quantora Gmail identity.
  const senderEmail = OFFICIAL_GMAIL_SENDER;
  const fromHeader = `"${OFFICIAL_GMAIL_SENDER_NAME}" <${senderEmail}>`;

  const tokenResult = await getGoogleAccessToken(gmailClientId, gmailClientSecret, gmailRefreshToken);
  if (!tokenResult.accessToken) {
    console.error('[GMAIL-AUTH-ERROR]', tokenResult.error);
    return {
      success: false,
      provider: 'gmail',
      error: tokenResult.error || 'Failed to authenticate with Google OAuth2.'
    };
  }

  try {
    const rawMessage = createBase64UrlMimeMessage(
      fromHeader,
      payload.toEmail,
      subject,
      textContent,
      htmlContent
    );

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMessage })
    });

    if (res.ok) {
      console.log(`✉️ [GMAIL-API-SUCCESS] Verification code dispatched via official Gmail to ${payload.toEmail}`);
      return { success: true, provider: 'gmail' };
    }

    const errJson = await res.json().catch(() => ({}));
    console.error('[GMAIL-API-SEND-ERROR]', errJson);
    return {
      success: false,
      provider: 'gmail',
      error: `Gmail API error (${res.status}): ${JSON.stringify(errJson)}`
    };
  } catch (err) {
    console.error('[GMAIL-API-EXCEPTION]', err);
    return {
      success: false,
      provider: 'gmail',
      error: err instanceof Error ? err.message : 'Exception sending message via Gmail API.'
    };
  }
}

/**
 * Main Email Dispatcher for Quantora Official OTP
 */
export async function sendOtpEmailViaProvider(
  payload: EmailOtpPayload,
  config: EmailDispatchConfig
): Promise<{ success: boolean; provider: string; error?: string }> {
  const { toEmail, otpCode, expiresInMinutes = 10 } = payload;
  const htmlContent = buildQuantoraOtpHtml(otpCode, toEmail, expiresInMinutes);
  const textContent = `Your Quantora verification code is: ${otpCode}. Valid for ${expiresInMinutes} minutes. Official verification authority: ${OFFICIAL_GMAIL_SENDER}`;
  const subject = `${otpCode} is your Quantora verification code`;

  // Test delivery is an in-process mock only; it is never available in a client request.
  if (config.environment === 'test') {
    if (globalTestMailSink) {
      globalTestMailSink(payload);
    }
    console.log(`TEST-MAIL-SINK: Captured OTP for ${toEmail}`);
    return { success: true, provider: 'mock' };
  }

  // Every non-test environment uses the official Gmail REST API and fails closed.
  // There is deliberately no Resend, Brevo, MailChannels, or magic-link fallback.
  return sendViaGmailApi(payload, config, subject, textContent, htmlContent);
}
