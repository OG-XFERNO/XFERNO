'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, ShieldCheck } from 'lucide-react';
import { RegistrationStepper } from './registration-stepper';
import type { RegisterResponse } from '@/lib/auth/types';

// Session storage key for 2FA state
const TWO_FA_STATE_KEY = 'xferno_2fa_state';

interface TwoFAState {
  userId: string;
  email: string;
  type: 'email' | 'authenticator';
}

function get2FAState(): TwoFAState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(TWO_FA_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function set2FAState(state: TwoFAState | null) {
  if (typeof window === 'undefined') return;
  if (state) {
    sessionStorage.setItem(TWO_FA_STATE_KEY, JSON.stringify(state));
  } else {
    sessionStorage.removeItem(TWO_FA_STATE_KEY);
  }
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login, loginWith2FA, loginWithEmail2FA, sendEmail2FACode, isLoading } = useAuth();
  
  // Initialize state from sessionStorage to survive HMR
  const stored2FA = get2FAState();
  const [mode, setMode] = useState<'login' | 'register' | '2fa'>(stored2FA ? '2fa' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(stored2FA?.userId ?? null);
  const [twoFAEmail, setTwoFAEmail] = useState<string | null>(stored2FA?.email ?? null);
  const [twoFAType, setTwoFAType] = useState<'email' | 'authenticator'>(stored2FA?.type ?? 'authenticator');
  const [twoFACode, setTwoFACode] = useState('');
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  
  // Track if we're handling 2FA to prevent modal from closing
  const [handling2FA, setHandling2FA] = useState(!!stored2FA);
  
  // Guard against double submissions
  const isSubmittingRef = useRef(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against double submission
    if (isSubmittingRef.current || isLoading) {
      console.log('Already submitting, ignoring');
      return;
    }
    isSubmittingRef.current = true;
    
    setLoginError(null);
    setEmailNotVerified(null);
    
    try {
      const result = await login({ email, password });
      console.log('Login result:', result);
      // Check if 2FA is required
      if (result && 'requires2FA' in result && result.requires2FA) {
        console.log('2FA required, type:', result.twoFAType);
        const twoFAData = {
          userId: result.userId,
          email: result.email,
          type: result.twoFAType || 'authenticator',
        };
        // Persist to sessionStorage to survive HMR
        set2FAState(twoFAData);
        setHandling2FA(true);
        setTwoFAUserId(twoFAData.userId);
        setTwoFAEmail(twoFAData.email);
        setTwoFAType(twoFAData.type);
        setMode('2fa');
        console.log('Mode set to 2fa, state persisted');
        
        // If email 2FA, automatically send the code
        if (result.twoFAType === 'email') {
          try {
            await sendEmail2FACode(result.userId, result.email);
            setEmailOTPSent(true);
            toast.success('Verification code sent to your email');
          } catch {
            toast.error('Failed to send verification code');
          }
        }
        return;
      }
      toast.success('Welcome back!');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error('Login error:', err);
      // Check if it's an email not verified error
      if (err.message?.includes('verify your email') || err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(email);
      } else {
        setLoginError(err.message || 'Login failed');
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!twoFAUserId) return;

    try {
      if (twoFAType === 'email' && twoFAEmail) {
        await loginWithEmail2FA(twoFAUserId, twoFAEmail, twoFACode);
      } else {
        await loginWith2FA(twoFAUserId, twoFACode);
      }
      toast.success('Welcome back!');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid verification code');
    }
  };

  const resendEmailOTP = async () => {
    if (!twoFAUserId || !twoFAEmail) return;
    try {
      await sendEmail2FACode(twoFAUserId, twoFAEmail);
      toast.success('New verification code sent');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  const handleRegistrationSuccess = (response: RegisterResponse) => {
    toast.success(response.message);
    // Don't close modal - show verification step
  };

  const clearFormFields = () => {
    setEmail('');
    setPassword('');
    setLoginError(null);
    setEmailNotVerified(null);
    setTwoFAUserId(null);
    setTwoFAEmail(null);
    setTwoFAType('authenticator');
    setTwoFACode('');
    setEmailOTPSent(false);
    setHandling2FA(false);
    // Clear persisted 2FA state
    set2FAState(null);
  };

  const resetForm = () => {
    clearFormFields();
    setMode('login');
  };

  const switchToRegister = () => {
    clearFormFields();
    setMode('register');
  };

  const switchToLogin = () => {
    clearFormFields();
    setMode('login');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent modal from closing during 2FA flow
      if (!newOpen && handling2FA) {
        console.log('Preventing modal close during 2FA');
        return;
      }
      if (!newOpen) {
        resetForm();
        setHandling2FA(false);
      }
      onOpenChange(newOpen);
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
        ) : mode === '2fa' ? (
          <>
            {console.log('Rendering 2FA UI, twoFAType:', twoFAType, 'twoFAUserId:', twoFAUserId)}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-fire text-center">
                {twoFAType === 'email' ? 'Check Your Email' : 'Two-Factor Authentication'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {twoFAType === 'email' 
                  ? `Enter the 6-digit code we sent to ${twoFAEmail}`
                  : 'Enter the 6-digit code from your authenticator app.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {loginError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="2fa-code">Verification Code</Label>
                  <div className="relative">
                    {twoFAType === 'email' ? (
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      id="2fa-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-fire" disabled={isLoading || twoFACode.length !== 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign In
                </Button>
              </form>

              <div className="text-center space-y-2">
                {twoFAType === 'email' && (
                  <Button
                    variant="link"
                    onClick={resendEmailOTP}
                    className="text-orange-500"
                  >
                    Resend verification code
                  </Button>
                )}
                <Button
                  variant="link"
                  onClick={resetForm}
                  className="text-muted-foreground"
                >
                  Back to Login
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
