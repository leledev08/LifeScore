import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const NAV = [
  { to: '/',          label: 'Dashboard',   icon: '▦' },
  { to: '/entry',     label: 'Daily Entry', icon: '✎' },
  { to: '/history',   label: 'History',     icon: '⊟' },
  { to: '/analytics', label: 'Analytics',   icon: '↗' },
  { to: '/goals',     label: 'Goals',       icon: '◎' },
  { to: '/settings',  label: 'Settings',    icon: '⚙' },
];

function NavItems({ onNav }: { onNav?: () => void }) {
  const { clearAuth, user } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate('/login');
    onNav?.();
  }

  return (
    <>
      <div className="px-3 mb-6">
        <span className="text-lg font-bold text-primary">LifeScore</span>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <span className="w-4 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-border">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <span className="w-4 text-center">{isDark ? '☀' : '☾'}</span>
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <span className="w-4 text-center">⏻</span>
          Logout
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-card border-r border-border px-3 py-4 shrink-0">
        <NavItems />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <span className="text-base font-bold text-primary">LifeScore</span>
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h14M3 12h14M3 18h14" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-56 bg-card border-r border-border px-3 py-4 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="self-end mb-2 p-1 rounded text-muted-foreground hover:text-foreground"
          aria-label="Close menu"
        >
          ✕
        </button>
        <NavItems onNav={() => setOpen(false)} />
      </aside>
    </>
  );
}
