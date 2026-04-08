import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginAdmin } from '../services/api';
import { useAuth } from '../App';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { admin, login } = useAuth();
  const navigate = useNavigate();

  if (admin) return <Navigate to="/admin/portal" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(form);
      login(res.data.admin, res.data.token);
      navigate('/admin/portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 noise-overlay">
      <div className="absolute inset-0 bg-amber-glow pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center mx-auto mb-4 shadow-amber">
              <span className="text-bg font-display font-black text-2xl">V</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-text">Staff Portal</h1>
            <p className="text-textMuted text-sm mt-1">Sign in to manage tourism data</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-6 text-danger text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-textMuted text-sm font-medium block mb-2">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                required
                className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-textMuted text-sm font-medium block mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
                required
                className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
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

          <div className="mt-4 p-3 bg-secondary rounded-xl text-center">
            <p className="text-textMuted text-xs font-mono mt- 1">For Registration contact Admin</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
