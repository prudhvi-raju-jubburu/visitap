import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchDistricts, fetchPlaces, fetchTopFeedbacks } from '../services/api';
import DistrictCard from '../components/DistrictCard';
import PlaceCard from '../components/PlaceCard';
import { GridSkeleton } from '../components/SkeletonLoader';

const HERO_SLIDES = [
  {
    image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774695818/wp2015413_xfo0ek.jpg',
    title: 'Tirumala',
    subtitle: 'Tirupati District',
    tag: 'Sacred Pilgrimage',
  },
  {
    image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774695463/Beautiful_20araku_20valley_20sunset_20mountains_owme9e.jpg',
    title: 'Araku Valley',
    subtitle: 'Visakhapatnam District',
    tag: 'Hill Station',
  },
  {
    image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774091010/rk1_cqbmi6.jpg',
    title: 'RK Beach',
    subtitle: 'Visakhapatnam',
    tag: 'Scenic Beach',
  },
  {
    image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774695343/dsc_0558a-e1612849526491_hw4shk.jpg',
    title: 'Gandikota Canyon',
    subtitle: 'Kurnool District',
    tag: 'Grand Canyon of India',
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % HERO_SLIDES.length);
        setTransitioning(false);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <div className="relative w-full h-full">
      <img
        src={slide.image}
        alt={slide.title}
        className={`w-full h-full object-cover transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'}
      />
      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
      {/* Slide info */}

      <motion.div
        key={current}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 right-4"
      >
        <span className="bg-primary/90 text-bg text-xs font-bold px-2 py-1 rounded-full">
          {slide.tag}
        </span>
        <p className="font-display text-white text-lg font-bold mt-1">{slide.title}</p>
        <p className="text-white/70 text-xs">{slide.subtitle}</p>
      </motion.div>

      {/* Dots */}
      <div className="absolute top-3 right-3 flex gap-1">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

const STATS = [
  { value: '26', label: 'Districts' },
  { value: '130+', label: 'Famous Places' },
  { value: '1000+', label: 'Km Coastline' },
  { value: '500+', label: 'Cultural Sites' },
];

export default function Home() {
  const [districts, setDistricts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, pRes, fRes] = await Promise.all([
          fetchDistricts(),
          fetchPlaces({ featured: true }),
          fetchTopFeedbacks(),
        ]);
        setDistricts(dRes.data.data.slice(0, 6)); // Only show top 6 districts
        setFeatured(pRes.data.data.slice(0, 6));
        setFeedbacks(fRes.data.data || []);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient noise-overlay">
        {/* Background glow */}
        <div className="absolute inset-0 bg-amber-glow pointer-events-none"></div>

        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="text-primary text-sm font-medium">Andhra Pradesh Tourism</span>
              </div>

              <h1 className="font-display font-black leading-tight mb-4 flex items-baseline gap-4">
                <span className="text-text text-[40px] md:text-[60px] lg:text-[80px]">Visit</span>
                <span className="text-primary text-[40px] md:text-[60px] lg:text-[80px]">AP</span>
              </h1>

              <p className="text-textMuted text-lg md:text-xl leading-relaxed max-w-lg mb-8">
                Explore the beauty and heritage of <strong className="text-text">Andhra Pradesh</strong>.
                From sacred temples to canyon gorges, pristine beaches to lush valleys — discover it all.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link to="/districts" className="btn-primary">
                  Explore Districts →
                </Link>
                <Link to="/categories" className="btn-outline">
                  Browse Categories
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="group cursor-default">
                    <p className="font-display text-3xl font-black text-primary group-hover:scale-110 transition-transform origin-left">{value}</p>
                    <p className="text-text/40 text-[10px] uppercase font-bold tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Image Slider */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-[40px] overflow-hidden h-[450px] md:h-[550px] shadow-glow border-4 border-white/5">
                <HeroSlider />
                {/* Decorative Elements */}
                <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Tour</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-textMuted">
          <span className="text-xs">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-textMuted to-transparent"></div>
        </div>
      </section>

      {/* ── FEATURED DESTINATIONS ────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Featured Destinations
          </motion.h2>
          <p className="section-subtitle">Handpicked attractions across Andhra Pradesh</p>
        </div>
        {loading ? <GridSkeleton count={6} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((place, i) => <PlaceCard key={place._id} place={place} index={i} />)}
          </div>
        )}
      </section>

      {/* ── EXPLORE DISTRICTS ────────────────────────────── */}
      <section className="py-20 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="section-title"
              >
                Explore Districts
              </motion.h2>
              <p className="section-subtitle">Diverse districts, endless adventures</p>
            </div>
            <Link to="/districts" className="btn-outline text-sm self-start sm:self-auto">
              View All Districts →
            </Link>
          </div>
          {loading ? <GridSkeleton count={6} /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {districts.map((d, i) => <DistrictCard key={d._id} district={d} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── TRAVEL INSPIRATION ──────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-surface to-bg opacity-90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400"
            alt="Travel Inspiration"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl mb-3">📂</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text mb-3">
              Explore Your Interests
            </h2>
            <p className="text-textMuted max-w-md mb-6">
              Browse destinations by category — temples, beaches, hill stations, and more to find your perfect trip.
            </p>
            <Link to="/categories" className="btn-primary">
              Discover Categories →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── TOURIST REVIEWS ─────────────────────────────── */}
      {!loading && feedbacks.length > 0 && (
        <section className="py-20 bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="section-title"
              >
                Tourist Experiences
              </motion.h2>
              <p className="section-subtitle">What others are saying about Visit AP</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((f, i) => (
                <motion.div
                  key={f._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex text-amber-400 text-lg mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < f.rating ? 'opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                    <p className="text-text/90 italic mb-6 leading-relaxed">"{f.message}"</p>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <p className="font-bold text-text">— {f.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
