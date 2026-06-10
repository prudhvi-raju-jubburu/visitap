import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaces, trackClientEvent } from '../services/api';
import { useUserAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ districts: [], places: [] });
  const [searching, setSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({ districts: [], places: [] }); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(query);
        const searchResults = res.data.data;
        setResults(searchResults);
        
        // Track SEARCH event
        trackClientEvent('SEARCH', { metadata: { searchQuery: query } });
        
        // If no results, track SEARCH_NO_RESULT event
        const hasAnyResults = (searchResults.districts && searchResults.districts.length > 0) || 
                              (searchResults.places && searchResults.places.length > 0);
        if (!hasAnyResults) {
          trackClientEvent('SEARCH_NO_RESULT', { metadata: { searchQuery: query } });
        }
      } catch (err) { 
        setResults({ districts: [], places: [] }); 
        trackClientEvent('SEARCH', { metadata: { searchQuery: query } });
        trackClientEvent('SEARCH_NO_RESULT', { metadata: { searchQuery: query } });
      }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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
      setQuery('');
    };

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript;
      transcript = transcript.replace(/[.,!?]$/, '').trim();
      setQuery(transcript);
      trackClientEvent('VOICE_SEARCH', { metadata: { searchQuery: transcript } });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-bg/90 backdrop-blur-xl border-b border-white/10 shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-amber group-hover:scale-110 transition-transform">
              <span className="text-bg font-display font-black text-sm">V</span>
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-primary">Visit</span>
              <span className="text-text"> AP</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-base font-bold transition-all duration-300 ${
                  location.pathname === link.to
                    ? 'text-bg bg-primary shadow-amber'
                    : 'text-textMuted hover:text-text hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <span className="w-[1px] h-6 bg-white/10 mx-2"></span>



            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-base font-bold text-textMuted hover:text-text hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface/95 backdrop-blur-xl border border-white/10 shadow-card py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] mb-1">
                        <p className="text-[10px] text-textMuted font-medium">Logged in as</p>
                        <p className="text-sm font-bold text-text truncate">{user?.name}</p>
                        <p className="text-[10px] text-textMuted truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-textMuted hover:text-text hover:bg-white/5 transition-colors font-medium"
                      >
                        <span>👤</span> Profile
                      </Link>

                      <Link
                        to="/trip-planner"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-textMuted hover:text-text hover:bg-white/5 transition-colors font-medium"
                      >
                        <span>✈️</span> Trip Planner
                      </Link>
                      <Link
                        to="/my-trips"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-textMuted hover:text-text hover:bg-white/5 transition-colors font-medium"
                      >
                        <span>📅</span> My Trips
                      </Link>

                      <Link
                        to="/my-reviews"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-textMuted hover:text-text hover:bg-white/5 transition-colors font-medium"
                      >
                        <span>💬</span> Tourist Reviews
                      </Link>

                      <Link
                        to="/my-travel-collection"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:text-white hover:bg-white/5 transition-colors font-bold"
                      >
                        <span>❤️</span> Saved Places
                      </Link>

                      <div className="border-t border-white/5 my-1"></div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-white/5 hover:text-red-400 text-left transition-colors font-medium font-body"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-base font-bold transition-all duration-300 ${
                    location.pathname === '/login'
                      ? 'text-primary bg-primary/10'
                      : 'text-textMuted hover:text-text hover:bg-white/5'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-2 btn-primary !py-2 !px-4.5 !rounded-xl text-sm font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Search + Mobile Quick Config */}
          <div className="flex items-center gap-2">


            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-textMuted hover:text-primary transition-colors rounded-xl hover:bg-white/5"
              aria-label="Open Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-textMuted hover:text-text rounded-xl hover:bg-white/5"
              aria-label="Toggle Menu"
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
              className="pb-3 relative max-w-2xl mx-auto"
              ref={searchRef}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder={isListening ? "Listening..." : "Search districts, beaches, temples..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-surfaceLight border border-white/10 rounded-2xl px-5 py-3.5 pl-12 pr-12 text-text placeholder-textMuted/65 text-base focus:outline-none focus:border-primary transition-colors font-body"
                />
                <svg className="absolute left-4 top-4.5 w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searching ? (
                  <div className="absolute right-4 top-4 w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <button
                    onClick={handleVoiceSearch}
                    className={`absolute right-4 top-3 p-1.5 rounded-full transition-colors ${
                      isListening ? 'bg-primary/20 text-primary animate-pulse' : 'text-textMuted hover:text-primary hover:bg-white/5'
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

              {/* Results list */}
              {query && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-2xl shadow-card z-50 max-h-80 overflow-y-auto custom-scroll p-2">
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
                    <div className="p-1 border-t border-white/5 mt-1.5">
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
              {query && !hasResults && !searching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-2xl shadow-card z-50 p-5 text-center text-textMuted text-base font-semibold">
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
              className="md:hidden overflow-hidden pb-4 border-t border-white/5 mt-2"
            >
              <div className="flex flex-col gap-1 pt-2 border-b border-white/5 pb-3 mb-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-3.5 rounded-xl text-base font-bold transition-colors ${
                      location.pathname === link.to
                        ? 'text-bg bg-primary'
                        : 'text-textMuted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-1 px-2">
                {isAuthenticated ? (
                  <div>
                    <div className="text-xs text-textMuted font-bold uppercase tracking-wider py-2 px-2">
                      Profile: <span className="text-primary">{user?.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors block"
                      >
                        👤 Edit Profile
                      </Link>

                      <Link
                        to="/trip-planner"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors block"
                      >
                        ✈️ Trip Planner
                      </Link>
                      <Link
                        to="/my-trips"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors block"
                      >
                        📅 My Trips
                      </Link>

                      <Link
                        to="/my-reviews"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-base font-semibold text-textMuted hover:text-text hover:bg-white/5 transition-colors block"
                      >
                        💬 Tourist Reviews
                      </Link>
                      
                      <Link
                        to="/my-travel-collection"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-3 rounded-xl text-base font-bold text-primary hover:text-white hover:bg-white/5 transition-colors block"
                      >
                        ❤️ Saved Places
                      </Link>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="px-4 py-3 rounded-xl text-base font-bold text-danger hover:bg-white/5 hover:text-red-400 text-left transition-colors block w-full"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-3 rounded-xl border border-white/15 text-base font-bold hover:bg-white/5 text-textMuted"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-3 rounded-xl bg-primary text-bg font-bold text-base hover:bg-amber-400 shadow-amber"
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
