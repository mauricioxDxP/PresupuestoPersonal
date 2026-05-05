/**
 * Registra el Service Worker para PWA.
 * Expone una función global para actualizar manualmente.
 */
let swRegistration: ServiceWorkerRegistration | null = null;

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          swRegistration = registration;

          // Detectar actualizaciones y aplicar automáticamente en móvil
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible - aplicar automáticamente sin preguntar
                console.log('🔄 Nueva versión disponible. Actualizando...');
                newWorker.postMessage('skipWaiting');
                // Pequeño delay para que el SW se actualice
                setTimeout(() => {
                  window.location.reload();
                }, 500);
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

/**
 * Fuerza la actualización del Service Worker.
 * Retorna true si hay una actualización disponible.
 */
export async function updateSW(): Promise<boolean> {
  if (!swRegistration) {
    console.warn('⚠️ Service Worker no registrado');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return false;

    await registration.update();

    // Esperar un momento para ver si hay un nuevo worker instalándose
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (registration.installing || registration.waiting) {
      console.log('🔄 Actualización descargada. Recargando...');
      window.location.reload();
      return true;
    }

    console.log('✅ Ya estás en la última versión');
    return false;
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
    return false;
  }
}

