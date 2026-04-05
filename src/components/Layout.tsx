import { NavLink } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
    }`;

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/categorias', label: 'Categorías' },
    { to: '/motivos', label: 'Motivos' },
    { to: '/transacciones', label: 'Transacciones' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Solo PC */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">FinanceTrack</h1>
            </div>

            {/* Desktop Menu */}
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
};
