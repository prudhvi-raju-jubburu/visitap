import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  const policyInfo = {
    'Privacy Policy': 'Privacy Policy:\n\nVisit AP is committed to protecting your privacy. We collect personal details only when voluntarily submitted by visitors (such as reviews, ratings, and user profile data). Your data is stored securely in MongoDB Atlas and is never shared with third-party advertising networks.',
    'Terms & Conditions': 'Terms & Conditions:\n\nBy accessing Visit AP, you agree to comply with our terms of service. All content, travel guides, reviews, and photographs are the property of Visit AP or its contributors. Commercial redistribution of our tourism data without prior permission is strictly prohibited.'
  };

  const handlePolicyClick = (e, policyName) => {
    e.preventDefault();
    const info = policyInfo[policyName] || `${policyName} details will be available soon.`;
    alert(info);
  };

  return (
    <footer className="bg-surface/20 backdrop-blur-lg border-t border-white/5 mt-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-2 space-y-4 pt-1">
            <p className="text-textMuted text-xs leading-relaxed max-w-sm font-body">
              Explore the breathtaking beauty, heritage, and culture of Andhra Pradesh. The official guide to the Pearl of the East Coast, from hills to beaches.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-text/80">
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
                    className="text-textMuted text-xs hover:text-primary transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-text/80">
              Legal & Support
            </h4>
            <ul className="space-y-2 font-body">
              {[
                'Privacy Policy',
                'Terms & Conditions'
              ].map((name) => (
                <li key={name}>
                  <button
                    onClick={(e) => handlePolicyClick(e, name)}
                    className="text-textMuted text-xs hover:text-primary transition-colors text-left font-medium"
                  >
                    {name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-feedback'))}
                  className="text-textMuted text-xs hover:text-primary transition-colors text-left font-medium"
                >
                  Give Feedback
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/5 my-8"></div>

        {/* Footer Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-textMuted text-[11px] font-body">
              © {year} Visit AP. Designed for Andhra Pradesh Tourism Authority.
            </p>
            <p className="text-textMuted/80 text-[10px] font-body">
              Developed by{' '}
              <a
                href="https://www.linkedin.com/in/jubburu-prudhvi-raju/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline decoration-dotted font-medium"
              >
                Prudhvi Raju Jubburu
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-textMuted/60 font-body">
            <span>Official Tourism Portal</span>
            <span className="w-1 h-1 rounded-full bg-white/10"></span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
