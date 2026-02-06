/**
 * SkeletonLoader component
 * Displays a placeholder loading animation for content
 */
interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'transaction' | 'chart';
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  variant = 'text',
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
        );

      case 'card':
        return (
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-3 ${className}`}
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        );

      case 'transaction':
        return (
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2 ${className}`}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
            </div>
          </div>
        );

      case 'chart':
        return (
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3 mb-4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
