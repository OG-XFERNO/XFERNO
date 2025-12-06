'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@/components/wallet/connect-button';
import { NetworkStatus } from '@/components/wallet/network-status';
import { UserMenu } from '@/components/auth/user-menu';
import { KycBanner } from '@/components/auth/kyc-banner';
import { AuthModal } from '@/components/auth/auth-modal';
import { Menu, X, LogIn, Rocket } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useAccountType } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiresCreator?: boolean;
  hideWhenAuth?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
  { href: '/tokens', label: 'Explore' },
  { href: '/launch', label: 'Launch', requiresAuth: true, requiresCreator: true },
  { href: '/trade', label: 'Trade' },
  { href: '/docs', label: 'Docs', hideWhenAuth: true },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { canLaunch } = useAccountType();

  // Filter nav items based on auth and account type
  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresCreator && !canLaunch) return false;
    if (item.hideWhenAuth && isAuthenticated) return false;
    return true;
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/xferno.svg"
            alt="XFERNO Logo"
            width={144}
            height={32}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <NetworkStatus />
          <ConnectButton />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button 
              onClick={() => setAuthModalOpen(true)}
              className="bg-gradient-fire hover:opacity-90"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-foreground py-2',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
              <ConnectButton />
              {!isAuthenticated && (
                <Button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="bg-gradient-fire hover:opacity-90 w-full"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login / Register
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* KYC Status Banner */}
      <KycBanner />

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
