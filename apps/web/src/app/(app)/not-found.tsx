import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileX className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2 bg-gradient-fire hover:opacity-90" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <Link href="/tokens">
                <Search className="h-4 w-4" />
                Explore Tokens
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
