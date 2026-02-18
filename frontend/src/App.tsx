import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.ts';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { DashboardLayout } from './components/layout/DashboardLayout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ConsultanciesPage } from './pages/ConsultanciesPage.tsx';
import { PlansPage } from './pages/PlansPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes with dashboard layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/consultancies" element={<ConsultanciesPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
