'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, upgradeAccountType } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TwoFactorSettings } from '@/components/settings/two-factor-settings';
import { toast } from 'sonner';
import {
  Bell,
  Shield,
  Palette,
  LogOut,
  ChevronDown,
  User,
  Users,
  TrendingUp,
  Rocket,
  Loader2,
  BellRing,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Brevo list IDs
const BREVO_LISTS = {
  EMAIL_NOTIFICATIONS: 4,
  PRICE_ALERTS: 5,
  MARKETING_EMAILS: 6,
};

// localStorage keys for section collapse state
const SECTION_STORAGE_KEY = 'xferno_settings_sections';

interface SectionState {
  account: boolean;
  notifications: boolean;
  security: boolean;
  appearance: boolean;
  danger: boolean;
}

const DEFAULT_SECTIONS: SectionState = {
  account: true,
  notifications: true,
  security: true,
  appearance: true,
  danger: true,
};

export default function SettingsPage() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const [sections, setSections] = useState<SectionState>(DEFAULT_SECTIONS);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: false,
    priceAlerts: false,
    marketingEmails: false,
    browserNotifications: false,
  });
  const [loadingNotifications, setLoadingNotifications] = useState<string | null>(null);

  // Load section states from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SECTION_STORAGE_KEY);
    if (stored) {
      try {
        setSections(JSON.parse(stored));
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Save section states to localStorage
  const toggleSection = (section: keyof SectionState) => {
    setSections((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  // Load notification preferences from API
  useEffect(() => {
    const loadPrefs = async () => {
      if (!user?.email) return;
      try {
        const token = localStorage.getItem('xferno_token');
        const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setNotificationPrefs(data);
        }
      } catch {
        // Preferences not loaded - use defaults
      }
    };
    loadPrefs();
  }, [user?.email]);

  // Update notification preference
  const updateNotificationPref = async (key: keyof typeof notificationPrefs, value: boolean) => {
    setLoadingNotifications(key);
    try {
      const token = localStorage.getItem('xferno_token');
      const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
      toast.success(value ? 'Enabled' : 'Disabled');
    } catch {
      toast.error('Failed to update preference');
    } finally {
      setLoadingNotifications(null);
    }
  };

  // Request browser notification permission
  const requestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateNotificationPref('browserNotifications', true);
    } else {
      toast.error('Notification permission denied');
    }
  };

  // Handle account type change
  const handleAccountTypeChange = async (newType: 'SOCIAL' | 'TRADER' | 'CREATOR') => {
    if (newType === user?.accountType) return;

    setIsUpgrading(true);
    try {
      await upgradeAccountType(newType);
      await refreshUser();
      toast.success(`Account ${newType === 'SOCIAL' ? 'downgraded' : 'upgraded'} to ${newType}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change account type');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const accountTypes = [
    { value: 'SOCIAL', label: 'Social', icon: Users, description: 'Browse and engage with the community' },
    { value: 'TRADER', label: 'Trader', icon: TrendingUp, description: 'Buy and sell tokens' },
    { value: 'CREATOR', label: 'Creator', icon: Rocket, description: 'Launch your own tokens' },
  ] as const;

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security settings.</p>
      </div>

      {/* Account Type */}
      <Collapsible open={sections.account} onOpenChange={() => toggleSection('account')}>
        <Card className="mb-6">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Type
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${sections.account ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>
                Current: <Badge variant="outline">{user?.accountType || 'SOCIAL'}</Badge>
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {accountTypes.map(({ value, label, icon: Icon, description }) => (
                <div
                  key={value}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    user?.accountType === value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border hover:border-orange-500/50'
                  }`}
                  onClick={() => handleAccountTypeChange(value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${user?.accountType === value ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    {user?.accountType === value && <Badge className="bg-orange-500">Current</Badge>}
                    {isUpgrading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Note: Trader and Creator accounts require KYC verification.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Notifications */}
      <Collapsible open={sections.notifications} onOpenChange={() => toggleSection('notifications')}>
        <Card className="mb-6">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${sections.notifications ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>Configure how you receive notifications.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about your trades and tokens.</p>
                </div>
                <Switch
                  checked={notificationPrefs.emailNotifications}
                  onCheckedChange={(v) => updateNotificationPref('emailNotifications', v)}
                  disabled={loadingNotifications === 'emailNotifications'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Price Alerts (Email)</Label>
                  <p className="text-sm text-muted-foreground">Get email notifications for price alerts.</p>
                </div>
                <Switch
                  checked={notificationPrefs.priceAlerts}
                  onCheckedChange={(v) => updateNotificationPref('priceAlerts', v)}
                  disabled={loadingNotifications === 'priceAlerts'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive news and updates from XFERNO.</p>
                </div>
                <Switch
                  checked={notificationPrefs.marketingEmails}
                  onCheckedChange={(v) => updateNotificationPref('marketingEmails', v)}
                  disabled={loadingNotifications === 'marketingEmails'}
                />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <BellRing className="h-4 w-4" />
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Get browser push notifications for price alerts.</p>
                  </div>
                  {notificationPrefs.browserNotifications ? (
                    <Switch
                      checked={true}
                      onCheckedChange={(v) => updateNotificationPref('browserNotifications', v)}
                    />
                  ) : (
                    <Button size="sm" variant="outline" onClick={requestBrowserNotifications}>
                      Enable
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Security - 2FA */}
      <Collapsible open={sections.security} onOpenChange={() => toggleSection('security')}>
        <Card className="mb-6">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${sections.security ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>Two-factor authentication and security settings.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <TwoFactorSettings />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Appearance */}
      <Collapsible open={sections.appearance} onOpenChange={() => toggleSection('appearance')}>
        <Card className="mb-6">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${sections.appearance ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface.</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Show more content in less space.</p>
                </div>
                <Switch disabled />
              </div>
              <p className="text-xs text-muted-foreground">Theme settings coming soon.</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Danger Zone */}
      <Collapsible open={sections.danger} onOpenChange={() => toggleSection('danger')}>
        <Card className="border-red-500/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-red-400">
                <span>Danger Zone</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${sections.danger ? 'rotate-180' : ''}`} />
              </CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sign Out</Label>
                  <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
