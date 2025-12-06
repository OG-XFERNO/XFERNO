'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface StaffBadgeProps {
  userId: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface StaffStatus {
  isStaff: boolean;
  staffRole?: string;
  staffSince?: string;
}

export function StaffBadge({ userId, showTooltip = true, size = 'md' }: StaffBadgeProps) {
  const [status, setStatus] = useState<StaffStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch(`${API_BASE}/api/admin/staff-status/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        // Silently fail - just don't show badge
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  if (loading || !status?.isStaff) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const badge = (
    <Badge
      className={`
        bg-gradient-to-r from-orange-500 to-amber-500 
        text-white font-semibold border-0
        shadow-[0_0_10px_rgba(249,115,22,0.3)]
        hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]
        transition-shadow cursor-default
        ${sizeClasses[size]}
      `}
    >
      <ShieldCheck className={`${iconSizes[size]} mr-1`} />
      XFERNO Staff
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold text-orange-400">Official XFERNO Staff</p>
            <p className="text-xs text-muted-foreground">
              Verified team member since{' '}
              {status.staffSince
                ? new Date(status.staffSince).toLocaleDateString()
                : 'recently'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline staff indicator for compact spaces
 */
export function StaffIndicator({ userId }: { userId: string }) {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch(`${API_BASE}/api/admin/staff-status/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setIsStaff(data.isStaff);
        }
      } catch {
        // Silently fail
      }
    }

    if (userId) {
      fetchStatus();
    }
  }, [userId]);

  if (!isStaff) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">
            <Shield className="h-4 w-4 text-orange-500 ml-1" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-orange-400 font-medium">XFERNO Staff</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
