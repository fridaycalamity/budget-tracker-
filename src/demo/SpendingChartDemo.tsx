import { SpendingChart } from '../components';
import { BudgetProvider } from '../contexts';
import { ThemeProvider } from '../contexts';
import { storageService } from '../utils';

/**
 * SpendingChartDemo component
 * Demonstrates the SpendingChart component with sample data
 */
export function SpendingChartDemo() {
  // Set up sample data for demonstration
  const setupSampleData = () => {
    const sampleTransactions = [
      {
        id: '1',
        description: 'Groceries at SM',
        amount: 2500,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Restaurant dinner',
        amount: 1200,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
      {
        id: '3',
        description: 'Jeepney and MRT',
        amount: 500,
        type: 'expense' as const,
        category: 'Transport' as const,
        date: '2024-01-17',
        createdAt: '2024-01-17T10:00:00Z',
      },
      {
        id: '4',
        description: 'Grab ride',
        amount: 350,
        type: 'expense' as const,
        category: 'Transport' as const,
        date: '2024-01-18',
        createdAt: '2024-01-18T10:00:00Z',
      },
      {
        id: '5',
        description: 'Electricity bill',
        amount: 3500,
        type: 'expense' as const,
        category: 'Bills' as const,
        date: '2024-01-19',
        createdAt: '2024-01-19T10:00:00Z',
      },
      {
        id: '6',
        description: 'Internet bill',
        amount: 1699,
        type: 'expense' as const,
        category: 'Bills' as const,
        date: '2024-01-20',
        createdAt: '2024-01-20T10:00:00Z',
      },
      {
        id: '7',
        description: 'Movie tickets',
        amount: 800,
        type: 'expense' as const,
        category: 'Entertainment' as const,
        date: '2024-01-21',
        createdAt: '2024-01-21T10:00:00Z',
      },
      {
        id: '8',
        description: 'New shoes',
        amount: 2500,
        type: 'expense' as const,
        category: 'Shopping' as const,
        date: '2024-01-22',
        createdAt: '2024-01-22T10:00:00Z',
      },
      {
        id: '9',
        description: 'Doctor checkup',
        amount: 1500,
        type: 'expense' as const,
        category: 'Healthcare' as const,
        date: '2024-01-23',
        createdAt: '2024-01-23T10:00:00Z',
      },
      {
        id: '10',
        description: 'Online course',
        amount: 2000,
        type: 'expense' as const,
        category: 'Education' as const,
        date: '2024-01-24',
        createdAt: '2024-01-24T10:00:00Z',
      },
      {
        id: '11',
        description: 'Monthly salary',
        amount: 50000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
      },
    ];

    storageService.saveTransactions(sampleTransactions);
  };

  const clearData = () => {
    storageService.clearAll();
    window.location.reload();
  };

  return (
    <ThemeProvider>
      <BudgetProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                SpendingChart Component Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This demo showcases the SpendingChart component with sample expense data.
                The chart displays expenses by category using a doughnut chart.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={setupSampleData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load Sample Data
                </button>
                <button
                  onClick={clearData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Chart with Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Click "Load Sample Data" to see the chart with expense data across multiple categories.
                </p>
                <SpendingChart />
              </section>

              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Displays expenses by category using a doughnut chart</li>
                  <li>Uses distinct colors for each category</li>
                  <li>Shows category labels with formatted amounts in Philippine Peso</li>
                  <li>Displays percentage of total expenses in tooltips</li>
                  <li>Responsive design that works on all screen sizes</li>
                  <li>Handles empty data state with a friendly message</li>
                  <li>Supports dark mode with appropriate color adjustments</li>
                  <li>Only shows categories with expenses (filters out zero amounts)</li>
                  <li>Aggregates multiple expenses in the same category</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </BudgetProvider>
    </ThemeProvider>
  );
}

export default SpendingChartDemo;
