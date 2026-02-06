import { TransactionForm } from '../components';
import { BudgetProvider, ThemeProvider } from '../contexts';

/**
 * Demo page for TransactionForm component
 * Shows the form in action with context providers
 */
export function TransactionFormDemo() {
  const handleSuccess = () => {
    console.log('Transaction added successfully!');
    alert('Transaction added successfully!');
  };

  return (
    <ThemeProvider>
      <BudgetProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Add Transaction
              </h1>
              <TransactionForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      </BudgetProvider>
    </ThemeProvider>
  );
}
