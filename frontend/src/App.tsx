import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore.ts';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AdminRoute } from './components/AdminRoute.tsx';

// Theme store import — side-effect: applies data-theme on <html> at module load
import './stores/themeStore.ts';

// New layouts
import { MemberShell } from './components/layout/MemberShell.tsx';
import { AdminShell } from './components/layout/AdminShell.tsx';

// Public pages
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';

// New member pages
import { FormacaoPage } from './pages/member/FormacaoPage.tsx';
import { FerramentasPage } from './pages/member/FerramentasPage.tsx';
import { ConsultoriasPage } from './pages/member/ConsultoriasPage.tsx';
import { ConsultoriaDetailPage } from './pages/member/ConsultoriaDetailPage.tsx';
import { ContaPage } from './pages/member/ContaPage.tsx';
import { CreditosPage } from './pages/member/CreditosPage.tsx';
import { CoursePage } from './pages/member/CoursePage.tsx';
import { LessonPage } from './pages/member/LessonPage.tsx';

// Aplicações pages
import AplicacoesPage from './pages/member/aplicacoes/AplicacoesPage.tsx';
import { ApplicationShell } from './pages/member/aplicacoes/ApplicationShell.tsx';
import { EditorPage } from './pages/member/aplicacoes/EditorPage.tsx';
import RespostasPage from './pages/member/aplicacoes/RespostasPage.tsx';
import CompartilharPage from './pages/member/aplicacoes/CompartilharPage.tsx';
import OpcoesPage from './pages/member/aplicacoes/OpcoesPage.tsx';
import IntegracaoPage from './pages/member/aplicacoes/IntegracaoPage.tsx';
import AnalyticsPage from './pages/member/aplicacoes/AnalyticsPage.tsx';
import FormPublicoPage from './pages/public/FormPublicoPage.tsx';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminOfertasPage } from './pages/admin/AdminOfertasPage.tsx';
import { AdminNovaOfertaPage } from './pages/admin/AdminNovaOfertaPage.tsx';
import { AdminTurmasPage } from './pages/admin/AdminTurmasPage.tsx';
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage.tsx';
import { AdminStripePage } from './pages/admin/AdminStripePage.tsx';
import { AdminCursosPage } from './pages/admin/AdminCursosPage.tsx';
import { AdminCursoDetailPage } from './pages/admin/AdminCursoDetailPage.tsx';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage.tsx';
import { AdminFormacaoPage } from './pages/admin/AdminFormacaoPage.tsx';
import { AdminHomePage } from './pages/admin/AdminHomePage.tsx';

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
        <Route path="/f/:slug" element={<FormPublicoPage />} />

        {/* ── Member App (new UI) ── */}
        <Route
          element={
            <ProtectedRoute>
              <MemberShell />
            </ProtectedRoute>
          }
        >
          <Route path="/formacao" element={<FormacaoPage />} />
          <Route path="/formacao/curso/:id" element={<CoursePage />} />
          <Route path="/formacao/aula/:lessonId" element={<LessonPage />} />
          <Route path="/ferramentas" element={<FerramentasPage />} />
          <Route path="/aplicacoes" element={<AplicacoesPage />} />
          <Route path="/consultorias" element={<ConsultoriasPage />} />
          <Route path="/consultorias/:id" element={<ConsultoriaDetailPage />} />
          <Route path="/conta" element={<ContaPage />} />
          <Route path="/creditos" element={<CreditosPage />} />
        </Route>

        {/* ── Application Shell (full-viewport, sem MemberShell) ── */}
        <Route
          path="/aplicacoes/:id"
          element={
            <ProtectedRoute>
              <ApplicationShell />
            </ProtectedRoute>
          }
        >
          <Route path="editor" element={<EditorPage />} />
          <Route path="opcoes" element={<OpcoesPage />} />
          <Route path="compartilhar" element={<CompartilharPage />} />
          <Route path="integracoes" element={<IntegracaoPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="respostas" element={<RespostasPage />} />
          <Route index element={<Navigate to="respostas" replace />} />
        </Route>

        {/* ── Admin App ── */}
        <Route
          element={
            <AdminRoute>
              <AdminShell />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/cursos" element={<AdminCursosPage />} />
          <Route path="/admin/cursos/:id" element={<AdminCursoDetailPage />} />
          <Route path="/admin/ofertas" element={<AdminOfertasPage />} />
          <Route path="/admin/ofertas/nova" element={<AdminNovaOfertaPage />} />
          <Route path="/admin/turmas" element={<AdminTurmasPage />} />
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="/admin/usuarios/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/stripe" element={<AdminStripePage />} />
          <Route path="/admin/formacao" element={<AdminFormacaoPage />} />
          <Route path="/admin/home" element={<AdminHomePage />} />
        </Route>

        {/* ── Catch-all redirect ── */}
        <Route path="*" element={<Navigate to="/formacao" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
