import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserReviews, updateReview, deleteReview } from '../services/api';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';
import PageLoader from '../components/PageLoader';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Editing modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', rating: 5, comment: '', placeName: '' });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await getUserReviews();
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    // Optimistic UI update
    const previousReviews = [...reviews];
    setReviews(curr => curr.filter(item => item._id !== reviewId));
    setMessage('Review deleted successfully');
    setTimeout(() => setMessage(''), 3000);

    try {
      await deleteReview(reviewId);
    } catch (err) {
      setReviews(previousReviews);
      setError(err.response?.data?.message || 'Failed to delete review.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditModal = (review) => {
    setEditForm({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      placeName: review.place?.name || 'Tourist Place',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setError('');

    try {
      await updateReview(editForm.id, {
        rating: editForm.rating,
        comment: editForm.comment,
      });

      setMessage('Review updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setIsEditModalOpen(false);
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg pt-28 pb-20 relative">
      {/* Toast Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-success/90 text-white border border-success/20"
          >
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-danger/90 text-white border border-danger/20"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-text uppercase">My Reviews</h1>
          <p className="text-textMuted mt-2 text-sm">Manage the ratings and comments you shared on Visit AP</p>
        </div>

        {reviews.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-xl mx-auto p-10 text-center border-white/5 mt-12"
          >
            <div className="text-6xl mb-6">💬</div>
            <h2 className="text-2xl font-bold text-text mb-3">No reviews shared yet.</h2>
            <p className="text-textMuted text-sm mb-8 leading-relaxed">
              Explore places and leave a review to share your experience with other travelers!
            </p>
            <Link to="/districts" className="btn-primary inline-block">
              Explore Andhra Pradesh
            </Link>
          </motion.div>
        ) : (
          /* Reviews List */
          <div className="space-y-6">
            {reviews.map((review, index) => {
              const place = review.place || {};
              const reviewDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A';

              return (
                <motion.div
                  layout
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row gap-6 items-start"
                >
                  {/* Left: Place details */}
                  <div className="w-full md:w-48 shrink-0 relative rounded-2xl overflow-hidden h-32 bg-surfaceLight">
                    <img
                      src={transformCloudinaryUrl(place.coverImage || DEFAULT_IMAGE)}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                      <span className="text-[9px] uppercase tracking-wider font-black text-primary mb-0.5">
                        {place.category}
                      </span>
                      <h4 className="font-bold text-sm text-white line-clamp-1">
                        {place.name}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Review details */}
                  <div className="flex-1 w-full flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-base ${
                                star <= review.rating ? 'text-primary' : 'text-white/10'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-textMuted font-medium">Reviewed on {reviewDate}</span>
                      </div>
                      <p className="text-textMuted text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    </div>

                    <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
                      {place.slug && (
                        <Link
                          to={`/place/${place.slug}`}
                          className="text-xs text-text hover:text-primary font-bold transition-colors"
                        >
                          View Place
                        </Link>
                      )}
                      <button
                        onClick={() => openEditModal(review)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Edit Review
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-xs text-danger font-bold hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg p-6 md:p-8 border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 text-textMuted hover:text-text text-xl"
              >
                ✕
              </button>

              <h3 className="font-display text-xl font-bold text-text mb-1">Edit Review</h3>
              <p className="text-xs text-textMuted mb-6">Updating your feedback for <span className="text-primary font-bold">{editForm.placeName}</span></p>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-textMuted tracking-wider block mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, rating: star }))}
                        className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        <span className={star <= editForm.rating ? 'text-primary' : 'text-white/10'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-textMuted tracking-wider block mb-2">Comment</label>
                  <textarea
                    rows={4}
                    value={editForm.comment}
                    onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                    maxLength={1000}
                    required
                    className="w-full bg-surfaceLight border border-white/5 rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                  <div className="text-right text-[10px] text-textMuted mt-1">
                    {editForm.comment.length} / 1000 characters
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="btn-primary py-2.5 px-6 text-sm flex-1"
                  >
                    {submittingEdit ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex-1 text-sm text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
