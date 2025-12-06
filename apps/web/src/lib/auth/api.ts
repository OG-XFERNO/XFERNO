import type {
  AuthResponse,
  RegisterResponse,
  RegisterData,
  LoginData,
  WalletLoginData,
  User,
  KycRequirements,
  KycSubmitData,
  KycStatusResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('xferno_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// ========== Auth API ==========

export async function register(data: RegisterData): Promise<RegisterResponse> {
  return fetchApi<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface TwoFARequired {
  requires2FA: true;
  twoFAType: 'email' | 'authenticator';
  userId: string;
  email: string;
}

export async function sendEmail2FA(userId: string, email: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/api/auth/2fa/email/send', {
    method: 'POST',
    body: JSON.stringify({ userId, email }),
  });
}

export async function verifyEmail2FA(userId: string, code: string): Promise<AuthResponse & { success: boolean }> {
  return fetchApi<AuthResponse & { success: boolean }>('/api/auth/2fa/email/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  });
}

export async function login(data: LoginData): Promise<AuthResponse | TwoFARequired> {
  return fetchApi<AuthResponse | TwoFARequired>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginWith2FA(userId: string, code: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/api/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  });
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>(`/api/auth/verify-email?token=${token}`);
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function walletLogin(data: WalletLoginData): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/api/auth/wallet', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<User> {
  return fetchApi<User>('/api/auth/me');
}

export async function updateProfile(data: {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  return fetchApi<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addWallet(data: {
  address: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE';
}): Promise<{ id: string; address: string }> {
  return fetchApi('/api/auth/wallet/add', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeWallet(walletId: string): Promise<void> {
  return fetchApi(`/api/auth/wallet/${walletId}`, {
    method: 'DELETE',
  });
}

export async function upgradeAccountType(accountType: 'SOCIAL' | 'TRADER' | 'CREATOR'): Promise<{
  success: boolean;
  message: string;
  accountType: string;
  requiresKyc: boolean;
}> {
  return fetchApi('/api/auth/account-type', {
    method: 'PUT',
    body: JSON.stringify({ accountType }),
  });
}

// ========== KYC API ==========

export async function getKycRequirements(): Promise<KycRequirements> {
  return fetchApi<KycRequirements>('/api/kyc/requirements');
}

export async function getKycStatus(): Promise<KycStatusResponse> {
  return fetchApi<KycStatusResponse>('/api/kyc/status');
}

export async function submitKyc(data: KycSubmitData): Promise<{
  message: string;
  verificationId: string;
  status: string;
}> {
  return fetchApi('/api/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createDiditSession(): Promise<{
  sessionId: string;
  verificationUrl: string;
}> {
  return fetchApi('/api/kyc/didit/session', {
    method: 'POST',
  });
}

export async function refreshKycStatus(): Promise<{
  status: string;
  updated: boolean;
}> {
  return fetchApi('/api/kyc/refresh', {
    method: 'POST',
  });
}

export async function dismissKycBanner(): Promise<{ success: boolean }> {
  return fetchApi('/api/kyc/banner/dismiss', {
    method: 'POST',
  });
}
