'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useKycStatus } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from './auth-modal';
import {
  User,
  Settings,
  LogOut,
  Wallet,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Rocket,
  ChevronDown,
} from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { status: kycStatus, isVerified } = useKycStatus();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={() => setShowAuthModal(true)}
          className="bg-gradient-fire hover:opacity-90"
          size="sm"
        >
          <User className="mr-2 h-4 w-4" />
          Sign In
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  const getKycIcon = () => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'REJECTED':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getKycBadge = () => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 text-xs">Verified</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default:
        return null;
    }
  };

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-gradient-fire text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-sm">
            <span className="font-medium">
              {user?.displayName || user?.username || 'User'}
            </span>
            {getKycBadge()}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user?.displayName || user?.username || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/portfolio" className="cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            Portfolio
          </Link>
        </DropdownMenuItem>

        {isVerified && (
          <DropdownMenuItem asChild>
            <Link href="/launch" className="cursor-pointer">
              <Rocket className="mr-2 h-4 w-4" />
              Launch Token
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/kyc" className="cursor-pointer flex items-center justify-between">
            <div className="flex items-center">
              {getKycIcon()}
              <span className="ml-2">KYC Status</span>
            </div>
            {kycStatus === 'NONE' && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-red-400 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
