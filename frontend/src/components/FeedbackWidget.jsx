import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFeedback } from '../services/api';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contactInfo: '', rating: 5, message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFeedback(formData);
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({ name: '', contactInfo: '', rating: 5, message: '' });
      }, 3000);
    } catch (err) {
      console.error('Feedback failed:', err);
      alert('Failed to send feedback');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-bg p-3 rounded-full shadow-amber hover:scale-110 transition-transform z-50 flex items-center gap-2"
        title="Leave Feedback"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-6 w-80 bg-surface border border-white/10 rounded-2xl shadow-card z-50 overflow-hidden"
          >
            <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
              <h3 className="font-display font-bold text-text">Send Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-textMuted hover:text-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-6 text-primary">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold">Thank you!</p>
                  <p className="text-sm text-textMuted mt-1">Your feedback helps us improve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-sm text-textMuted mb-3">
                    Have a suggestion or found a bug? Let us know!
                  </p>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name *"
                    className="w-full bg-bg border border-white/10 rounded-lg p-2 text-sm text-text placeholder-textMuted focus:outline-none focus:border-primary mb-3"
                    required
                  />
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="Email or Mobile Number *"
                    className="w-full bg-bg border border-white/10 rounded-lg p-2 text-sm text-text placeholder-textMuted focus:outline-none focus:border-primary mb-3"
                    required
                  />
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-textMuted">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`w-6 h-6 rounded flex items-center justify-center text-lg transition-all ${
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
                    className="w-full h-24 bg-bg border border-white/10 rounded-lg p-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-primary resize-none mb-4"
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="w-full btn-primary py-2 text-sm justify-center"
                    disabled={!formData.name || !formData.contactInfo || !formData.message}
                  >
                    Submit Feedback
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
