'use client';

import { useState } from 'react';
import { useAuth, useKycStatus } from '@/lib/auth';
import { createDiditSession } from '@/lib/auth/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Fingerprint,
  Camera,
  FileCheck,
} from 'lucide-react';

export default function KycPage() {
  const { user, isAuthenticated } = useAuth();
  const { status, details, isLoading: kycLoading, isVerified, isPending, isRejected } = useKycStatus();
  const [isStartingKyc, setIsStartingKyc] = useState(false);

  const handleStartKyc = async () => {
    setIsStartingKyc(true);

    try {
      const result = await createDiditSession();
      
      // Redirect to Didit verification page
      if (result.verificationUrl) {
        window.location.href = result.verificationUrl;
      } else {
        toast.error('Failed to get verification URL');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start KYC verification');
    } finally {
      setIsStartingKyc(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access KYC verification.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete identity verification to unlock all platform features.
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isVerified && <ShieldCheck className="h-6 w-6 text-green-500" />}
            {isPending && <Clock className="h-6 w-6 text-yellow-500" />}
            {isRejected && <ShieldAlert className="h-6 w-6 text-red-500" />}
            {!isVerified && !isPending && !isRejected && <Shield className="h-6 w-6 text-muted-foreground" />}
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerified && (
            <div className="flex items-start gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-400">Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Your identity has been verified. You have full access to all platform features.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Clock className="h-6 w-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400">Pending Review</h3>
                <p className="text-sm text-muted-foreground">
                  Your verification is being reviewed. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="flex items-start gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400">Verification Rejected</h3>
                <p className="text-sm text-muted-foreground">
                  {details?.verifications[0]?.rejectionReason || 
                    'Your verification was rejected. Please submit again with valid documents.'}
                </p>
              </div>
            </div>
          )}

          {!isVerified && !isPending && !isRejected && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <AlertTriangle className="h-6 w-6 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Not Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Complete KYC verification to unlock token launching and higher trading limits.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Verification Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Launch and create your own tokens</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Higher trading limits</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Verified badge on your profile</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Access to premium features</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Start KYC Verification */}
      {!isVerified && !isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-orange-500" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Complete a quick identity check powered by Didit. This process takes about 2-3 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* How it works */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">How it works:</h4>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Take a selfie</p>
                    <p className="text-xs text-muted-foreground">Quick face capture for identity matching</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Scan your ID</p>
                    <p className="text-xs text-muted-foreground">Passport, driver&apos;s license, or national ID</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Get verified</p>
                    <p className="text-xs text-muted-foreground">Most verifications complete in under 5 minutes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                What you&apos;ll need
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A valid government-issued ID (passport, driver&apos;s license, or ID card)</li>
                <li>• A device with a camera (phone or computer)</li>
                <li>• Good lighting for clear photos</li>
              </ul>
            </div>

            {/* Security note */}
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Your data is secure
              </h4>
              <p className="text-sm text-muted-foreground">
                Verification is handled securely by Didit. Your documents are encrypted and only used for identity verification.
                We never store your raw document images.
              </p>
            </div>

            <Button
              onClick={handleStartKyc}
              className="w-full bg-gradient-fire hover:opacity-90 h-12 text-lg"
              disabled={isStartingKyc}
            >
              {isStartingKyc ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Verification...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Start Identity Verification
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to Didit&apos;s{' '}
              <a href="https://didit.me/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://didit.me/terms" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                Terms of Service
              </a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
