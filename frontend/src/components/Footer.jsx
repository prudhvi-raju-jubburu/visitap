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
    <footer className="bg-surface/60 backdrop-blur-xl border-t border-white/10 mt-24 relative overflow-hidden select-none">
      {/* Decorative gradient light glow */}
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Tagline Column */}
          <div className="md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2 group w-max">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-amber transition-transform group-hover:scale-105">
                <span className="text-bg font-display font-black text-base">V</span>
              </div>
              <span className="font-display text-2xl font-bold">
                <span className="text-primary">Visit</span>
                <span className="text-text"> AP</span>
              </span>
            </Link>
            
            <p className="text-textMuted text-sm leading-relaxed max-w-sm font-body">
              Discover the breathtaking beauty, ancient heritage, and vibrant culture of Andhra Pradesh. We guide you to explore the Pearl of the East Coast, from sacred hills to serene waves.
            </p>

            {/* Social Icons with Visual Elements */}
            <div className="flex items-center gap-3">
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
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-bg hover:border-transparent transition-all duration-300 hover:-translate-y-0.5 text-sm"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-white">
              Explore AP
            </h4>
            <ul className="space-y-3">
              {[
                { label: '🏠 Home', to: '/' },
                { label: '📍 Districts', to: '/districts' },
                { label: '🗂️ Categories', to: '/categories' },
                { label: '🗺️ Interactive Map', to: '/interactive-map' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-textMuted text-sm hover:text-primary transition-colors flex items-center gap-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies, Terms & Conditions Column (Triggers Alert) */}
          <div className="space-y-4">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-white">
              Policies & Info
            </h4>
            <ul className="space-y-3 font-body">
              {[
                { label: '🛡️ Privacy Policy', name: 'Privacy Policy' },
                { label: '📜 Terms & Conditions', name: 'Terms & Conditions' },
                { label: '⚖️ Legal Disclaimer', name: 'Legal Disclaimer' },
                { label: '🧭 Travel Guidelines', name: 'Travel Guidelines' },
                { label: '🍪 Cookies Policy', name: 'Cookies Policy' },
              ].map((policy) => (
                <li key={policy.name}>
                  <button
                    onClick={(e) => handlePolicyClick(e, policy.name)}
                    className="text-textMuted text-sm hover:text-primary transition-colors flex items-center gap-2 text-left"
                  >
                    <span>{policy.label.split(' ')[0]}</span>
                    <span>{policy.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Glowing Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-10 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary/20 blur-md"></div>
        </div>

        {/* Footer Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-textMuted text-xs font-body">
            © {year} Visit AP. Designed for Andhra Pradesh Tourism.
          </p>
          <div className="flex items-center gap-4 text-xs text-textMuted font-body">
            <span>Built with MERN Stack</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/45"></span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
