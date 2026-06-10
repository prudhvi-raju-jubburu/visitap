import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackClientEvent } from '../services/api';

export default function TripShareModal({ isOpen, onClose, tripId, shareId, isPublic, onTogglePublic }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/shared/${shareId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackClientEvent('SHARE_TRIP', { metadata: { tripId } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = () => {
    trackClientEvent('SHARE_TRIP', { metadata: { tripId } });
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out my trip plan on Visit AP: ${shareUrl}`
  )}`;

  const emailUrl = `mailto:?subject=${encodeURIComponent(
    'My Travel Itinerary'
  )}&body=${encodeURIComponent(`Hey! Here is my travel itinerary for Andhra Pradesh: ${shareUrl}`)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Background Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-bg/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface/95 border border-white/10 rounded-[2.5rem] w-full max-w-md p-6 relative z-10 shadow-card overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-xl font-bold text-text">Share Trip Itinerary</h3>
              <p className="text-textMuted text-xs mt-1">Configure sharing options for your trip plan</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 text-textMuted hover:text-text transition-all"
            >
              ❌
            </button>
          </div>

          {/* Public Toggle Switch */}
          <div className="bg-surfaceLight/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-bold text-text">Make Trip Public</p>
              <p className="text-[10px] text-textMuted mt-0.5">Allow anyone with the link to view your itinerary</p>
            </div>
            <button
              onClick={() => onTogglePublic(!isPublic)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                isPublic ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-bg shadow-md transform transition-transform duration-300 ${
                  isPublic ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isPublic ? (
            <div className="flex flex-col gap-6">
              {/* Share URL copy bar */}
              <div>
                <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Shareable Link</p>
                <div className="flex items-center bg-surfaceLight/30 border border-white/10 rounded-xl overflow-hidden p-1 shadow-inner">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-text focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                      copied ? 'bg-emerald-500 text-bg' : 'bg-primary text-bg hover:bg-amber-400'
                    }`}
                  >
                    {copied ? 'Copied! ✓' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Share Channels */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleShareClick}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all text-center"
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href={emailUrl}
                  onClick={handleShareClick}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all text-center"
                >
                  <span>✉️</span> Email
                </a>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Scan to view online</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-28 h-28 border border-white/10 p-2 bg-white rounded-xl shadow-md"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-textMuted text-sm">
              <span className="text-3xl block mb-2">🔒</span>
              Your trip plan is currently set to private. Enable public sharing above to generate shared links and QR codes.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
