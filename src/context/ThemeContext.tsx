import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'purple';

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  colors: {
    primary: string;
    primaryHover: string;
    primaryText: string;
    secondary: string;
    secondaryHover: string;
    secondaryText: string;
    danger: string;
    dangerHover: string;
    bg: string;
    bgSecondary: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBg: string;
    inputBorder: string;
    navBg: string;
    navBorder: string;
    navText: string;
    navTextActive: string;
    navBgActive: string;
    navBgHover: string;
    dropdownBg: string;
    dropdownHover: string;
    badgeIngreso: string;
    badgeIngresoText: string;
    badgeGasto: string;
    badgeGastoText: string;
    textIngreso: string;
    textGasto: string;
    modalOverlay: string;
    summaryBg: string;
    summaryBgHover: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    name: 'Claro',
    icon: '☀️',
    description: 'Tema clásico y limpio',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryText: '#ffffff',
      secondary: '#e5e7eb',
      secondaryHover: '#d1d5db',
      secondaryText: '#1f2937',
      danger: '#dc2626',
      dangerHover: '#b91c1c',
      bg: '#f9fafb',
      bgSecondary: '#f3f4f6',
      card: '#ffffff',
      cardBorder: 'rgba(0,0,0,0.05)',
      text: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      inputBg: '#ffffff',
      inputBorder: '#d1d5db',
      navBg: '#ffffff',
      navBorder: '#e5e7eb',
      navText: '#374151',
      navTextActive: '#ffffff',
      navBgActive: '#2563eb',
      navBgHover: '#f3f4f6',
      dropdownBg: '#ffffff',
      dropdownHover: '#f3f4f6',
      badgeIngreso: '#dcfce7',
      badgeIngresoText: '#166534',
      badgeGasto: '#fee2e2',
      badgeGastoText: '#991b1b',
      textIngreso: '#16a34a',
      textGasto: '#dc2626',
      modalOverlay: 'rgba(0,0,0,0.5)',
      summaryBg: '#f9fafb',
      summaryBgHover: '#f3f4f6',
    },
  },
  dark: {
    id: 'dark',
    name: 'Oscuro',
    icon: '🌙',
    description: 'Ideal para trabajar de noche',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#60a5fa',
      primaryText: '#ffffff',
      secondary: '#374151',
      secondaryHover: '#4b5563',
      secondaryText: '#e5e7eb',
      danger: '#ef4444',
      dangerHover: '#f87171',
      bg: '#111827',
      bgSecondary: '#1f2937',
      card: '#1f2937',
      cardBorder: 'rgba(255,255,255,0.05)',
      text: '#f9fafb',
      textSecondary: '#e5e7eb',
      textMuted: '#9ca3af',
      border: '#374151',
      inputBg: '#1f2937',
      inputBorder: '#4b5563',
      navBg: '#1f2937',
      navBorder: '#374151',
      navText: '#d1d5db',
      navTextActive: '#ffffff',
      navBgActive: '#3b82f6',
      navBgHover: '#374151',
      dropdownBg: '#1f2937',
      dropdownHover: '#374151',
      badgeIngreso: '#14532d',
      badgeIngresoText: '#4ade80',
      badgeGasto: '#7f1d1d',
      badgeGastoText: '#fca5a5',
      textIngreso: '#4ade80',
      textGasto: '#f87171',
      modalOverlay: 'rgba(0,0,0,0.7)',
      summaryBg: '#1f2937',
      summaryBgHover: '#374151',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Océano',
    icon: '🌊',
    description: 'Tonos azules profundos',
    colors: {
      primary: '#0891b2',
      primaryHover: '#06b6d4',
      primaryText: '#ffffff',
      secondary: '#164e63',
      secondaryHover: '#155e75',
      secondaryText: '#cffafe',
      danger: '#e11d48',
      dangerHover: '#f43f5e',
      bg: '#0c1929',
      bgSecondary: '#132f4c',
      card: '#132f4c',
      cardBorder: 'rgba(6,182,212,0.1)',
      text: '#e0f2fe',
      textSecondary: '#bae6fd',
      textMuted: '#7dd3fc',
      border: '#164e63',
      inputBg: '#132f4c',
      inputBorder: '#155e75',
      navBg: '#132f4c',
      navBorder: '#164e63',
      navText: '#7dd3fc',
      navTextActive: '#ffffff',
      navBgActive: '#0891b2',
      navBgHover: '#164e63',
      dropdownBg: '#132f4c',
      dropdownHover: '#164e63',
      badgeIngreso: '#064e3b',
      badgeIngresoText: '#34d399',
      badgeGasto: '#7f1d1d',
      badgeGastoText: '#fca5a5',
      textIngreso: '#34d399',
      textGasto: '#fb7185',
      modalOverlay: 'rgba(0,0,0,0.7)',
      summaryBg: '#132f4c',
      summaryBgHover: '#164e63',
    },
  },
  forest: {
    id: 'forest',
    name: 'Bosque',
    icon: '🌲',
    description: 'Verde natural y relajante',
    colors: {
      primary: '#059669',
      primaryHover: '#10b981',
      primaryText: '#ffffff',
      secondary: '#14532d',
      secondaryHover: '#166534',
      secondaryText: '#d1fae5',
      danger: '#dc2626',
      dangerHover: '#ef4444',
      bg: '#0a1f0a',
      bgSecondary: '#14291a',
      card: '#14291a',
      cardBorder: 'rgba(16,185,129,0.1)',
      text: '#d1fae5',
      textSecondary: '#a7f3d0',
      textMuted: '#6ee7b7',
      border: '#14532d',
      inputBg: '#14291a',
      inputBorder: '#166534',
      navBg: '#14291a',
      navBorder: '#14532d',
      navText: '#6ee7b7',
      navTextActive: '#ffffff',
      navBgActive: '#059669',
      navBgHover: '#14532d',
      dropdownBg: '#14291a',
      dropdownHover: '#14532d',
      badgeIngreso: '#064e3b',
      badgeIngresoText: '#34d399',
      badgeGasto: '#7f1d1d',
      badgeGastoText: '#fca5a5',
      textIngreso: '#34d399',
      textGasto: '#fb7185',
      modalOverlay: 'rgba(0,0,0,0.7)',
      summaryBg: '#14291a',
      summaryBgHover: '#14532d',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Atardecer',
    icon: '🌅',
    description: 'Cálidos tonos naranja',
    colors: {
      primary: '#ea580c',
      primaryHover: '#f97316',
      primaryText: '#ffffff',
      secondary: '#7c2d12',
      secondaryHover: '#9a3412',
      secondaryText: '#fed7aa',
      danger: '#dc2626',
      dangerHover: '#ef4444',
      bg: '#1c1008',
      bgSecondary: '#2d1a0e',
      card: '#2d1a0e',
      cardBorder: 'rgba(249,115,22,0.1)',
      text: '#fef3c7',
      textSecondary: '#fde68a',
      textMuted: '#fbbf24',
      border: '#7c2d12',
      inputBg: '#2d1a0e',
      inputBorder: '#9a3412',
      navBg: '#2d1a0e',
      navBorder: '#7c2d12',
      navText: '#fbbf24',
      navTextActive: '#ffffff',
      navBgActive: '#ea580c',
      navBgHover: '#7c2d12',
      dropdownBg: '#2d1a0e',
      dropdownHover: '#7c2d12',
      badgeIngreso: '#064e3b',
      badgeIngresoText: '#34d399',
      badgeGasto: '#7f1d1d',
      badgeGastoText: '#fca5a5',
      textIngreso: '#34d399',
      textGasto: '#fb7185',
      modalOverlay: 'rgba(0,0,0,0.7)',
      summaryBg: '#2d1a0e',
      summaryBgHover: '#7c2d12',
    },
  },
  purple: {
    id: 'purple',
    name: 'Púrpura',
    icon: '💜',
    description: 'Elegante y moderno',
    colors: {
      primary: '#7c3aed',
      primaryHover: '#8b5cf6',
      primaryText: '#ffffff',
      secondary: '#4c1d95',
      secondaryHover: '#5b21b6',
      secondaryText: '#ddd6fe',
      danger: '#dc2626',
      dangerHover: '#ef4444',
      bg: '#1a0a2e',
      bgSecondary: '#2d1b4e',
      card: '#2d1b4e',
      cardBorder: 'rgba(139,92,246,0.1)',
      text: '#ede9fe',
      textSecondary: '#ddd6fe',
      textMuted: '#c4b5fd',
      border: '#4c1d95',
      inputBg: '#2d1b4e',
      inputBorder: '#5b21b6',
      navBg: '#2d1b4e',
      navBorder: '#4c1d95',
      navText: '#c4b5fd',
      navTextActive: '#ffffff',
      navBgActive: '#7c3aed',
      navBgHover: '#4c1d95',
      dropdownBg: '#2d1b4e',
      dropdownHover: '#4c1d95',
      badgeIngreso: '#064e3b',
      badgeIngresoText: '#34d399',
      badgeGasto: '#7f1d1d',
      badgeGastoText: '#fca5a5',
      textIngreso: '#34d399',
      textGasto: '#fb7185',
      modalOverlay: 'rgba(0,0,0,0.7)',
      summaryBg: '#2d1b4e',
      summaryBgHover: '#4c1d95',
    },
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('finance-track-theme');
    return (saved as ThemeId) || 'light';
  });

  const currentTheme = themes[themeId];

  useEffect(() => {
    localStorage.setItem('finance-track-theme', themeId);
    applyTheme(currentTheme);
  }, [themeId, currentTheme]);

  // Aplicar tema al montar
  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty('--color-primary', c.primary);
    root.style.setProperty('--color-primary-hover', c.primaryHover);
    root.style.setProperty('--color-primary-text', c.primaryText);
    root.style.setProperty('--color-secondary', c.secondary);
    root.style.setProperty('--color-secondary-hover', c.secondaryHover);
    root.style.setProperty('--color-secondary-text', c.secondaryText);
    root.style.setProperty('--color-danger', c.danger);
    root.style.setProperty('--color-danger-hover', c.dangerHover);
    root.style.setProperty('--color-bg', c.bg);
    root.style.setProperty('--color-bg-secondary', c.bgSecondary);
    root.style.setProperty('--color-card', c.card);
    root.style.setProperty('--color-card-border', c.cardBorder);
    root.style.setProperty('--color-text', c.text);
    root.style.setProperty('--color-text-secondary', c.textSecondary);
    root.style.setProperty('--color-text-muted', c.textMuted);
    root.style.setProperty('--color-border', c.border);
    root.style.setProperty('--color-input-bg', c.inputBg);
    root.style.setProperty('--color-input-border', c.inputBorder);
    root.style.setProperty('--color-nav-bg', c.navBg);
    root.style.setProperty('--color-nav-border', c.navBorder);
    root.style.setProperty('--color-nav-text', c.navText);
    root.style.setProperty('--color-nav-text-active', c.navTextActive);
    root.style.setProperty('--color-nav-bg-active', c.navBgActive);
    root.style.setProperty('--color-nav-bg-hover', c.navBgHover);
    root.style.setProperty('--color-dropdown-bg', c.dropdownBg);
    root.style.setProperty('--color-dropdown-hover', c.dropdownHover);
    root.style.setProperty('--color-badge-ingreso', c.badgeIngreso);
    root.style.setProperty('--color-badge-ingreso-text', c.badgeIngresoText);
    root.style.setProperty('--color-badge-gasto', c.badgeGasto);
    root.style.setProperty('--color-badge-gasto-text', c.badgeGastoText);
    root.style.setProperty('--color-text-ingreso', c.textIngreso);
    root.style.setProperty('--color-text-gasto', c.textGasto);
    root.style.setProperty('--color-modal-overlay', c.modalOverlay);
    root.style.setProperty('--color-summary-bg', c.summaryBg);
    root.style.setProperty('--color-summary-bg-hover', c.summaryBgHover);
  };

  const setTheme = (id: ThemeId) => setThemeId(id);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
