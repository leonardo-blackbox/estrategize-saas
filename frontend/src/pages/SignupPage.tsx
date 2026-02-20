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
            Check your email
          </motion.h2>
          <motion.p variants={staggerItem} className="text-[15px] text-[var(--text-secondary)]">
            We sent a confirmation link to{' '}
            <strong className="text-[var(--text-primary)] font-semibold">{email}</strong>.
          </motion.p>
          <motion.div variants={staggerItem}>
            <Link
              to="/login"
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Back to login
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
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            Create Account
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-2">
            Start using Iris Platform
          </p>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)]"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthErrorMessage />

            <Input
              label="Full Name"
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
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
              placeholder="Minimum 6 characters"
            />

            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
            >
              {submitting ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </motion.div>

        <motion.p variants={staggerItem} className="text-center text-[13px] text-[var(--text-tertiary)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          >
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
