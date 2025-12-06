'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import type { User, AuthResponse, LoginData } from './types';
import * as authApi from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'xferno_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authApi
        .getProfile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthResponse = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    // Fetch full profile after login
    authApi.getProfile().then(setUser);
  }, []);

  const login = useCallback(async (data: LoginData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      handleAuthResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const loginWithWallet = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Create sign message
      const timestamp = Date.now();
      const message = `Sign this message to login to XFERNO.\n\nTimestamp: ${timestamp}\nWallet: ${address}`;

      // Request signature
      const signature = await signMessageAsync({ message });

      // Login with wallet
      const response = await authApi.walletLogin({
        address,
        signature,
        message,
        networkType: 'EVM',
      });

      handleAuthResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, signMessageAsync, handleAuthResponse]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch {
        logout();
      }
    }
  }, [logout]);

  // Login with JWT token (used after email verification)
  const loginWithToken = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('Invalid token');
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    loginWithWallet,
    loginWithToken,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for KYC status
export function useKycStatus() {
  const { user, isAuthenticated } = useAuth();
  const [kycStatus, setKycStatus] = useState<Awaited<ReturnType<typeof authApi.getKycStatus>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      authApi
        .getKycStatus()
        .then(setKycStatus)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  return {
    status: user?.kycStatus || 'NONE',
    details: kycStatus,
    isLoading,
    isVerified: user?.kycStatus === 'VERIFIED',
    isPending: user?.kycStatus === 'PENDING',
    isRejected: user?.kycStatus === 'REJECTED',
    requiresKyc: user?.kycStatus === 'NONE',
  };
}

// Hook for account type checks
export function useAccountType() {
  const { user, isAuthenticated } = useAuth();
  
  return {
    accountType: user?.accountType || null,
    isSocial: user?.accountType === 'SOCIAL',
    isTrader: user?.accountType === 'TRADER',
    isCreator: user?.accountType === 'CREATOR',
    canTrade: user?.accountType === 'TRADER' || user?.accountType === 'CREATOR',
    canLaunch: user?.accountType === 'CREATOR',
    isAuthenticated,
  };
}

// Hook for role checks
export function useRole() {
  const { user, isAuthenticated } = useAuth();
  
  return {
    role: user?.role || null,
    isUser: user?.role === 'USER',
    isCreator: user?.role === 'CREATOR',
    isAdmin: user?.role === 'ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    hasAdminAccess: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isAuthenticated,
  };
}
