'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Rocket, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  Eye,
  Heart,
  MessageCircle,
  Coins,
  Video,
  Crown,
  AlertCircle,
  Mail,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { register, resendVerification } from '@/lib/auth/api';
import type { AccountType, RegisterResponse } from '@/lib/auth/types';

interface RegistrationStepperProps {
  onSuccess: (response: RegisterResponse) => void;
  onSwitchToLogin: () => void;
}

const ACCOUNT_TYPES = [
  {
    type: 'SOCIAL' as AccountType,
    title: 'Social',
    subtitle: 'Browse & Engage',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/50',
    bgColor: 'bg-blue-500/10',
    requiresKyc: false,
    features: [
      { icon: Eye, text: 'View all token projects' },
      { icon: Heart, text: 'Like and follow creators' },
      { icon: MessageCircle, text: 'Engage in discussions' },
      { icon: Users, text: 'Join communities' },
    ],
    restrictions: [
      'Cannot trade or buy/sell tokens',
      'Cannot launch tokens',
      'Cannot create groups or streams',
    ],
  },
  {
    type: 'TRADER' as AccountType,
    title: 'Trader',
    subtitle: 'Buy & Sell',
    icon: TrendingUp,
    color: 'from-orange-500 to-amber-500',
    borderColor: 'border-orange-500/50',
    bgColor: 'bg-orange-500/10',
    requiresKyc: true,
    features: [
      { icon: Check, text: 'All Social features' },
      { icon: Coins, text: 'Buy and sell tokens' },
      { icon: TrendingUp, text: 'Trade on bonding curves' },
      { icon: Shield, text: 'Access to all markets' },
    ],
    restrictions: [
      'Cannot launch tokens',
      'Cannot create groups or streams',
    ],
  },
  {
    type: 'CREATOR' as AccountType,
    title: 'Creator',
    subtitle: 'Launch & Build',
    icon: Rocket,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-purple-500/10',
    requiresKyc: true,
    features: [
      { icon: Check, text: 'All Trader features' },
      { icon: Rocket, text: 'Launch new tokens' },
      { icon: Crown, text: 'Create public/private groups' },
      { icon: Video, text: 'Start live streams' },
    ],
    restrictions: [],
  },
];

const STEPS = [
  { id: 1, title: 'Account Type', description: 'Choose your experience' },
  { id: 2, title: 'Your Details', description: 'Create your account' },
  { id: 3, title: 'Verification', description: 'Confirm your email' },
];

export function RegistrationStepper({ onSuccess, onSwitchToLogin }: RegistrationStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegisterResponse | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 1 && !selectedType) {
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) return;

      setIsLoading(true);
      try {
        const result = await register({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          displayName: formData.displayName || undefined,
          accountType: selectedType!,
        });
        setRegistrationResult(result);
        setCurrentStep(3);
      } catch (error: any) {
        setErrors({ submit: error.message || 'Registration failed' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registrationResult) return;

    try {
      await resendVerification(registrationResult.email);
      setResendCooldown(60);
    } catch (error: any) {
      setErrors({ resend: error.message });
    }
  };

  const selectedTypeInfo = ACCOUNT_TYPES.find(t => t.type === selectedType);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                )}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={cn(
                  'text-sm font-medium',
                  currentStep >= step.id ? 'text-white' : 'text-zinc-500'
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-zinc-500">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-0.5 mx-2 sm:mx-4',
                  currentStep > step.id ? 'bg-green-500' : 'bg-zinc-800'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Account Type</h2>
              <p className="text-zinc-400">Select the experience that fits your needs</p>
            </div>

            <div className="grid gap-4">
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={cn(
                    'relative p-6 rounded-xl border-2 text-left transition-all',
                    selectedType === type.type
                      ? `${type.borderColor} ${type.bgColor}`
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      type.color
                    )}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{type.title}</h3>
                        <span className="text-sm text-zinc-400">— {type.subtitle}</span>
                        {type.requiresKyc && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            KYC Required
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {type.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                            <feature.icon className="w-4 h-4 text-green-500" />
                            {feature.text}
                          </div>
                        ))}
                      </div>
                      {type.restrictions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Restrictions:</p>
                          <div className="flex flex-wrap gap-2">
                            {type.restrictions.map((restriction, i) => (
                              <span key={i} className="text-xs text-zinc-500">
                                • {restriction}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedType === type.type && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <span>Creating a</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-sm font-medium bg-gradient-to-r',
                  selectedTypeInfo?.color,
                  'text-white'
                )}>
                  {selectedTypeInfo?.title}
                </span>
                <span>account</span>
                {selectedTypeInfo?.requiresKyc && (
                  <span className="flex items-center gap-1 text-orange-400 text-sm">
                    <Shield className="w-4 h-4" />
                    KYC Required
                  </span>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name (optional)</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {selectedTypeInfo?.requiresKyc && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-medium">KYC Verification Required</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      After verifying your email, you&apos;ll need to complete identity verification to access trading features. 
                      This usually takes less than 30 minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentStep === 3 && registrationResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <Mail className="w-10 h-10 text-green-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-zinc-400">
                We&apos;ve sent a verification link to
              </p>
              <p className="text-white font-medium mt-1">{registrationResult.email}</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-sm text-zinc-400">
                Click the link in your email to verify your account and {registrationResult.requiresKyc ? 'start KYC verification' : 'start using XFERNO'}.
              </p>
            </div>

            {registrationResult.requiresKyc && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-3 text-left">
                  <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-medium">Next: KYC Verification</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      After email verification, you&apos;ll be prompted to complete identity verification. 
                      If manual review is required, it may take up to 30 minutes. During this time, 
                      trading features will be restricted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendCooldown > 0}
                className="w-full"
              >
                {resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Verification Email'
                )}
              </Button>

              <Button onClick={onSwitchToLogin} className="w-full">
                Go to Login
              </Button>
            </div>

            {errors.resend && (
              <p className="text-red-400 text-sm">{errors.resend}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onSwitchToLogin : handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Login' : 'Back'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={(currentStep === 1 && !selectedType) || isLoading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                {currentStep === 2 ? 'Create Account' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
