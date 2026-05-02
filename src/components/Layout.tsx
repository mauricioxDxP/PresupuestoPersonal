import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, Rol } from '../context/AuthContext';
import { CasaSelector } from './CasaSelector';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, selectedCasaId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if user has a casa assigned
  // Also verify selectedCasaId is actually in user's casaIds (handles stale localStorage)
  const hasCasaAsignada = !!(user?.casaIds && user.casaIds.length > 0);
  const hasSelectedCasa = !!(selectedCasaId && hasCasaAsignada && user?.casaIds.includes(selectedCasaId));
  const isAdmin = user?.rol === Rol.ADMIN;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 rounded transition-all text-base ${
      isActive
        ? 'text-[var(--color-nav-text-active)]'
        : 'text-[var(--color-nav-text)]'
    }`;

  const linkStyle = (isActive: boolean): React.CSSProperties =>
    isActive
      ? { backgroundColor: 'var(--color-nav-bg-active)', color: 'var(--color-nav-text-active)' }
      : { color: 'var(--color-nav-text)' };

  // Admin has full menu regardless of casa assignment
  const navLinks = isAdmin ? [
    { to: '/casas', label: '🏠 Casas' },
    { to: '/configuracion', label: '⚙️ Configuración' },
  ] : (hasCasaAsignada ? [
    ...(isAuthenticated && user?.rol === Rol.ADMIN
      ? [
          { to: '/casas', label: '🏠 Casas' },
        ]
      : []),
    ...(isAuthenticated && user?.rol === Rol.ADMIN
      ? []
      : [
          { to: '/dashboard', label: '📊 Dashboard' },
        ]),
    // MAESTRO_CASA y USUARIO: ven gestión de casa
    ...(isAuthenticated && (user?.rol === Rol.MAESTRO_CASA || user?.rol === Rol.USUARIO)
      ? [
          { to: '/categorias', label: '📁 Categorías' },
          { to: '/motivos', label: '🏷️ Motivos' },
          { to: '/transacciones', label: '💰 Transacciones' },
          { to: '/reportes', label: '📈 Reportes' },
          ...(user?.rol === Rol.MAESTRO_CASA
            ? [
                { to: '/usuarios', label: '👥 Usuarios' },
                { to: '/permisos', label: '🔐 Permisos' },
              ]
            : []),
        ]
      : []),
    { to: '/configuracion', label: '⚙️ Configuración' },
  ] : []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav
        className="shadow-sm border-b sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--color-nav-bg)',
          borderColor: 'var(--color-nav-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                FinanceTrack
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={linkClass}
                  style={({ isActive }) => ({
                    ...linkStyle(isActive || false),
                  })}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.style.backgroundColor || el.style.backgroundColor === 'var(--color-nav-bg-active)') return;
                    el.style.backgroundColor = 'var(--color-nav-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (el.style.backgroundColor === 'var(--color-nav-bg-active)') return;
                    el.style.backgroundColor = 'transparent';
                  }}
                  end={link.to === '/dashboard' || link.to === '/casas'}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* User Menu */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l" style={{ borderColor: 'var(--color-border)' }}>
                <CasaSelector />
                <div className="text-sm text-right">
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>{user?.nombre}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user?.rol}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                  title="Cerrar sesión"
                >
                  🚪
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text)' }}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              backgroundColor: 'var(--color-nav-bg)',
              borderColor: 'var(--color-nav-border)',
            }}
          >
            <div className="px-2 py-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                  end={link.to === '/dashboard' || link.to === '/casas'}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
        {!hasCasaAsignada && !isAdmin && (
          <div className="mb-4 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-error-bg, #fef2f2)', borderColor: 'var(--color-error, #dc2626)' }}>
            <span className="text-2xl">🏠</span>
            <div>
              <div className="font-medium" style={{ color: 'var(--color-error, #dc2626)' }}>No tienes casa asignada</div>
              <div className="text-sm" style={{ color: 'var(--color-error, #dc2626)', opacity: 0.8 }}>
                Un administrador debe asignarte a una casa para que puedas usar la aplicación.
              </div>
            </div>
          </div>
        )}
        {hasCasaAsignada && !hasSelectedCasa && !isAdmin && (
          <div className="mb-4 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-warning-bg, #fffbeb)', borderColor: 'var(--color-warning, #f59e0b)' }}>
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium" style={{ color: 'var(--color-warning, #f59e0b)' }}>Selecciona una casa</div>
              <div className="text-sm" style={{ color: 'var(--color-warning, #f59e0b)', opacity: 0.8 }}>
                Tienes casas asignadas pero no has seleccionado cuál usar.
              </div>
            </div>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t shadow-lg z-50"
        style={{
          backgroundColor: 'var(--color-nav-bg)',
          borderColor: 'var(--color-nav-border)',
        }}
      >
        <div className="flex justify-around py-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded transition-colors min-w-0 ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)]'
                }`
              }
              end={link.to === '/dashboard' || link.to === '/casas'}
            >
              <span className="text-lg leading-none">{link.label.split(' ')[0]}</span>
              <span className="text-[10px] mt-0.5 truncate max-w-full">
                {link.label.split(' ').slice(1).join(' ')}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
