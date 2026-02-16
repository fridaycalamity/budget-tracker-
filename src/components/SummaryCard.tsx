import { formatCurrency } from '../utils';

interface SummaryCardProps {
  title: string;
  amount: number;
  color: 'green' | 'red' | 'blue';
}

/**
 * SummaryCard component
 * Displays a financial summary with title, formatted amount, and color styling
 * Responsive design for mobile and desktop
 */
export function SummaryCard({ title, amount, color }: SummaryCardProps) {
  // Color classes based on type
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const textColorClasses = {
    green: 'text-green-700 dark:text-green-400',
    red: 'text-red-700 dark:text-red-400',
    blue: 'text-blue-700 dark:text-blue-400',
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-lg border-2 ${colorClasses[color]} transition-all duration-200 hover:shadow-md`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className={`text-2xl sm:text-3xl font-bold ${textColorClasses[color]} break-all`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
