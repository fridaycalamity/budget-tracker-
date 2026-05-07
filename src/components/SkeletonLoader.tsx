interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'transaction' | 'chart';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'text', count = 1, className = '' }: SkeletonLoaderProps) {
  const pulse = 'animate-pulse bg-[linear-gradient(90deg,#E5E1D8,#F4F1EA,#E5E1D8)]';

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return <div className={`h-4 ${pulse} ${className}`} />;
      case 'card':
        return (
          <div className={`app-panel shadow-md p-6 space-y-3 ${className}`}>
            <div className={`h-4 w-1/3 ${pulse}`} />
            <div className={`h-10 w-1/2 ${pulse}`} />
          </div>
        );
      case 'transaction':
        return (
          <div className={`app-panel shadow-sm p-4 ${className}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-3/4 ${pulse}`} />
                <div className={`h-3 w-1/2 ${pulse}`} />
              </div>
              <div className={`h-6 w-20 ${pulse}`} />
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className={`app-panel p-6 ${className}`}>
            <div className={`mb-4 h-4 w-1/3 ${pulse}`} />
            <div className={`h-64 w-full ${pulse}`} />
          </div>
        );
      default:
        return null;
    }
  };

  return <>{Array.from({ length: count }).map((_, index) => <div key={index}>{renderSkeleton()}</div>)}</>;
}
