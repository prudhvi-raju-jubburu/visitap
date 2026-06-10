import { Link, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/AuthContext';

export default function BottomNavigation() {
  const location = useLocation();
  const { isAuthenticated } = useUserAuth();

  const handleVoiceSearchClick = () => {
    window.dispatchEvent(new Event('triggerVoiceSearch'));
  };

  const menuItems = [
    {
      label: 'Home',
      icon: '🏠',
      path: '/'
    },
    {
      label: 'Districts',
      icon: '🗺️',
      path: '/districts'
    },
    {
      label: 'Speak',
      icon: '🎤',
      onClick: handleVoiceSearchClick
    },
    {
      label: 'Saved',
      icon: '❤️',
      path: '/my-travel-collection'
    },
    {
      label: 'Account',
      icon: '👤',
      path: isAuthenticated ? '/profile' : '/login'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] px-2 py-1 flex items-center justify-around h-16 select-none safe-bottom">
      {menuItems.map((item, idx) => {
        const isActive = item.path && location.pathname === item.path;
        
        if (item.onClick) {
          return (
            <button
              key={idx}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] text-textMuted hover:text-primary active:scale-95 transition-all"
              aria-label={item.label}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] font-bold tracking-wide text-textMuted uppercase">{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={idx}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-all active:scale-95 ${
              isActive ? 'text-primary' : 'text-textMuted hover:text-text'
            }`}
            aria-label={item.label}
          >
            <span className="text-2xl mb-0.5">{item.icon}</span>
            <span className={`text-[10px] font-bold tracking-wide uppercase ${
              isActive ? 'text-primary font-black' : 'text-textMuted'
            }`}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
