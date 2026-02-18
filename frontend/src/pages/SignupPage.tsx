import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { AuthErrorMessage } from '../components/AuthErrorMessage.tsx';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="text-slate-400">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
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
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Start using Iris Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthErrorMessage />

          <div>
            <label htmlFor="fullName" className="block text-sm text-slate-300 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
