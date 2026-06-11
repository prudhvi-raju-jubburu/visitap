import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackClientEvent } from '../services/api';
import { useUserAuth } from '../context/AuthContext';
import { loadSearchIndex, findBestMatch, getSuggestions } from '../utils/searchUtils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ districts: [], places: [] });
  const [searching, setSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Voice Search Visual Feedback States
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'heard' | 'searching' | 'error'
  const [heardText, setHeardText] = useState('');
  const [suggestions, setSuggestions] = useState({ districts: [], places: [], categories: [] });
  const [searchIndex, setSearchIndex] = useState({ districts: [], places: [] });
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUserAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);



  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Load search index on mount
  useEffect(() => {
    const load = async () => {
      const idx = await loadSearchIndex();
      setSearchIndex(idx);
    };
    load();
  }, []);

  // Handle global Voice Search Trigger event
  useEffect(() => {
    const handleGlobalVoice = () => {
      setSearchOpen(true);
      setTimeout(() => {
        handleVoiceSearch();
      }, 300);
    };
    window.addEventListener('triggerVoiceSearch', handleGlobalVoice);
    return () => window.removeEventListener('triggerVoiceSearch', handleGlobalVoice);
  }, [searchIndex]);

  // Reset voice state when search closes
  useEffect(() => {
    if (!searchOpen) {
      setVoiceState('idle');
      setHeardText('');
    }
  }, [searchOpen]);

  // Client-side text search indexing
  useEffect(() => {
    if (!query.trim()) { setResults({ districts: [], places: [] }); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      
      const normalized = query.toLowerCase();
      const matchedDistricts = searchIndex.districts.filter(d => 
        d.name.toLowerCase().includes(normalized) || 
        d.slug.includes(normalized)
      );
      const matchedPlaces = searchIndex.places.filter(p => 
        p.name.toLowerCase().includes(normalized) || 
        p.slug.includes(normalized) ||
        p.category.toLowerCase().includes(normalized) ||
        p.districtName.toLowerCase().includes(normalized)
      );
      
      const searchResults = { districts: matchedDistricts, places: matchedPlaces };
      setResults(searchResults);
      
      // Track SEARCH event
      trackClientEvent('SEARCH', { metadata: { searchQuery: query } });
      
      const hasAnyResults = matchedDistricts.length > 0 || matchedPlaces.length > 0;
      if (!hasAnyResults) {
        trackClientEvent('SEARCH_NO_RESULT', { metadata: { searchQuery: query } });
      }
      setSearching(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, searchIndex]);

  const handleMatchNavigation = (match) => {
    if (match.type === 'place') {
      trackClientEvent('SEARCH_RESULT_CLICK', {
        placeId: match.data._id,
        metadata: { searchQuery: query, destinationId: match.data._id, destinationType: 'Place' }
      });
      navigate(`/place/${match.data.slug || match.data._id}`);
    } else if (match.type === 'district') {
      trackClientEvent('SEARCH_RESULT_CLICK', {
        districtId: match.data._id,
        metadata: { searchQuery: query, destinationId: match.data._id, destinationType: 'District' }
      });
      navigate(`/district/${match.data.slug}`);
    } else if (match.type === 'category') {
      trackClientEvent('SEARCH_RESULT_CLICK', {
        category: match.data,
        metadata: { searchQuery: query, destinationId: match.data, destinationType: 'Category' }
      });
      navigate(`/districts?category=${encodeURIComponent(match.data)}`);
    }
    setSearchOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        const match = findBestMatch(query, searchIndex.districts, searchIndex.places);
        if (match) {
          handleMatchNavigation(match);
        } else {
          // If no match found, fallback to districts search
          navigate(`/districts?search=${encodeURIComponent(query.trim())}`);
          setSearchOpen(false);
          setQuery('');
        }
      }
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceState('listening');
      setQuery('');
      setHeardText('');
    };

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript;
      transcript = transcript.replace(/[.,!?]$/, '').trim();
      setHeardText(transcript);
      setVoiceState('heard');
      trackClientEvent('VOICE_SEARCH', { metadata: { searchQuery: transcript } });
      
      setTimeout(() => {
        setVoiceState('searching');
        setQuery(transcript);
        
        setTimeout(() => {
          const match = findBestMatch(transcript, searchIndex.districts, searchIndex.places);
          if (match) {
            handleMatchNavigation(match);
            setVoiceState('idle');
          } else {
            setVoiceState('error');
            setSuggestions(getSuggestions(transcript, searchIndex.districts, searchIndex.places));
          }
        }, 600);
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setVoiceState('error');
      setSuggestions(getSuggestions('', searchIndex.districts, searchIndex.places));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Districts', to: '/districts' },
    { label: 'Categories', to: '/categories' }
  ];

  const hasResults = results.districts.length > 0 || results.places.length > 0;

  const isSolidNavbar = scrolled || menuOpen;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isSolidNavbar 
          ? 'bg-bg/98 backdrop-blur-2xl border-b border-white/15 shadow-2xl py-1 md:py-2' 
          : 'bg-gradient-to-b from-black/85 via-black/45 to-transparent py-3 md:py-4'
      }`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center group" aria-label="Visit AP Home">
            <img 
              src="/logo.png" 
              alt="Visit AP" 
              className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105 duration-300" 
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-xl text-base font-bold transition-all duration-300 ${
                    isActive
                      ? 'text-bg bg-primary shadow-amber'
                      : isSolidNavbar
                        ? 'text-textMuted hover:text-text hover:bg-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            <span className="w-[1px] h-6 bg-white/15 mx-2"></span>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-bold transition-all duration-300 border ${
                    dropdownOpen 
                      ? 'text-text bg-white/10 border-white/20' 
                      : 'text-textMuted hover:text-text hover:bg-white/5 border-transparent hover:border-white/10'
                  }`}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label="User account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-surface border border-white/15 shadow-2xl py-2 z-50 overflow-hidden"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] mb-1.5">
                        <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Logged in as</p>
                        <p className="text-base font-bold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-textMuted truncate mt-0.5">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-textMuted hover:text-text hover:bg-white/10 transition-colors font-semibold"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">👤</span> Profile
                      </Link>

                      <Link
                        to="/trip-planner"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-textMuted hover:text-text hover:bg-white/10 transition-colors font-semibold"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">✈️</span> Trip Planner
                      </Link>

                      <Link
                        to="/my-trips"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-textMuted hover:text-text hover:bg-white/10 transition-colors font-semibold"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">📅</span> My Trips
                      </Link>

                      <Link
                        to="/my-reviews"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-textMuted hover:text-text hover:bg-white/10 transition-colors font-semibold"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">💬</span> Tourist Reviews
                      </Link>

                      <Link
                        to="/my-travel-collection"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-primary hover:text-white hover:bg-white/10 transition-colors font-bold"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">❤️</span> Saved Places
                      </Link>

                      <div className="border-t border-white/10 my-1.5"></div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-white/10 hover:text-red-400 text-left transition-colors font-bold font-body"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">🚪</span> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-base font-bold transition-all duration-300 ${
                    location.pathname === '/login'
                      ? 'text-primary bg-primary/10'
                      : isSolidNavbar
                        ? 'text-textMuted hover:text-text hover:bg-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-1.5 btn-primary !py-2 !px-4.5 !rounded-xl text-sm font-bold !min-h-[40px]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Search + Mobile Quick Config */}
          <div className="flex items-center gap-1.5">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-textMuted hover:text-primary transition-colors rounded-xl hover:bg-white/5"
              aria-label={searchOpen ? "Close Search" : "Open Search"}
              aria-expanded={searchOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 text-textMuted hover:text-text rounded-xl hover:bg-white/5"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar Panel */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-3.5 relative max-w-2xl mx-auto"
              ref={searchRef}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder={voiceState === 'listening' ? "Listening..." : "Search districts, beaches, temples..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  aria-label="Search tourist locations"
                  className="w-full bg-surfaceLight border border-white/15 rounded-2xl px-5 py-3.5 pl-12 pr-12 text-text placeholder-textMuted/65 text-base focus:outline-none focus:border-primary transition-colors font-body shadow-inner"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searching ? (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <button
                    onClick={handleVoiceSearch}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                      voiceState === 'listening' ? 'bg-primary/20 text-primary animate-pulse' : 'text-textMuted hover:text-primary hover:bg-white/5'
                    }`}
                    title="Voice Search"
                    aria-label="Voice Search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Voice Search Visual Feedback States */}
              {voiceState !== 'idle' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface/98 border border-white/15 rounded-2xl shadow-2xl z-50 p-6 backdrop-blur-2xl">
                  {voiceState === 'listening' && (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse text-3xl">🎤</div>
                      <p className="text-white text-lg font-bold">Listening...</p>
                      <p className="text-textMuted text-sm">Speak a district, attraction, or category</p>
                    </div>
                  )}

                  {voiceState === 'heard' && (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
                      <p className="text-textMuted text-xs font-bold uppercase tracking-wider">Heard</p>
                      <p className="text-white text-xl font-black text-center">"{heardText}"</p>
                    </div>
                  )}

                  {voiceState === 'searching' && (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-white text-lg font-bold">Searching...</p>
                    </div>
                  )}

                  {voiceState === 'error' && (
                    <div>
                      <div className="text-center py-4">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-white font-bold text-lg">Sorry, we couldn't find that destination.</p>
                        {heardText && <p className="text-textMuted text-sm mt-1">We heard: "{heardText}"</p>}
                      </div>

                      {/* Suggestions list */}
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Suggested Destinations</p>
                        
                        <div className="space-y-4">
                          {suggestions.places && suggestions.places.length > 0 && (
                            <div>
                              <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Similar Places</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.places.map(p => (
                                  <button
                                    key={p._id}
                                    onClick={() => {
                                      setVoiceState('idle');
                                      navigate(`/place/${p.slug || p._id}`);
                                      setSearchOpen(false);
                                      setQuery('');
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-white text-sm font-semibold transition-all hover:bg-white/10"
                                  >
                                    🗺️ {p.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.districts && suggestions.districts.length > 0 && (
                            <div>
                              <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Similar Districts</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.districts.map(d => (
                                  <button
                                    key={d._id}
                                    onClick={() => {
                                      setVoiceState('idle');
                                      navigate(`/district/${d.slug}`);
                                      setSearchOpen(false);
                                      setQuery('');
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-white text-sm font-semibold transition-all hover:bg-white/10"
                                  >
                                    📍 {d.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.categories && suggestions.categories.length > 0 && (
                            <div>
                              <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Related Categories</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.categories.map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      setVoiceState('idle');
                                      navigate(`/districts?category=${encodeURIComponent(cat)}`);
                                      setSearchOpen(false);
                                      setQuery('');
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-white text-sm font-semibold transition-all hover:bg-white/10"
                                  >
                                    🏷️ {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Results list */}
              {voiceState === 'idle' && query && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/15 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scroll p-2">
                  {results.districts.length > 0 && (
                    <div className="p-1">
                      <p className="text-[10px] text-textMuted font-bold px-2 mb-1.5 uppercase tracking-wider">Districts</p>
                      {results.districts.map((d) => (
                        <button
                          key={d._id}
                          onClick={() => {
                            trackClientEvent('SEARCH_RESULT_CLICK', {
                              districtId: d._id,
                              metadata: { searchQuery: query, destinationId: d._id, destinationType: 'District' }
                            });
                            navigate(`/district/${d.slug}`);
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors text-base font-semibold text-white"
                        >
                          <span className="text-primary text-lg">📍</span>
                          <span>{d.name} District</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.places.length > 0 && (
                    <div className="p-1 border-t border-white/10 mt-1.5">
                      <p className="text-[10px] text-textMuted font-bold px-2 mb-1.5 uppercase tracking-wider">Places</p>
                      {results.places.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            trackClientEvent('SEARCH_RESULT_CLICK', {
                              placeId: p._id,
                              metadata: { searchQuery: query, destinationId: p._id, destinationType: 'Place' }
                            });
                            navigate(`/place/${p.slug || p._id}`);
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors"
                        >
                          <span className="text-accent text-lg">🗺️</span>
                          <div>
                            <p className="text-white text-base font-semibold">{p.name}</p>
                            <p className="text-textMuted text-xs font-semibold">{p.districtName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {voiceState === 'idle' && query && !hasResults && !searching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/15 rounded-2xl shadow-2xl z-50 p-5 text-center text-textMuted text-base font-semibold">
                  No results for "{query}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden pb-5 border-t border-white/10 mt-2 max-h-[75vh] overflow-y-auto custom-scroll px-1"
            >
              <div className="flex flex-col gap-1.5 pt-2 pb-3.5 mb-2.5 border-b border-white/10">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl text-base font-bold transition-colors min-h-[48px] flex items-center ${
                        isActive
                          ? 'text-bg bg-primary shadow-amber'
                          : 'text-white hover:text-primary hover:bg-white/5'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1">
                {isAuthenticated ? (
                  <div className="bg-surface border border-white/15 rounded-2xl p-4 mt-1.5 shadow-xl">
                    <div className="flex items-center gap-3.5 mb-3.5 border-b border-white/10 pb-3.5 px-1">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-black text-sm uppercase">
                        {user?.name ? user.name[0] : 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-base font-bold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-textMuted truncate mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">👤</span> 
                        <span>Edit Profile</span>
                      </Link>

                      <Link
                        to="/trip-planner"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">✈️</span> 
                        <span>Trip Planner</span>
                      </Link>

                      <Link
                        to="/my-trips"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">📅</span> 
                        <span>My Trips</span>
                      </Link>

                      <Link
                        to="/my-reviews"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">💬</span> 
                        <span>Tourist Reviews</span>
                      </Link>
                      
                      <Link
                        to="/my-travel-collection"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-bold text-primary hover:text-white hover:bg-white/5 transition-colors min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">❤️</span> 
                        <span>Saved Places</span>
                      </Link>

                      <div className="border-t border-white/10 my-2"></div>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-bold text-danger hover:bg-white/5 hover:text-red-400 text-left transition-colors w-full min-h-[48px]"
                      >
                        <span className="text-lg w-6 text-center">🚪</span> 
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-center py-3.5 rounded-xl border border-white/15 text-base font-bold hover:bg-white/5 text-text min-h-[48px] flex items-center justify-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-center py-3.5 rounded-xl bg-primary text-bg font-black text-base hover:bg-amber-400 shadow-amber min-h-[48px] flex items-center justify-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
