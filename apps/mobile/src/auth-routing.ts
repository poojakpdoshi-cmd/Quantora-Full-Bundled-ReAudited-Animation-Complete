import { requestJson } from './api-errors';

export type UsernameSession = {
  token: string;
  expiresAt: string;
  username: string;
  internalEmail: string;
  approved: true;
  role: 'admin' | 'subscriber';
  maxDevices: number;
  activeDevices: number;
  subscriptionExpiresAt?: string | null;
};

export type AdminSession = {
  token: string;
  expiresAt: string;
  username: string;
};

type AdminLoginPayload = {
  username: string;
  password: string;
};

export type EmailOtpSendPayload = {
  email: string;
  installationId?: string;
};

export type EmailOtpVerifyPayload = {
  email: string;
  otp: string;
  installationId: string;
  deviceName?: string;
  androidVersion?: string;
};

// Subscriber authentication is deliberately limited to these custom API OTP
// endpoints. No Supabase Auth, magic-link, redirect, or provider-generated email
// path is used by the mobile client.
export function sendEmailOtp(apiBase: string, payload: EmailOtpSendPayload) {
  return requestJson<{ ok: boolean; message: string; expiresInMinutes?: number }>(
    `${apiBase}/auth/otp/send`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
}

export function verifyEmailOtp(apiBase: string, payload: EmailOtpVerifyPayload) {
  return requestJson<UsernameSession>(`${apiBase}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function loginAdmin(
  apiBase: string,
  payload: AdminLoginPayload
) {
  return requestJson<AdminSession>(`${apiBase}/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
