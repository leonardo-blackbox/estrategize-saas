import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore.ts';
import { AuthErrorMessage } from '../components/AuthErrorMessage.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { staggerContainer, staggerItem } from '../lib/motion.ts';

export function LoginPage() {
  const { user, loading, signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md space-y-8"
      >
        <motion.div variants={staggerItem} className="text-center">
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            Iris Platform
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-2">
            Sign in to your account
          </p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)]"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthErrorMessage />

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
              placeholder="••••••••"
            />

            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </motion.div>

        <motion.div variants={staggerItem} className="text-center text-[13px] text-[var(--text-tertiary)] space-y-2">
          <p>
            <Link
              to="/forgot-password"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
