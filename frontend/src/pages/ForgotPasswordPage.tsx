import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore.ts';
import { AuthErrorMessage } from '../components/AuthErrorMessage.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { staggerContainer, staggerItem } from '../lib/motion.ts';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-md text-center space-y-4"
        >
          <motion.h2 variants={staggerItem} className="text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">
            Email sent
          </motion.h2>
          <motion.p variants={staggerItem} className="text-[15px] text-[var(--text-secondary)]">
            If an account exists for{' '}
            <strong className="text-[var(--text-primary)] font-semibold">{email}</strong>,
            you will receive a password reset link.
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
            Reset Password
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-2">
            Enter your email and we&apos;ll send a reset link
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

            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </motion.div>

        <motion.p variants={staggerItem} className="text-center text-[13px] text-[var(--text-tertiary)]">
          <Link
            to="/login"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          >
            Back to login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
