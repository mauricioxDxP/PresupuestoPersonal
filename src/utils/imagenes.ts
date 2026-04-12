/**
 * Utilidades para procesamiento de imágenes
 */

/**
 * Comprime una imagen redimensionándola y reduciendo su calidad
 * @param file Archivo de imagen original
 * @param maxWidth Ancho máximo (default: 1920)
 * @param maxHeight Alto máximo (default: 1920)
 * @param quality Calidad de compresión JPEG (0-1, default: 0.7)
 * @returns Blob压缩ionado
 */
export async function comprimirImagen(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo aspecto
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Si es más pequeña, mantener tamaño original
      if (width > img.width) width = img.width;
      if (height > img.height) height = img.height;

      // Crear canvas y dibujar
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto 2D'));
        return;
      }

      // Fondo blanco para PNG con transparencia
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar imagen'));
    };

    img.src = url;
  });
}

/**
 * Procesa un archivo: si es imagen la comprime, si es PDF lo deja igual
 * @param file Archivo a procesar
 * @returns Blob procesado
 */
export async function procesarArchivo(file: File): Promise<{ blob: Blob; tipo: string }> {
  if (file.type.startsWith('image/')) {
    const blob = await comprimirImagen(file);
    return { blob, tipo: 'imagen' };
  } else if (file.type === 'application/pdf') {
    return { blob: file, tipo: 'pdf' };
  } else {
    // Otros tipos de archivo sin procesar
    return { blob: file, tipo: 'otro' };
  }
}

/**
 * Convierte un Blob a File con un nombre específico
 */
export function blobToFile(blob: Blob, nombre: string): File {
  return new File([blob], nombre, { type: blob.type });
}