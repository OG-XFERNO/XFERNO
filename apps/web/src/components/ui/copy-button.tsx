'use client';

import { useState } from 'react';
import { Button } from './button';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/hooks';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CopyButton({
  value,
  label = 'Copied!',
  className,
  variant = 'ghost',
  size = 'icon',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value, label);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('h-8 w-8', className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

// Inline copyable text with button
interface CopyableTextProps {
  value: string;
  display?: string;
  label?: string;
  className?: string;
  truncate?: boolean;
}

export function CopyableText({
  value,
  display,
  label = 'Copied!',
  className,
  truncate = true,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value, label);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayText = display || value;
  const truncatedText = truncate && displayText.length > 20
    ? `${displayText.slice(0, 8)}...${displayText.slice(-6)}`
    : displayText;

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground',
        'hover:text-foreground transition-colors cursor-pointer',
        className
      )}
    >
      <span>{truncatedText}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-50 hover:opacity-100" />
      )}
    </button>
  );
}

// Address display with copy functionality
interface AddressDisplayProps {
  address: string;
  label?: string;
  className?: string;
  showFull?: boolean;
}

export function AddressDisplay({
  address,
  label = 'Address copied!',
  className,
  showFull = false,
}: AddressDisplayProps) {
  return (
    <CopyableText
      value={address}
      display={showFull ? address : `${address.slice(0, 6)}...${address.slice(-4)}`}
      label={label}
      className={className}
      truncate={false}
    />
  );
}
