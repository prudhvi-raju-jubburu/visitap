import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, login } = useUserAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/profile" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 noise-overlay relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img 
                src="/logo.png" 
                alt="Visit AP" 
                className="h-20 md:h-24 w-auto object-contain mx-auto mb-4 transition-transform hover:scale-105 duration-300" 
              />
            </Link>
            <h1 className="font-display text-2xl font-bold text-text">Welcome Back</h1>
            <p className="text-textMuted text-sm mt-1">Sign in to explore and plan your trip</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-6 text-danger text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-textMuted text-sm font-medium block mb-2">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-textMuted text-sm font-medium block mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-2 py-3"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin"></div>Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-textMuted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
