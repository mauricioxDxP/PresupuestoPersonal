import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2.5 rounded font-medium transition-all text-sm sm:text-base active:scale-95';

  const styleOverrides: React.CSSProperties = {
    ...(variant === 'primary' && {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-primary-text)',
    }),
    ...(variant === 'secondary' && {
      backgroundColor: 'var(--color-secondary)',
      color: 'var(--color-secondary-text)',
    }),
    ...(variant === 'danger' && {
      backgroundColor: 'var(--color-danger)',
      color: 'var(--color-primary-text)',
    }),
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary-hover)';
    } else if (variant === 'secondary') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-secondary-hover)';
    } else if (variant === 'danger') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-danger-hover)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)';
    } else if (variant === 'secondary') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-secondary)';
    } else if (variant === 'danger') {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-danger)';
    }
  };

  return (
    <button
      className={`${baseStyles} ${className}`}
      style={styleOverrides}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded ${className}`}
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: error ? 'var(--color-danger)' : 'var(--color-input-border)',
          color: 'var(--color-text)',
        }}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>}
      <select
        className={`w-full px-3 py-2 border rounded ${className}`}
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: 'var(--color-input-border)',
          color: 'var(--color-text)',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
  return (
    <div
      className={`rounded-lg shadow p-4 ${className}`}
      style={{
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-card-border)`,
      }}
    >
      {title && (
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile: full screen sheet that slides up */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 top-16 flex flex-col rounded-t-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="flex justify-between items-center px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold truncate pr-4" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none shrink-0 p-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>
        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div
        className="hidden sm:block rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
    </div>
  );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div
      className="border px-4 py-3 rounded"
      style={{
        backgroundColor: 'var(--color-badge-gasto)',
        borderColor: 'var(--color-danger)',
        color: 'var(--color-badge-gasto-text)',
      }}
    >
      {message}
    </div>
  );
};
