'use client';

import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { createElement } from 'react';

/**
 * Custom toast utilities for XFERNO
 */

export interface ToastOptions {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

// Success toast
export function toastSuccess({ title, description, action, duration = 5000 }: ToastOptions) {
  return toast.success(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
}

// Error toast
export function toastError({ title, description, action, duration = 7000 }: ToastOptions) {
  return toast.error(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
}

// Warning toast
export function toastWarning({ title, description, action, duration = 6000 }: ToastOptions) {
  return toast.warning(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
}

// Info toast
export function toastInfo({ title, description, action, duration = 5000 }: ToastOptions) {
  return toast.info(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  });
}

// Loading toast (returns dismiss function)
export function toastLoading(title: string, description?: string) {
  return toast.loading(title, {
    description,
  });
}

// Dismiss a specific toast
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

// Transaction-specific toasts
export const txToast = {
  pending: (message = 'Transaction pending...') => {
    return toast.loading(message, {
      description: 'Please confirm in your wallet',
    });
  },

  submitted: (txHash: string, explorerUrl?: string) => {
    return toast.loading('Transaction submitted', {
      description: 'Waiting for confirmation...',
      action: explorerUrl ? {
        label: 'View',
        onClick: () => window.open(`${explorerUrl}/tx/${txHash}`, '_blank'),
      } : undefined,
    });
  },

  success: (message = 'Transaction successful!', txHash?: string, explorerUrl?: string) => {
    return toast.success(message, {
      description: txHash ? `TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : undefined,
      action: explorerUrl && txHash ? {
        label: 'View',
        onClick: () => window.open(`${explorerUrl}/tx/${txHash}`, '_blank'),
      } : undefined,
      duration: 7000,
    });
  },

  error: (message = 'Transaction failed', error?: string) => {
    return toast.error(message, {
      description: error || 'Please try again',
      duration: 8000,
    });
  },

  rejected: () => {
    return toast.error('Transaction rejected', {
      description: 'You rejected the transaction in your wallet',
      duration: 5000,
    });
  },
};

// Copy to clipboard with toast
export async function copyToClipboard(text: string, label = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label, {
      description: text.length > 20 ? `${text.slice(0, 10)}...${text.slice(-8)}` : text,
      duration: 2000,
    });
    return true;
  } catch (err) {
    toast.error('Failed to copy', {
      description: 'Please try again',
      duration: 3000,
    });
    return false;
  }
}

// Promise-based toast (for async operations)
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}
