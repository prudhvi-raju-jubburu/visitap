import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center">
                <span className="text-bg font-display font-black text-sm">V</span>
              </div>
              <span className="font-display text-xl font-bold">
                <span className="text-primary">Visit</span>
                <span className="text-text"> AP</span>
              </span>
            </div>
            <p className="text-textMuted text-sm leading-relaxed max-w-sm">
              Discover the breathtaking beauty, ancient heritage, and vibrant culture of Andhra Pradesh. Your complete guide to exploring the Pearl of the East Coast.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-sm">🌐</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-text mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'All Districts', to: '/districts' },
                { label: 'Interactive Map', to: '/interactive-map' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-textMuted text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Districts */}
          <div>
            <h4 className="font-semibold text-text mb-4 text-sm uppercase tracking-wider">Top Districts</h4>
            <ul className="space-y-2">
              {['Visakhapatnam', 'Tirupati', 'Kurnool', 'Guntur'].map((d) => (
                <li key={d}>
                  <Link to={`/district/${d.toLowerCase()}`} className="text-textMuted text-sm hover:text-primary transition-colors">
                    {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-textMuted text-xs">
            © {year} Visit AP. Designed for Andhra Pradesh Tourism Exploration.
          </p>
          <p className="text-textMuted text-xs">
            Built with ❤️ using MERN Stack
          </p>
        </div>
      </div>
    </footer>
  );
}
