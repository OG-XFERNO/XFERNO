'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import {
  useCreationFee,
  useCreateToken,
  isChainSupported,
  getExplorerTxUrl,
} from '@/lib/contracts';
import { useAuth, useAccountType, useKycStatus } from '@/lib/auth';
import { txToast, dismissToast, toastSuccess, toastError } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConnectButton } from '@/components/wallet/connect-button';
import {
  Rocket,
  Coins,
  Globe,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Twitter,
  MessageCircle,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Lock,
} from 'lucide-react';

interface TokenFormData {
  // Step 1: Token Details
  name: string;
  symbol: string;
  description: string;
  // Step 2: Tokenomics
  totalSupply: string;
  initialPrice: string;
  creatorAllocation: string;
  // Step 3: Project Info
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  logoUrl: string;
}

const initialFormData: TokenFormData = {
  name: '',
  symbol: '',
  description: '',
  totalSupply: '1000000000',
  initialPrice: '0.000001',
  creatorAllocation: '0',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  logoUrl: '',
};

const steps = [
  { id: 1, title: 'Token Details', icon: Coins, description: 'Basic token information' },
  { id: 2, title: 'Tokenomics', icon: Sparkles, description: 'Supply & pricing' },
  { id: 3, title: 'Project Info', icon: Globe, description: 'Links & branding' },
  { id: 4, title: 'Review & Launch', icon: Rocket, description: 'Confirm & deploy' },
];

