'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthResponse, LoginData } from './types';
import * as authApi from './api';
import type { TwoFARequired } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<TwoFARequired | void>;
  loginWith2FA: (userId: string, code: string) => Promise<void>;
  loginWithEmail2FA: (userId: string, email: string, code: string) => Promise<void>;
  sendEmail2FACode: (userId: string, email: string) => Promise<void>;
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

  const login = useCallback(async (data: LoginData): Promise<TwoFARequired | void> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      console.log('Auth context login response:', response);
      // Check if 2FA is required
      if ('requires2FA' in response && response.requires2FA) {
        setIsLoading(false);
        return response as TwoFARequired;
      }
      handleAuthResponse(response as AuthResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const loginWith2FA = useCallback(async (userId: string, code: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.loginWith2FA(userId, code);
      handleAuthResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const sendEmail2FACode = useCallback(async (userId: string, email: string) => {
    setError(null);
    try {
      await authApi.sendEmail2FA(userId, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
      throw err;
    }
  }, []);

  const loginWithEmail2FA = useCallback(async (userId: string, email: string, code: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.verifyEmail2FA(userId, code);
      if (response.success) {
        handleAuthResponse(response);
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email 2FA verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

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
    loginWith2FA,
    loginWithEmail2FA,
    sendEmail2FACode,
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
