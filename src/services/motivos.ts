import api from './api';
import type { Motivo, CreateMotivoDto, UpdateMotivoDto } from '../types';

export const motivosService = {
  async getAll(categoriaId?: string): Promise<Motivo[]> {
    const params = categoriaId ? { categoriaId } : {};
    const response = await api.get('/motivos', { params });
    return response.data;
  },

  async getById(id: string): Promise<Motivo> {
    const response = await api.get(`/motivos/${id}`);
    return response.data;
  },

  async create(data: CreateMotivoDto): Promise<Motivo> {
    const response = await api.post('/motivos', data);
    return response.data;
  },

  async update(id: string, data: UpdateMotivoDto): Promise<Motivo> {
    const response = await api.patch(`/motivos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/motivos/${id}`);
  },

  async reorder(motivos: { id: string; orden: number }[]): Promise<void> {
    await api.patch('/motivos/reorder', motivos);
  },
};
