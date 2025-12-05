export type KYCStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  kycStatus: KYCStatus;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  networkType: 'EVM' | 'SOLANA' | 'MOVE' | 'OTHER';
  isPrimary: boolean;
  createdAt: Date;
}

export interface UserProfile extends User {
  wallets: Wallet[];
  tokensCreated: number;
  totalRaised: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}
