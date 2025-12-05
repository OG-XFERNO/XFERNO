'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  ServerOff,
  FileX,
  Wallet,
  Ban,
} from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function GenericError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[200px]">
      <Card className="max-w-sm w-full border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {showRetry && onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <GenericError
      title="Connection Error"
      description="Unable to connect to the network. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[200px]">
      <Card className="max-w-sm w-full border-warning/50 bg-warning/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center mb-3">
            <ServerOff className="h-5 w-5 text-warning" />
          </div>
          <CardTitle className="text-lg">Server Unavailable</CardTitle>
          <CardDescription>
            Our servers are temporarily unavailable. Please try again later.
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function NotFoundError({
  title = 'Not Found',
  description = 'The resource you are looking for could not be found.',
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[200px]">
      <Card className="max-w-sm w-full border-muted">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileX className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <a href="/">Go Back Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function WalletError({
  title = 'Wallet Connection Required',
  description = 'Please connect your wallet to continue.',
  onConnect,
}: ErrorStateProps & { onConnect?: () => void }) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[200px]">
      <Card className="max-w-sm w-full border-primary/50 bg-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onConnect && (
          <CardContent>
            <Button onClick={onConnect} className="w-full bg-gradient-fire hover:opacity-90 gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function AccessDeniedError() {
  return (
    <div className="flex items-center justify-center p-6 min-h-[200px]">
      <Card className="max-w-sm w-full border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <Ban className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-lg">Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <a href="/">Go Back Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmptyState({
  title = 'No Data',
  description = 'There is nothing to display here yet.',
  icon: Icon = FileX,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {action}
      </div>
    </div>
  );
}

// Inline error message for form fields or small areas
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive mt-1">
      <AlertTriangle className="h-3 w-3" />
      <span>{message}</span>
    </div>
  );
}

// Toast-style error for transient errors
export function ErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
