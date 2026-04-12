import api from './api';
import type { Archivo } from '../types';
import { procesarArchivo } from '../utils/imagenes';

export const archivosService = {
  async upload(file: File, transaccionId: string): Promise<Archivo> {
    // Procesar archivo (comprimir imagen si aplica)
    const { blob, tipo } = await procesarArchivo(file);

    // Generar nombre con extensión correcta
    const extension = tipo === 'imagen' ? 'jpg' : file.name.split('.').pop();
    const nombreOriginal = file.name.replace(/\.[^/.]+$/, '');
    const nombreProcesado = `${nombreOriginal}_${Date.now()}.${extension}`;

    // Convertir blob a File
    const fileProcesado = new File([blob], nombreProcesado, { type: blob.type });

    const formData = new FormData();
    formData.append('file', fileProcesado);
    formData.append('transaccionId', transaccionId);

    const response = await api.post('/archivos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadMultiple(files: File[], transaccionId: string): Promise<Archivo[]> {
    const resultados: Archivo[] = [];

    for (const file of files) {
      try {
        const archivo = await this.upload(file, transaccionId);
        resultados.push(archivo);
      } catch (error) {
        console.error(`Error al subir ${file.name}:`, error);
        // Continuar con los demás archivos
      }
    }

    return resultados;
  },

  async getAll(transaccionId?: string): Promise<Archivo[]> {
    const params = transaccionId ? { transaccionId } : {};
    const response = await api.get('/archivos', { params });
    return response.data;
  },

  async getById(id: string): Promise<Archivo> {
    const response = await api.get(`/archivos/${id}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/archivos/${id}`);
  },

  async eliminarMultiples(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  },
};
