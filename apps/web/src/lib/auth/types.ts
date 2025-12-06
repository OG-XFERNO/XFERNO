export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type KYCStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AccountType = 'SOCIAL' | 'TRADER' | 'CREATOR';

export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  accountType: AccountType;
  kycStatus: KYCStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  wallets: Wallet[];
  stats?: {
    tokensCreated: number;
    tradesCount: number;
  };
  createdAt: string;
}

export interface Wallet {
  id: string;
  address: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE';
  isPrimary: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    role: UserRole;
    accountType?: AccountType;
    emailVerified?: boolean;
  };
}

export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
  requiresVerification: boolean;
  requiresKyc: boolean;
  accountType: AccountType;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  accountType: AccountType;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface WalletLoginData {
  address: string;
  signature: string;
  message: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE';
}

export interface KycRequirements {
  required: boolean;
  documentTypes: string[];
  supportedCountries: string[];
  benefits: string[];
  restrictions: {
    minAge: number;
    bannedCountries: string[];
  };
}

export interface KycSubmitData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentType: 'passport' | 'driver_license' | 'id_card';
  documentCountry: string;
}

export interface KycStatusResponse {
  status: KYCStatus;
  verifiedAt?: string;
  verifications: {
    id: string;
    status: KYCStatus;
    documentType?: string;
    documentCountry?: string;
    rejectionReason?: string;
    submittedAt: string;
    verifiedAt?: string;
  }[];
}
