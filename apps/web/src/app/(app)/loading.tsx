import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="container py-12 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
