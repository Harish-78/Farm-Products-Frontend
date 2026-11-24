import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards';

import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';
import QuailsPage from '@/pages/QuailsPage';
import FeedsPage from '@/pages/FeedsPage';
import ExpensesPage from '@/pages/ExpensesPage';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="poongodi-farm-products-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Authenticated Admin only routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/quails" element={<QuailsPage />} />
              <Route path="/feeds" element={<FeedsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            {/* Unauthenticated / Guest only */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
