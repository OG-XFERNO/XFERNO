'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyEmail, resendVerification } from '@/lib/auth/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [requiresKyc, setRequiresKyc] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        
        // Log in the user
        await loginWithToken(response.accessToken);
        
        // Check if KYC is needed based on account type
        const needsKyc = response.user.accountType === 'TRADER' || response.user.accountType === 'CREATOR';
        setRequiresKyc(needsKyc);
        
        setStatus('success');
      } catch (err: any) {
        setError(err.message || 'Verification failed');
        setStatus('error');
      }
    };

    verify();
  }, [token, loginWithToken]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
          <p className="text-zinc-400">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'no-token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-zinc-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Invalid Verification Link</h1>
            <p className="text-zinc-400">
              This verification link is invalid or has expired. Please request a new verification email.
            </p>
            <div className="pt-4">
              <Link href="/">
                <Button className="w-full">Return Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-zinc-400">{error}</p>
            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Show resend dialog or navigate to login
                  router.push('/');
                }}
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-zinc-400">
              Your email has been verified successfully. {requiresKyc 
                ? 'Complete KYC to unlock all features.' 
                : 'You can now access all features.'}
            </p>
          </div>

          {requiresKyc ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-orange-400 font-medium mb-2">KYC Verification Required</p>
                <p className="text-sm text-zinc-400">
                  Your account type requires identity verification before you can trade or launch tokens.
                  This process usually takes less than 5 minutes.
                </p>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                onClick={() => window.location.href = '/kyc'}
              >
                Start KYC Verification
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/'}>
                Skip for Now (Limited Access)
              </Button>
            </div>
          ) : (
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
