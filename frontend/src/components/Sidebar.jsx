import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',          icon: '⬡', label: 'Dashboard' },
  { to: '/fuel',      icon: '⛽', label: 'Fuel Types' },
  { to: '/tanks',     icon: '🗄️', label: 'Tanks' },
  { to: '/employees', icon: '👤', label: 'Employees' },
  { to: '/shifts',    icon: '🕐', label: 'Shifts' },
  { to: '/vehicles',  icon: '🚗', label: 'Vehicles' },
  { to: '/sales',     icon: '💳', label: 'Sales' },
  { to: '/reports',   icon: '📊', label: 'Reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-brand)',
          fontSize: '1.05rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          color: 'var(--amber)',
          textShadow: '0 0 20px rgba(240,165,0,0.4)',
        }}>⛽ FUELTRACK</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 2 }}>
          BUNK MANAGEMENT PRO
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--amber)' : 'var(--text-2)',
              background: isActive ? 'var(--amber-dim)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
              marginBottom: '2px',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User profile + logout */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', color: 'var(--amber)',
            fontWeight: 700,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%', padding: '8px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '7px',
            color: 'var(--text-2)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)'; }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
