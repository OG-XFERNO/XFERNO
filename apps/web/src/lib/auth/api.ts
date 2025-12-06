import type {
  AuthResponse,
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

export async function register(data: RegisterData): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function walletLogin(data: WalletLoginData): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/wallet', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<User> {
  return fetchApi<User>('/auth/me');
}

export async function updateProfile(data: {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  return fetchApi<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addWallet(data: {
  address: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE';
}): Promise<{ id: string; address: string }> {
  return fetchApi('/auth/wallet/add', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeWallet(walletId: string): Promise<void> {
  return fetchApi(`/auth/wallet/${walletId}`, {
    method: 'DELETE',
  });
}

// ========== KYC API ==========

export async function getKycRequirements(): Promise<KycRequirements> {
  return fetchApi<KycRequirements>('/kyc/requirements');
}

export async function getKycStatus(): Promise<KycStatusResponse> {
  return fetchApi<KycStatusResponse>('/kyc/status');
}

export async function submitKyc(data: KycSubmitData): Promise<{
  message: string;
  verificationId: string;
  status: string;
}> {
  return fetchApi('/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
