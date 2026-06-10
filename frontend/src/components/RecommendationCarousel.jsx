import React from 'react';

export default function RecommendationCarousel({ recommendations = [], onAddPlace, loading = false }) {
  if (loading) {
    return (
      <div className="w-full mt-6">
        <h4 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>✨</span> You May Also Like
        </h4>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scroll">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-60 h-32 bg-surfaceLight/15 border border-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="w-full mt-6 bg-surface/20 border border-white/5 rounded-3xl p-5 shadow-lg">
      <h4 className="font-display text-sm font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>✨</span> You May Also Like
      </h4>
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scroll">
        {recommendations.map((place) => (
          <div
            key={place._id}
            className="flex-shrink-0 w-64 bg-surfaceLight/30 border border-white/5 hover:border-primary/20 rounded-2xl p-3 flex flex-col justify-between shadow-md group transition-all"
          >
            <div className="flex gap-3 items-start">
              <img
                src={place.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                alt={place.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div className="overflow-hidden">
                <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold uppercase">
                  {place.category}
                </span>
                <h5 className="font-display font-bold text-text mt-1 text-xs truncate group-hover:text-primary transition-colors">
                  {place.name}
                </h5>
                <p className="text-[10px] text-textMuted truncate">{place.districtName}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] text-amber-400 font-bold">
                {place.rating?.average ? `${place.rating.average} ★` : 'No rating'}
              </span>
              <button
                onClick={() => onAddPlace(place)}
                className="px-2.5 py-1 rounded-lg bg-primary text-bg text-[10px] font-black hover:bg-amber-400 active:scale-95 transition-all shadow-md"
              >
                + Add to Trip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
