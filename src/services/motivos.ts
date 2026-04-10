import api from './api';
import type { Motivo, CreateMotivoDto, UpdateMotivoDto } from '../types';
import { makeCacheKey, getCache, setCache, invalidateCache } from './cache';

export const motivosService = {
  async getAll(categoriaId?: string): Promise<Motivo[]> {
    const cacheKey = makeCacheKey('motivos', { categoriaId } as Record<string, unknown>);

    // Check cache first
    const cached = getCache<Motivo[]>(cacheKey);
    if (cached !== undefined) {
      this.getAllNoCache(categoriaId).then(fresh => {
        setCache(cacheKey, fresh);
      }).catch(console.error);
      return cached;
    }

    // Fetch from API
    const params = categoriaId ? { categoriaId } : {};
    const response = await api.get('/motivos', { params });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  async getAllNoCache(categoriaId?: string): Promise<Motivo[]> {
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
    // Invalidate cache after mutation
    invalidateCache('motivos');
    return response.data;
  },

  async update(id: string, data: UpdateMotivoDto): Promise<Motivo> {
    const response = await api.patch(`/motivos/${id}`, data);
    // Invalidate cache after mutation
    invalidateCache('motivos');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/motivos/${id}`);
    // Invalidate cache after mutation
    invalidateCache('motivos');
  },

  async reorder(motivos: { id: string; orden: number }[]): Promise<void> {
    await api.patch('/motivos/reorder', motivos);
    // Invalidate cache after reordering
    invalidateCache('motivos');
  },
};
