import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useThemeStore } from '../lib/themeStore';

export function Nav() {
  const location = useLocation();
  const { effectiveTheme } = useThemeStore();
  
  const isDark = effectiveTheme === 'dark';
  
  const linkStyle = (path: string) => ({
    color: location.pathname === path ? 'var(--accent-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: location.pathname === path ? 600 : 500,
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'all 0.2s',
    backgroundColor: location.pathname === path ? (isDark ? '#2A3A4A' : '#E3F2FD') : 'transparent',
  });

  return (
    <nav style={{ 
      padding: '0',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Link 
          to="/" 
          style={{ 
            color: 'var(--text-primary)', 
            textDecoration: 'none', 
            fontSize: '18px', 
            fontWeight: 600,
            padding: '16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          AegisGuard
        </Link>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Demo */}
          <Link to="/demo" style={{...linkStyle('/demo'), background: location.pathname === '/demo' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--accent-primary)', color: '#FFF', fontWeight: 600}}>🎪 Demo Hub</Link>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
          
          {/* Observability */}
          <Link to="/logs" style={linkStyle('/logs')}>Logs</Link>
          <Link to="/metrics" style={linkStyle('/metrics')}>Metrics</Link>
          <Link to="/traces" style={linkStyle('/traces')}>Traces</Link>
          <Link to="/rum" style={linkStyle('/rum')}>RUM</Link>
          <Link to="/monitors" style={linkStyle('/monitors')}>Monitors</Link>
          <Link to="/slo" style={linkStyle('/slo')}>SLO</Link>
          <Link to="/usage" style={linkStyle('/usage')}>Usage</Link>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
          
          {/* Admin */}
          <Link to="/users" style={linkStyle('/users')}>Users</Link>
          <Link to="/apikeys" style={linkStyle('/apikeys')}>API Keys</Link>
          <Link to="/events" style={linkStyle('/events')}>Events</Link>
          <Link to="/audit-logs" style={linkStyle('/audit-logs')}>Audit Logs</Link>
          <Link to="/settings/security" style={linkStyle('/settings/security')}>Settings</Link>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

