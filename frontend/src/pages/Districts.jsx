import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackClientEvent } from '../services/api';
import DistrictCard from '../components/DistrictCard';
import { DistrictCardSkeleton } from '../components/SkeletonLoader';
import { loadSearchIndex, findBestMatch } from '../utils/searchUtils';

export default function Districts() {
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { districts: dData, places: pData } = await loadSearchIndex();
        setDistricts(dData);
        setPlaces(pData);
        setError(null);
      } catch (err) {
        setError('Failed to load districts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sync search query and category from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const categoryParam = params.get('category');
    
    if (searchParam) {
      setSearch(searchParam);
    } else {
      setSearch('');
    }
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }
  }, [location.search]);

  // Debounced analytics tracking for typing searches
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      trackClientEvent('SEARCH', { metadata: { searchQuery: search } });
      
      const hasAnyResults = districts.some(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
      );
      if (!hasAnyResults) {
        trackClientEvent('SEARCH_NO_RESULT', { metadata: { searchQuery: search } });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [search, districts]);

  // Voice Search Trigger
  const handleVoiceSearch = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice Recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      trackClientEvent('voice_search_start', { context: 'districts_page' });
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      trackClientEvent('voice_search_success', { query: transcript, context: 'districts_page' });
      
      // Use standard findBestMatch logic for voice searches
      const match = findBestMatch(transcript, districts, places);
      if (match) {
        if (match.type === 'district') {
          setSearch(match.name);
        } else if (match.type === 'place') {
          // Navigate directly to place details
          navigate(`/place/${match.slug || match.id}`);
        } else if (match.type === 'category') {
          // Set query category param
          navigate(`/districts?category=${match.name}`);
        }
      } else {
        // Fallback to typing search text
        setSearch(transcript);
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error', e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const filtered = districts.filter(d => {
    const matchesSearch = search ? d.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesCategory = selectedCategory
      ? places.some(p => p.districtName === d.name && p.category.toLowerCase() === selectedCategory.toLowerCase())
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider">Andhra Pradesh</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-text mt-2 mb-4">
              Explore Districts
            </h1>
            <p className="text-textMuted text-lg max-w-2xl mx-auto">
              Discover the beautiful districts of Andhra Pradesh, each with its own unique culture, landmarks, and natural beauty.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-md mx-auto mt-8 flex items-center"
          >
            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Search districts..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 bg-surface border border-white/10 rounded-2xl pl-12 pr-14 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-1 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isListening ? 'bg-primary/20 text-primary animate-pulse' : 'text-textMuted hover:text-primary hover:bg-white/5'
              }`}
              title="Voice Search"
              aria-label="Voice Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </motion.div>

          {/* Active Category Filter chip */}
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-primary/20 border border-primary/45 rounded-full px-4.5 py-2 mt-5 text-primary text-sm font-semibold"
            >
              <span>🏷️ Category: {selectedCategory}</span>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  params.delete('category');
                  navigate(`/districts${params.toString() ? '?' + params.toString() : ''}`);
                }}
                className="w-5 h-5 rounded-full bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center font-bold text-xs transition-colors"
                title="Clear Category Filter"
                aria-label="Clear Category Filter"
              >
                ✕
              </button>
            </motion.div>
          )}
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-16">
            <p className="text-danger mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <DistrictCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-textMuted text-sm mb-6">{filtered.length} district{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((d, i) => <DistrictCard key={d._id} district={d} index={i} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-xl font-bold text-text mb-2">No Districts Found</h3>
            <p className="text-textMuted">No districts match "{search}"</p>
            <button onClick={() => setSearch('')} className="mt-4 text-primary hover:underline text-sm">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
