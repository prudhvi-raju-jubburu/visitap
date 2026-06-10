import { useState, useEffect } from 'react';
import { useUserAuth } from '../context/AuthContext';
import { updateUserProfile, changeUserPassword, getUserReviews } from '../services/api';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, setUser, logout } = useUserAuth();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await getUserReviews();
        setReviewCount(res.data.reviews?.length || 0);
      } catch (err) {
        console.error('Failed to load user reviews count', err);
      }
    };
    fetchReviews();
  }, []);

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password fields state
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setProfileLoading(true);
    try {
      const res = await updateUserProfile(profileForm);
      const updatedUser = res.data.user || res.data.data;
      setUser(updatedUser);
      localStorage.setItem('visitap_user', JSON.stringify(updatedUser));
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassMsg({ text: '', type: '' });

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (passForm.newPassword.length < 8) {
      setPassMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    setPassLoading(true);
    try {
      await changeUserPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassMsg({ text: 'Password updated successfully!', type: 'success' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="min-h-screen bg-bg pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-bg font-display font-black text-2xl uppercase shadow-lg">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-text">{user?.name}</h1>
              <p className="text-textMuted text-sm">{user?.email}</p>
              <p className="text-primary text-[10px] font-black uppercase tracking-wider mt-1">Joined {formattedDate}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 border border-danger/20 hover:bg-danger/10 text-danger text-sm font-semibold rounded-xl transition-all"
          >
            Logout Session
          </button>
        </motion.div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Favorite Places', value: user?.favorites?.length || 0, icon: '⭐' },
            { label: 'Reviews Posted', value: reviewCount, icon: '💬' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 border-white/5 relative overflow-hidden">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-textMuted text-sm font-medium mt-1">{stat.label}</p>
              {stat.badge && (
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  {stat.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Edit forms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Edit Profile Form */}
          <div className="glass-card p-6 border-white/10">
            <h3 className="font-display text-lg font-bold text-text mb-4">Edit Profile</h3>
            
            {profileMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 text-center border ${
                profileMsg.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-success/10 border-success/20 text-success'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="text-textMuted text-xs font-medium block mb-1">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full bg-surfaceLight border border-white/5 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-textMuted text-xs font-medium block mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full bg-surfaceLight border border-white/5 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {profileLoading ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-card p-6 border-white/10">
            <h3 className="font-display text-lg font-bold text-text mb-4">Change Password</h3>
            
            {passMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 text-center border ${
                passMsg.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-success/10 border-success/20 text-success'
              }`}>
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-textMuted text-xs font-medium block mb-1">Current Password</label>
                <input
                  type="password"
                  value={passForm.currentPassword}
                  onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surfaceLight border border-white/5 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-textMuted text-xs font-medium block mb-1">New Password</label>
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                  required
                  placeholder="Min 8 characters"
                  className="w-full bg-surfaceLight border border-white/5 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-textMuted text-xs font-medium block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surfaceLight border border-white/5 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
