import React from 'react';
import { useTheme, themes, type ThemeId } from '../context/ThemeContext';
import { Card } from '../components/UI';

export const ConfiguracionPage: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();

  const themeList: ThemeId[] = ['light', 'dark', 'ocean', 'forest', 'sunset', 'purple'];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--color-text)' }}>
        ⚙️ Configuración
      </h1>

      <Card title="Tema de la aplicación" className="mb-6">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Elegí el tema que más te guste. Se guarda automáticamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themeList.map((id) => {
            const theme = themes[id];
            const isActive = currentTheme.id === id;

            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left active:scale-95 ${
                  isActive ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                }}
              >
                {/* Preview bar */}
                <div className="flex gap-1 mb-3">
                  <div
                    className="h-6 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="h-6 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div
                    className="h-6 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.bgSecondary }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl">{theme.icon}</span>
                  <div>
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: theme.colors.text }}
                    >
                      {theme.name}
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {theme.description}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Info */}
      <Card>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          ℹ️ Acerca de FinanceTrack
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Aplicación de control de gastos personales.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Versión 1.0.0
        </p>
      </Card>
    </div>
  );
};
