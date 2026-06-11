import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  const policyInfo = {
    'Privacy Policy': 'Privacy Policy:\n\nVisit AP is committed to protecting your privacy. We collect personal details only when voluntarily submitted by visitors (such as reviews, ratings, and user profile data). Your data is stored securely in MongoDB Atlas and is never shared with third-party advertising networks.',
    'Terms & Conditions': 'Terms & Conditions:\n\nBy accessing Visit AP, you agree to comply with our terms of service. All content, travel guides, reviews, and photographs are the property of Visit AP or its contributors. Commercial redistribution of our tourism data without prior permission is strictly prohibited.',
    'Legal Disclaimer': 'Legal Disclaimer:\n\nVisit AP provides travel information, maps, and recommendations for tourist destinations in Andhra Pradesh. While we strive to maintain verified geospatial coordinates and ratings, travel conditions, operating hours, and road accessibility are subject to change. Travelers are advised to verify local advisories before journeying.',
    'Travel Guidelines': 'Travel Guidelines:\n\nWhen exploring Andhra Pradesh, please respect local cultural norms, preserve ancient heritage sites, keep beaches clean, and support local community artisans. Carry proper hydration when visiting canyon treks (e.g. Gandikota) and adhere to temple dress codes.',
    'Cookies Policy': 'Cookies Policy:\n\nWe use essential cookies and browser local storage to maintain your user session, theme preferences, and saved favorites. No tracking or marketing cookies are used on this platform.'
  };

  const handlePolicyClick = (e, policyName) => {
    e.preventDefault();
    const info = policyInfo[policyName] || `${policyName} details will be available soon.`;
    alert(info);
  };

  return (
    <footer className="bg-surface/30 backdrop-blur-md border-t border-white/5 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Tagline Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center group w-max" aria-label="Visit AP Home">
              <img 
                src="/logo.png" 
                alt="Visit AP" 
                className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105 duration-300" 
              />
            </Link>
            
            <p className="text-textMuted text-sm leading-relaxed max-w-sm font-body">
              Explore the breathtaking beauty, heritage, and culture of Andhra Pradesh. Discover tourist spots, plan custom itineraries, and navigate with verified coordinates.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: '🌐', label: 'Website', url: 'https://tourism.ap.gov.in' },
                { icon: '📸', label: 'Instagram', url: '#' },
                { icon: '💬', label: 'Twitter', url: '#' },
                { icon: '🎥', label: 'YouTube', url: '#' },
              ].map((soc) => (
                <a
                  key={soc.label}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={soc.label}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-bg hover:border-transparent transition-all duration-300 hover:-translate-y-0.5 text-xs"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-text/90">
              Explore
            </h4>
            <ul className="space-y-2 font-body">
              {[
                { label: 'Home', to: '/' },
                { label: 'Districts', to: '/districts' },
                { label: 'Categories', to: '/categories' },
                { label: 'Interactive Map', to: '/interactive-map' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-textMuted text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies, Terms & Conditions Column */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-text/90">
              Policies & Info
            </h4>
            <ul className="space-y-2 font-body">
              {[
                'Privacy Policy',
                'Terms & Conditions',
                'Legal Disclaimer',
                'Travel Guidelines',
                'Cookies Policy'
              ].map((name) => (
                <li key={name}>
                  <button
                    onClick={(e) => handlePolicyClick(e, name)}
                    className="text-textMuted text-sm hover:text-primary transition-colors text-left"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/5 my-8"></div>

        {/* Footer Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-textMuted text-xs font-body">
            © {year} Visit AP. Designed for Andhra Pradesh Tourism.
          </p>
          <div className="flex items-center gap-4 text-xs text-textMuted/60 font-body">
            <span>Built with MERN Stack</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
