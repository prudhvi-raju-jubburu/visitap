import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaces } from '../services/api';

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    if (!query.trim()) { setResults({ districts: [], places: [] }); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(query);
        setResults(res.data.data);
      } catch { setResults({ districts: [], places: [] }); }
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
    { label: 'Categories', to: '/categories' },
    { label: 'Staff Portal', to: '/admin/portal' },
  ];

  const hasResults = results.districts.length > 0 || results.places.length > 0;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-bg/80 backdrop-blur-xl border-b border-white/10 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-amber group-hover:scale-110 transition-transform">
              <span className="text-bg font-display font-black text-sm">V</span>
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-primary">Visit</span>
              <span className="text-text"> AP</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.to
                    ? 'text-primary bg-primary/10'
                    : 'text-textMuted hover:text-text hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search + Mobile menu */}
          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-textMuted hover:text-primary transition-colors rounded-lg hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-textMuted hover:text-text rounded-lg hover:bg-white/5"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
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
                  className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 pl-10 pr-12 text-text placeholder-textMuted text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searching ? (
                  <div className="absolute right-3 top-3.5 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <button
                    onClick={handleVoiceSearch}
                    className={`absolute right-3 top-3 p-1 rounded-full transition-colors ${
                      isListening ? 'bg-primary/20 text-primary animate-pulse' : 'text-textMuted hover:text-primary hover:bg-white/5'
                    }`}
                    title="Voice Search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Results dropdown */}
              {query && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-xl shadow-card z-50 max-h-80 overflow-y-auto custom-scroll">
                  {results.districts.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-textMuted font-medium px-2 mb-1 uppercase tracking-wider">Districts</p>
                      {results.districts.map((d) => (
                        <button
                          key={d._id}
                          onClick={() => { navigate(`/district/${d.slug}`); setSearchOpen(false); setQuery(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                        >
                          <span className="text-primary">📍</span>
                          <span className="text-text text-sm">{d.name} District</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.places.length > 0 && (
                    <div className="p-2 border-t border-white/5">
                      <p className="text-xs text-textMuted font-medium px-2 mb-1 uppercase tracking-wider">Places</p>
                      {results.places.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => { navigate(`/place/${p.slug}`); setSearchOpen(false); setQuery(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                        >
                          <span className="text-accent">🗺️</span>
                          <div>
                            <p className="text-text text-sm">{p.name}</p>
                            <p className="text-textMuted text-xs">{p.districtName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {query && !hasResults && !searching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-xl shadow-card z-50 p-4 text-center text-textMuted text-sm">
                  No results for "{query}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden pb-4"
            >
              <div className="flex flex-col gap-1 pt-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'text-primary bg-primary/10'
                        : 'text-textMuted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
