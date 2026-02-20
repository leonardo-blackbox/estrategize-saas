import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.ts';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

// Theme store import — side-effect: applies data-theme on <html> at module load
import './stores/themeStore.ts';

// Legacy layout (kept for zero-breakage migration)
import { DashboardLayout } from './components/layout/DashboardLayout.tsx';

// New layouts
import { MemberShell } from './components/layout/MemberShell.tsx';
import { AdminShell } from './components/layout/AdminShell.tsx';

// Public pages
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';

// Legacy pages (still accessible)
import { ConsultanciesPage } from './pages/ConsultanciesPage.tsx';
import { PlansPage } from './pages/PlansPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { CreditsPage } from './pages/CreditsPage.tsx';

// New member pages
import { FormacaoPage } from './pages/member/FormacaoPage.tsx';
import { FerramentasPage } from './pages/member/FerramentasPage.tsx';
import { ConsultoriasPage } from './pages/member/ConsultoriasPage.tsx';
import { ConsultoriaDetailPage } from './pages/member/ConsultoriaDetailPage.tsx';
import { ContaPage } from './pages/member/ContaPage.tsx';
import { CreditosPage } from './pages/member/CreditosPage.tsx';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminOfertasPage } from './pages/admin/AdminOfertasPage.tsx';
import { AdminNovaOfertaPage } from './pages/admin/AdminNovaOfertaPage.tsx';
import { AdminTurmasPage } from './pages/admin/AdminTurmasPage.tsx';
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage.tsx';
import { AdminStripePage } from './pages/admin/AdminStripePage.tsx';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ── Member App (new UI) ── */}
        <Route
          element={
            <ProtectedRoute>
              <MemberShell />
            </ProtectedRoute>
          }
        >
          <Route path="/formacao" element={<FormacaoPage />} />
          <Route path="/ferramentas" element={<FerramentasPage />} />
          <Route path="/consultorias" element={<ConsultoriasPage />} />
          <Route path="/consultorias/:id" element={<ConsultoriaDetailPage />} />
          <Route path="/conta" element={<ContaPage />} />
          <Route path="/creditos" element={<CreditosPage />} />
        </Route>

        {/* ── Admin App ── */}
        <Route
          element={
            <ProtectedRoute>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/ofertas" element={<AdminOfertasPage />} />
          <Route path="/admin/ofertas/nova" element={<AdminNovaOfertaPage />} />
          <Route path="/admin/turmas" element={<AdminTurmasPage />} />
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="/admin/stripe" element={<AdminStripePage />} />
        </Route>

        {/* ── Legacy routes (preserved, using old DashboardLayout) ── */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Navigate to="/formacao" replace />} />
          <Route path="/consultancies" element={<ConsultanciesPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* ── Catch-all redirect ── */}
        <Route path="*" element={<Navigate to="/formacao" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
