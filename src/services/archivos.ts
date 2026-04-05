import api from './api';
import type { Archivo } from '../types';

export const archivosService = {
  async upload(file: File, transaccionId: string): Promise<Archivo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transaccionId', transaccionId);

    const response = await api.post('/archivos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
};
