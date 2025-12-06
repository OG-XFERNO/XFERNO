'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useKycStatus } from '@/lib/auth';
import { refreshKycStatus, dismissKycBanner } from '@/lib/auth/api';
import { ShieldCheck, ShieldAlert, Shield, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function KycBanner() {
  const { user, isAuthenticated } = useAuth();
  const { status: kycStatus, isVerified, isPending, isRejected } = useKycStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [localDismissed, setLocalDismissed] = useState(false);

  const handleDismissVerified = async () => {
    setIsDismissing(true);
    try {
      await dismissKycBanner();
      setLocalDismissed(true);
    } catch (err) {
      toast.error('Failed to dismiss banner');
    } finally {
      setIsDismissing(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshKycStatus();
      if (result.updated) {
        toast.success(`Verification status updated: ${result.status}`);
        window.location.reload();
      } else {
        toast.info('Status unchanged - still pending review');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Don't show banner if not authenticated or loading
  if (!isAuthenticated) {
    return null;
  }

  // Check if banner is dismissed (from user data or local state)
  const bannerDismissed = user?.kycBannerDismissed || localDismissed;

  // Verified banner (dismissible)
  if (isVerified && !bannerDismissed) {
    return (
      <div className="bg-green-500/10 border-b border-green-500/20">
        <div className="container flex items-center justify-center py-2 relative">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Identity Verified</span>
            <span className="text-green-400/70 hidden sm:inline">— You have full access to all platform features</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissVerified}
            disabled={isDismissing}
            className="absolute right-4 h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
          >
            {isDismissing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Pending banner
  if (isPending) {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="container flex items-center justify-center py-2 relative">
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Verification In Review</span>
            <span className="text-yellow-400/70 hidden sm:inline">— This can take up to 30 minutes</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="absolute right-4 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 gap-1"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Checking...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Refresh Status</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Not verified / Rejected banner
  if (kycStatus === 'NONE' || isRejected) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20">
        <div className="container flex items-center justify-center py-2 relative">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <ShieldAlert className="h-4 w-4" />
            <span className="font-medium">
              {isRejected ? 'Verification Rejected' : 'Verification Required'}
            </span>
            <span className="text-red-400/70 hidden sm:inline">
              — {isRejected ? 'Please resubmit your verification' : 'Complete KYC to access trading features'}
            </span>
          </div>
          <Link href="/kyc" className="absolute right-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
            >
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Start KYC</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