export default function LaunchPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canLaunch, accountType } = useAccountType();
  const { isVerified, isPending: kycPending } = useKycStatus();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TokenFormData>(initialFormData);

  // Access control - redirect non-authenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show access denied for non-creator accounts
  if (!authLoading && isAuthenticated && !canLaunch) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto border-red-500/20 bg-red-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
              <Lock className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Creator Account Required</CardTitle>
            <CardDescription className="text-base mt-2">
              Only Creator accounts can launch new tokens on XFERNO.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your current account type is <Badge variant="outline" className="ml-1">{accountType}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              To launch tokens, you need to upgrade to a Creator account. Creator accounts have access to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Launch new tokens with custom bonding curves</li>
              <li>• Create public and private communities</li>
              <li>• Start live streams for your community</li>
              <li>• Full trading capabilities</li>
            </ul>
            <div className="flex justify-center gap-3 pt-4">
              <Link href="/settings">
                <Button className="bg-gradient-fire hover:opacity-90">
                  <Rocket className="mr-2 h-4 w-4" />
                  Upgrade to Creator
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show KYC required message if not verified
  if (!authLoading && isAuthenticated && canLaunch && !isVerified) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-yellow-500/10">
              {kycPending ? (
                <Shield className="h-12 w-12 text-yellow-500" />
              ) : (
                <ShieldAlert className="h-12 w-12 text-yellow-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {kycPending ? 'KYC Verification Pending' : 'KYC Verification Required'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {kycPending 
                ? 'Your identity verification is being reviewed. This can take up to 30 minutes.'
                : 'You need to complete identity verification before launching tokens.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              KYC verification helps us maintain a safe and compliant platform for all users.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              {!kycPending && (
                <Link href="/kyc">
                  <Button className="bg-gradient-fire hover:opacity-90">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Start Verification
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const [errors, setErrors] = useState<Partial<TokenFormData>>({});
  const [launchSuccess, setLaunchSuccess] = useState(false);

  // Contract hooks
  const { data: creationFee } = useCreationFee();
  const { createToken, isPending, isConfirming, isSuccess, hash, error: txError } = useCreateToken();

  // Check if chain is supported
  const chainSupported = isChainSupported(chainId);

  // Toast tracking
  const toastIdRef = useRef<string | number | null>(null);
  const explorerUrl = getExplorerTxUrl(chainId, hash || '');

  // Handle transaction states with toasts
  useEffect(() => {
    if (isPending && !toastIdRef.current) {
      toastIdRef.current = txToast.pending('Creating your token...');
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming && hash && toastIdRef.current) {
      dismissToast(toastIdRef.current);
      toastIdRef.current = txToast.submitted(hash, explorerUrl?.split('/tx/')[0]);
    }
  }, [isConfirming, hash, explorerUrl]);

  useEffect(() => {
    if (isSuccess && hash) {
      if (toastIdRef.current) {
        dismissToast(toastIdRef.current);
        toastIdRef.current = null;
      }
      txToast.success('Token created successfully!', hash, explorerUrl?.split('/tx/')[0]);
      setLaunchSuccess(true);
    }
  }, [isSuccess, hash, explorerUrl]);

  useEffect(() => {
    if (txError) {
      if (toastIdRef.current) {
        dismissToast(toastIdRef.current);
        toastIdRef.current = null;
      }
      const errorMsg = txError.message?.includes('User rejected')
        ? undefined
        : txError.message?.slice(0, 100);
      if (txError.message?.includes('User rejected')) {
        txToast.rejected();
      } else {
        txToast.error('Token creation failed', errorMsg);
      }
    }
  }, [txError]);

  const updateField = (field: keyof TokenFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TokenFormData> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Token name is required';
      if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required';
      if (formData.symbol.length > 10) newErrors.symbol = 'Symbol must be 10 characters or less';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    }

    if (step === 2) {
      if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
        newErrors.totalSupply = 'Valid supply required';
      }
      if (!formData.initialPrice || parseFloat(formData.initialPrice) <= 0) {
        newErrors.initialPrice = 'Valid price required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = async () => {
    if (!validateStep(currentStep)) return;
    if (!creationFee) return;

    // Build social links array
    const socialLinks: string[] = [];
    if (formData.website) socialLinks.push(formData.website);
    if (formData.twitter) socialLinks.push(formData.twitter);
    if (formData.telegram) socialLinks.push(formData.telegram);
    if (formData.discord) socialLinks.push(formData.discord);

    try {
      await createToken({
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        description: formData.description,
        imageUri: formData.logoUrl,
        socialLinks,
        value: creationFee,
      });
    } catch (err) {
      console.error('Failed to launch token:', err);
    }
  };

  const handleStartOver = () => {
    setLaunchSuccess(false);
    setCurrentStep(1);
    setFormData(initialFormData);
  };

  const estimatedMarketCap = parseFloat(formData.totalSupply || '0') * parseFloat(formData.initialPrice || '0');
  const platformFee = creationFee ? parseFloat(formatEther(creationFee)) : 0.001;
  const estimatedGas = 0.002; // ETH estimate

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="fire" className="mb-4">
          <Rocket className="w-3 h-3 mr-1" />
          Token Launchpad
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Launch Your Token</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create and deploy your token in minutes with our bonding curve mechanism.
          Fair launch, no pre-sales.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 px-4 sm:px-0">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 bg-muted mx-6 sm:mx-12">
            <div
              className="h-full bg-gradient-fire transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-gradient-fire text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium hidden sm:block text-center max-w-[80px] ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const StepIcon = steps[currentStep - 1].icon;
              return <StepIcon className="w-5 h-5 text-primary" />;
            })()}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Token Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Token Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., My Awesome Token"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., AWESOME"
                        value={formData.symbol}
                        onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
                        maxLength={10}
                        className={errors.symbol ? 'border-destructive' : ''}
                      />
                      {errors.symbol && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.symbol}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your token project..."
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Tokenomics */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="totalSupply">Total Supply *</Label>
                      <Input
                        id="totalSupply"
                        type="number"
                        placeholder="1000000000"
                        value={formData.totalSupply}
                        onChange={(e) => updateField('totalSupply', e.target.value)}
                        className={errors.totalSupply ? 'border-destructive' : ''}
                      />
                      {errors.totalSupply && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.totalSupply}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initialPrice">Initial Price (ETH) *</Label>
                      <Input
                        id="initialPrice"
                        type="number"
                        step="0.000001"
                        placeholder="0.000001"
                        value={formData.initialPrice}
                        onChange={(e) => updateField('initialPrice', e.target.value)}
                        className={errors.initialPrice ? 'border-destructive' : ''}
                      />
                      {errors.initialPrice && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.initialPrice}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creatorAllocation">Creator Allocation (%)</Label>
                    <Input
                      id="creatorAllocation"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={formData.creatorAllocation}
                      onChange={(e) => updateField('creatorAllocation', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum 10% creator allocation (0% recommended for fair launch)
                    </p>
                  </div>

                  {/* Tokenomics Preview */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-3">Tokenomics Preview</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Supply</span>
                          <span>{parseFloat(formData.totalSupply || '0').toLocaleString()} {formData.symbol || 'TOKEN'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Initial Price</span>
                          <span>{formData.initialPrice} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Initial Market Cap</span>
                          <span className="text-gradient-fire font-medium">
                            {estimatedMarketCap.toFixed(4)} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonding Curve</span>
                          <span>Linear (y = x)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Project Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={formData.logoUrl}
                        onChange={(e) => updateField('logoUrl', e.target.value)}
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 400x400px PNG or SVG
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yourproject.com"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">
                        <Twitter className="w-4 h-4 inline mr-2" />
                        Twitter
                      </Label>
                      <Input
                        id="twitter"
                        placeholder="@yourproject"
                        value={formData.twitter}
                        onChange={(e) => updateField('twitter', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram">
                        <MessageCircle className="w-4 h-4 inline mr-2" />
                        Telegram
                      </Label>
                      <Input
                        id="telegram"
                        placeholder="t.me/yourproject"
                        value={formData.telegram}
                        onChange={(e) => updateField('telegram', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discord">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Discord
                    </Label>
                    <Input
                      id="discord"
                      placeholder="discord.gg/yourproject"
                      value={formData.discord}
                      onChange={(e) => updateField('discord', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review & Launch */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Token Preview Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-fire flex items-center justify-center text-2xl font-bold text-white">
                          {formData.symbol.slice(0, 2) || '??'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{formData.name || 'Token Name'}</h3>
                          <p className="text-muted-foreground">${formData.symbol || 'SYMBOL'}</p>
                          <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                            {formData.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          Tokenomics
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Supply</span>
                            <span>{parseFloat(formData.totalSupply).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Initial Price</span>
                            <span>{formData.initialPrice} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Market Cap</span>
                            <span>{estimatedMarketCap.toFixed(4)} ETH</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Launch Costs
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform Fee</span>
                            <span>{platformFee} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Gas</span>
                            <span>~{estimatedGas} ETH</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2 mt-2">
                            <span>Total</span>
                            <span className="text-gradient-fire">~{(platformFee + estimatedGas).toFixed(4)} ETH</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Links Preview */}
                  {(formData.website || formData.twitter || formData.telegram) && (
                    <div className="flex flex-wrap gap-2">
                      {formData.website && (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="w-3 h-3" />
                          Website
                        </Badge>
                      )}
                      {formData.twitter && (
                        <Badge variant="outline" className="gap-1">
                          <Twitter className="w-3 h-3" />
                          Twitter
                        </Badge>
                      )}
                      {formData.telegram && (
                        <Badge variant="outline" className="gap-1">
                          <MessageCircle className="w-3 h-3" />
                          Telegram
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Transaction Error */}
          {txError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Transaction Failed</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {txError.message || 'An error occurred while launching your token.'}
              </p>
            </div>
          )}

          {/* Chain Not Supported Warning */}
          {!chainSupported && isConnected && currentStep === 4 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Testnet Required</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                XFERNO contracts are not yet deployed on this network. Please switch to Sepolia or Base Sepolia testnet.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isPending || isConfirming}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button onClick={nextStep} className="gap-2 bg-gradient-fire hover:opacity-90">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : isConnected ? (
              <Button
                onClick={handleLaunch}
                disabled={isPending || isConfirming || !chainSupported}
                className="gap-2 bg-gradient-fire hover:opacity-90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch Token
                  </>
                )}
              </Button>
            ) : (
              <ConnectButton />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      {launchSuccess && hash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 border-green-500/50">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Token Launched! 🎉</h3>
              <p className="text-muted-foreground mb-4">
                Your token <span className="font-medium">{formData.name}</span> (${formData.symbol.toUpperCase()}) has been successfully created.
              </p>
              
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <a
                  href={getExplorerTxUrl(chainId, hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline flex items-center justify-center gap-1"
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStartOver}
                >
                  Launch Another
                </Button>
                <Button
                  className="flex-1 bg-gradient-fire hover:opacity-90"
                  onClick={() => window.location.href = '/tokens'}
                >
                  View Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
