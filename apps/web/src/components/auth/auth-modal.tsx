'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, Wallet, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { RegistrationStepper } from './registration-stepper';
import type { RegisterResponse } from '@/lib/auth/types';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login, loginWithWallet, isLoading } = useAuth();
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setEmailNotVerified(null);
    
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      // Check if it's an email not verified error
      if (err.message?.includes('verify your email') || err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(email);
      } else {
        setLoginError(err.message || 'Login failed');
      }
    }
  };

  const handleRegistrationSuccess = (response: RegisterResponse) => {
    toast.success(response.message);
    // Don't close modal - show verification step
  };

  const handleWalletLogin = async () => {
    try {
      await loginWithWallet();
      toast.success('Welcome!');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wallet login failed');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setLoginError(null);
    setEmailNotVerified(null);
  };

  const switchToRegister = () => {
    setMode('register');
    resetForm();
  };

  const switchToLogin = () => {
    setMode('login');
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className={mode === 'register' ? 'sm:max-w-[700px] max-h-[90vh] overflow-y-auto' : 'sm:max-w-[425px]'}>
        {mode === 'login' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-fire">
                Welcome to XFERNO
              </DialogTitle>
              <DialogDescription>
                Sign in to access all features, track your portfolio, and launch tokens.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Wallet Login */}
              <Button
                onClick={handleWalletLogin}
                disabled={!isConnected || isLoading}
                className="w-full h-12 bg-gradient-fire hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-5 w-5" />
                )}
                {isConnected ? 'Sign in with Wallet' : 'Connect Wallet First'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Email Not Verified Warning */}
              {emailNotVerified && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-medium">Email Not Verified</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Please check your inbox for the verification email sent to {emailNotVerified}.
                      </p>
                      <Button
                        variant="link"
                        className="text-orange-400 p-0 h-auto mt-2"
                        onClick={async () => {
                          try {
                            const { resendVerification } = await import('@/lib/auth/api');
                            await resendVerification(emailNotVerified);
                            toast.success('Verification email sent!');
                          } catch (err) {
                            toast.error('Failed to resend verification email');
                          }
                        }}
                      >
                        Resend verification email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Error */}
              {loginError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              {/* Switch to Register */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?
                </p>
                <Button
                  variant="link"
                  onClick={switchToRegister}
                  className="text-orange-500 hover:text-orange-400"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-fire text-center">
                Create Your XFERNO Account
              </DialogTitle>
              <DialogDescription className="text-center">
                Choose your account type and join the future of decentralized token launches.
              </DialogDescription>
            </DialogHeader>

            <RegistrationStepper
              onSuccess={handleRegistrationSuccess}
              onSwitchToLogin={switchToLogin}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
