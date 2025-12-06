const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('xferno_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export interface TwoFactorSetupResponse {
  secret?: string;
  otpauthUrl?: string;
  qrCodeUrl?: string;
  enabled?: boolean;
  message?: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  recoveryCodes: string[];
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  accessToken?: string;
  user?: any;
  message?: string;
}

// Get 2FA setup data (secret and QR code)
export async function setup2FA(): Promise<TwoFactorSetupResponse> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/setup`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to setup 2FA');
  return response.json();
}

// Enable 2FA with verification code
export async function enable2FA(secret: string, token: string): Promise<TwoFactorEnableResponse> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/enable`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ secret, token }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to enable 2FA');
  }
  return response.json();
}

// Disable 2FA
export async function disable2FA(token: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/disable`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to disable 2FA');
  }
  return response.json();
}

// Verify 2FA during login
export async function verify2FA(userId: string, token: string): Promise<TwoFactorVerifyResponse> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token }),
  });
  if (!response.ok) throw new Error('Failed to verify 2FA');
  return response.json();
}

// Get remaining recovery codes count
export async function getRecoveryCodesCount(): Promise<{ remainingCount: number }> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/recovery-codes`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get recovery codes count');
  return response.json();
}

// Regenerate recovery codes
export async function regenerateRecoveryCodes(token: string): Promise<{ success: boolean; recoveryCodes?: string[] }> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/recovery-codes/regenerate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error('Failed to regenerate recovery codes');
  return response.json();
}
