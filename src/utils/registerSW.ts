/**
 * Registra el Service Worker para PWA.
 * Se ejecuta automáticamente al importar este módulo.
 */
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);

          // Detectar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                console.log('🔄 Nueva versión disponible. Recargando...');
                window.location.reload();
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error);
        });
    });
  }
}
