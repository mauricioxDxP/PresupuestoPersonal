import { Link } from 'react-router-dom';

export function RegisterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--color-bg)' }}>
      <div 
        className="w-full max-w-md p-6 sm:p-8 rounded-xl shadow-lg text-center"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="text-6xl mb-4">✅</div>
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--color-primary)' }}
        >
          ¡Registro exitoso!
        </h1>
        <p className="mb-6" style={{ color: 'var(--color-text)' }}>
          Tu cuenta ha sido creada. Un administrador te asignará a una casa para que puedas comenzar a usarla.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Recibirás una notificación cuando estés asignado a una casa.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Ir al Login
        </Link>
      </div>
    </div>
  );
}