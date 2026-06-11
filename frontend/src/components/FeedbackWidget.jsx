import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createFeedback } from '../services/api';
import { useUserAuth } from '../context/AuthContext';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contactInfo: '', rating: 5, message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = isAuthenticated
        ? { rating: formData.rating, message: formData.message }
        : formData;
      await createFeedback(payload);
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({ name: '', contactInfo: '', rating: 5, message: '' });
      }, 3000);
    } catch (err) {
      console.error('Feedback failed:', err);
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormInvalid = !formData.message.trim();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-amber-400 text-bg p-3.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center border border-white/20"
        title="Leave Feedback"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-6 w-80 bg-surface border border-white/15 rounded-2xl shadow-card z-50 overflow-hidden"
          >
            <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
              <h3 className="font-display font-bold text-text text-base">Send Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-textMuted hover:text-text p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-6 text-primary">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-base">Thank you!</p>
                  <p className="text-xs text-textMuted mt-1">Your feedback helps us improve.</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-md">
                    <span>💬</span>
                  </div>
                  <h4 className="font-bold text-text text-sm mb-2">Login and give Feedback</h4>
                  <p className="text-textMuted text-xs mb-5 leading-relaxed font-semibold">
                    You must be logged in to submit feedback and rate your experience.
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login');
                    }}
                    className="w-full btn-primary py-2.5 text-xs justify-center !min-h-[42px] font-black uppercase tracking-wider"
                  >
                    Login to Continue
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-xs text-textMuted mb-3 leading-relaxed font-semibold">
                    Have a suggestion or found a bug? Let us know!
                  </p>
                  
                  {error && (
                    <div className="bg-danger/10 border border-danger/20 text-danger text-xs font-semibold rounded-lg p-2.5 mb-3 leading-snug">
                      {error}
                    </div>
                  )}

                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 mb-3.5 text-xs">
                    <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-1">Logged in as</p>
                    <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
                    <p className="text-xs text-textMuted mt-0.5">{user?.email}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-3.5 px-0.5">
                    <span className="text-xs font-bold text-textMuted">Rating:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xl transition-all ${
                            formData.rating >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/20 hover:text-white/50'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your experience... *"
                    className="w-full h-24 bg-bg border border-white/10 rounded-lg p-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-primary resize-none mb-4 font-semibold"
                    required
                  ></textarea>

                  <button
                    type="submit"
                    className="w-full btn-primary py-2 text-sm justify-center !min-h-[42px]"
                    disabled={isFormInvalid || submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
