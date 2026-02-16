import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  BudgetProvider,
  ToastProvider,
  CategoryProvider,
  AuthProvider,
  useAuth,
} from './contexts';
import { Header, AddTransactionButton, ToastContainer, InstallPWA, OfflineBanner } from './components';
import { Dashboard, TransactionList, BudgetGoals, Settings, Auth } from './pages';
import { DataMigrationBanner } from './components/DataMigrationBanner';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
              <OfflineBanner />
              <Header />
              <DataMigrationBanner />
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
              {/* PWA install prompt */}
              <InstallPWA />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <CategoryProvider>
              <BudgetProvider>
                <AppRoutes />
              </BudgetProvider>
            </CategoryProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
