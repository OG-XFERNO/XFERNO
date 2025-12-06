'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  setup2FA,
  enable2FA,
  disable2FA,
  getRecoveryCodesCount,
  regenerateRecoveryCodes,
} from '@/lib/api/two-factor';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export function TwoFactorSettings() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null);

  const is2FAEnabled = user?.twoFactorEnabled;

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const data = await setup2FA();
      if (data.enabled) {
        toast.info('2FA is already enabled');
        return;
      }
      if (data.secret && data.qrCodeUrl) {
        setSetupData({ secret: data.secret, qrCodeUrl: data.qrCodeUrl });
      }
    } catch (error) {
      toast.error('Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!setupData || !verificationCode) return;
    
    setIsLoading(true);
    try {
      const result = await enable2FA(setupData.secret, verificationCode);
      setRecoveryCodes(result.recoveryCodes);
      setShowRecoveryDialog(true);
      setSetupData(null);
      setVerificationCode('');
      await refreshUser();
      toast.success('2FA has been enabled!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode) return;
    
    setIsLoading(true);
    try {
      await disable2FA(disableCode);
      setShowDisableDialog(false);
      setDisableCode('');
      await refreshUser();
      toast.success('2FA has been disabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      toast.success('Secret copied to clipboard');
    }
  };

  const handleCopyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Recovery codes copied to clipboard');
  };

  const handleDownloadRecoveryCodes = () => {
    const codesText = `XFERNO Recovery Codes\n${'='.repeat(30)}\n\nKeep these codes safe. Each can only be used once.\n\n${recoveryCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xferno-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Recovery codes downloaded');
  };

  const loadRecoveryCount = async () => {
    try {
      const data = await getRecoveryCodesCount();
      setRemainingCodes(data.remainingCount);
    } catch {
      // Ignore
    }
  };

  // Load recovery count if 2FA is enabled
  if (is2FAEnabled && remainingCodes === null) {
    loadRecoveryCount();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${is2FAEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                {is2FAEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            <Badge variant={is2FAEnabled ? 'success' : 'secondary'}>
              {is2FAEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <>
              <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Authenticator App Connected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with 2FA
                    </p>
                  </div>
                </div>
              </div>

              {remainingCodes !== null && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Recovery Codes</p>
                      <p className="text-sm text-muted-foreground">
                        {remainingCodes} codes remaining
                      </p>
                    </div>
                  </div>
                  {remainingCodes < 3 && (
                    <Badge variant="destructive">Low</Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDisableDialog(true)}
                  className="text-red-500 hover:text-red-600"
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : setupData ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app
                </p>
                <img
                  src={setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg bg-white p-2"
                />
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1 bg-background rounded text-sm font-mono">
                    {setupData.secret}
                  </code>
                  <Button variant="ghost" size="icon" onClick={handleCopySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSetupData(null);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnable}
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="flex-1 bg-gradient-fire hover:opacity-90"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Enable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Your account is not protected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Enable 2FA to add an extra layer of security
                  </p>
                </div>
              </div>

              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Smartphone className="mr-2 h-4 w-4" />
                )}
                Set Up 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Save Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Store these codes somewhere safe. Each code can only be used once to access your account if you lose your authenticator.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="px-2 py-1 bg-background rounded">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyRecoveryCodes} className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDownloadRecoveryCodes} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <Button onClick={() => setShowRecoveryDialog(false)} className="w-full">
            I've Saved My Codes
          </Button>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldOff className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your 2FA code to disable two-factor authentication. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="disable-code">Verification Code</Label>
            <Input
              id="disable-code"
              placeholder="Enter 6-digit code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDisableDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="mr-2 h-4 w-4" />
              )}
              Disable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
