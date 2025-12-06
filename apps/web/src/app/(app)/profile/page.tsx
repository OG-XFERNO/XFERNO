'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import * as authApi from '@/lib/auth/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User, Save, Wallet, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authApi.updateProfile({
        displayName: displayName || undefined,
        username: username || undefined,
        bio: bio || undefined,
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    try {
      await authApi.removeWallet(walletId);
      await refreshUser();
      toast.success('Wallet removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove wallet');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your public profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your public display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscores.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || 'No email linked'}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wallets Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallets
          </CardTitle>
          <CardDescription>
            Manage wallets linked to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.wallets && user.wallets.length > 0 ? (
            <div className="space-y-3">
              {user.wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {wallet.networkType}
                    </Badge>
                    {wallet.isPrimary && (
                      <Badge className="bg-gradient-fire text-xs">Primary</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-500"
                    onClick={() => handleRemoveWallet(wallet.id)}
                    disabled={wallet.isPrimary && user.wallets.length === 1 && !user.email}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No wallets connected.</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-gradient-fire">
                {user?.stats?.tokensCreated || 0}
              </div>
              <div className="text-sm text-muted-foreground">Tokens Created</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-gradient-fire">
                {user?.stats?.tradesCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Trades</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
