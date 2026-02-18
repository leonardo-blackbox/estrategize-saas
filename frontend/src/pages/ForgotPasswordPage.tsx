import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { AuthErrorMessage } from '../components/AuthErrorMessage.tsx';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Email sent</h2>
          <p className="text-slate-400">
            If an account exists for <strong className="text-white">{email}</strong>,
            you will receive a password reset link.
          </p>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-2">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthErrorMessage />

          <div>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
