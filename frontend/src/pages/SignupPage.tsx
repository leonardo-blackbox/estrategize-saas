import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore.ts';
import { AuthErrorMessage } from '../components/AuthErrorMessage.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { staggerContainer, staggerItem } from '../lib/motion.ts';

export function SignupPage() {
  const { user, loading, signUp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[15px] text-[var(--text-secondary)] animate-pulse">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-md text-center space-y-4"
        >
          <motion.h2 variants={staggerItem} className="text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">
            Verifique seu email
          </motion.h2>
          <motion.p variants={staggerItem} className="text-[15px] text-[var(--text-secondary)]">
            Enviamos um link de confirmação para{' '}
            <strong className="text-[var(--text-primary)] font-semibold">{email}</strong>.
          </motion.p>
          <motion.div variants={staggerItem}>
            <Link
              to="/login"
              className="text-[13px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
            >
              Voltar ao login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md space-y-8"
      >
        <motion.div variants={staggerItem} className="text-center">
          <div className="mx-auto h-16 w-16 rounded-[var(--radius-lg)] bg-[var(--accent)] flex items-center justify-center mb-5">
            <span className="text-2xl font-bold text-[var(--accent-text)]">E</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            Criar Conta
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-2">
            Comece a usar o Estrategize
          </p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)]"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthErrorMessage />

            <Input
              label="Nome completo"
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />

            <Input
              label="Email"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />

            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
            >
              {submitting ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
        </motion.div>

        <motion.p variants={staggerItem} className="text-center text-[13px] text-[var(--text-tertiary)]">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
          >
            Entrar
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
