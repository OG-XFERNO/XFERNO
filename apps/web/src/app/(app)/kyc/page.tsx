'use client';

import { useState } from 'react';
import { useAuth, useKycStatus } from '@/lib/auth';
import * as authApi from '@/lib/auth/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';

const documentTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'id_card', label: 'National ID Card' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'OTHER', label: 'Other' },
];

export default function KycPage() {
  const { user, isAuthenticated } = useAuth();
  const { status, details, isLoading: kycLoading, isVerified, isPending, isRejected } = useKycStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [documentType, setDocumentType] = useState<'passport' | 'driver_license' | 'id_card'>('passport');
  const [documentCountry, setDocumentCountry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authApi.submitKyc({
        firstName,
        lastName,
        dateOfBirth,
        documentType,
        documentCountry,
      });
      toast.success('KYC verification submitted successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit KYC');
    } finally {
      setIsSubmitting(false);
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

      {/* Verification Form */}
      {!isVerified && !isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Verification</CardTitle>
            <CardDescription>
              Provide your personal information for identity verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((doc) => (
                      <SelectItem key={doc.value} value={doc.value}>
                        {doc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentCountry">Document Country</Label>
                <Select value={documentCountry} onValueChange={setDocumentCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-fire hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
