import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'rounded' | 'circular';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#EAEAEA]/10',
        {
          'rounded-md': variant === 'default',
          'rounded-xl': variant === 'rounded',
          'rounded-full': variant === 'circular',
        },
        className
      )}
      {...props}
    />
  );
}

// Preset skeleton components for common use cases
function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4 w-full', i === lines - 1 && lines > 1 && 'w-3/4')} />
      ))}
    </div>
  );
}

function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-24 rounded-xl', className)} />;
}

function SkeletonAvatar({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return <Skeleton className={cn(sizeClasses[size], className)} variant="circular" />;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 rounded-xl bg-[#1A1A1F] p-6', className)}>
      <div className="flex items-center space-x-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}

function SkeletonMessage({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-3', className)}>
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2 rounded-lg bg-[#1A1A1F] p-3">
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonButton, SkeletonAvatar, SkeletonCard, SkeletonMessage };
