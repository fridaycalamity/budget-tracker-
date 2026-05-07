import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  BudgetProvider,
  ToastProvider,
  CategoryProvider,
  AuthProvider,
  useAuth,
} from './contexts';
import { Header, AddTransactionButton, ToastContainer, InstallPWA, OfflineBanner, SplashScreen } from './components';
import { Dashboard, TransactionList, BudgetGoals, Settings, Subscriptions, Auth } from './pages';
import { DataMigrationBanner } from './components/DataMigrationBanner';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen subtitle="Loading Ledger" />;
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
            <div className="app-shell overflow-x-hidden">
              <Header />
              <main className="app-main px-3 pb-28 pt-20 sm:px-4 lg:ml-[260px] lg:px-6 lg:pb-8 lg:pt-6 xl:px-8">
                <div className="mx-auto max-w-7xl space-y-4">
                  <OfflineBanner />
                  <DataMigrationBanner />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<TransactionList />} />
                    <Route path="/budget-goals" element={<BudgetGoals />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </div>
              </main>
              <AddTransactionButton />
              <ToastContainer />
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
