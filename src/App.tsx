import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, BudgetProvider, ToastProvider } from './contexts';
import { Header, AddTransactionButton, ToastContainer } from './components';
import { Dashboard, TransactionList, BudgetGoals, Settings } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <BudgetProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<TransactionList />} />
                  <Route path="/budget-goals" element={<BudgetGoals />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
              {/* Floating Action Button for adding transactions */}
              <AddTransactionButton />
              {/* Toast notifications */}
              <ToastContainer />
            </div>
          </BudgetProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
