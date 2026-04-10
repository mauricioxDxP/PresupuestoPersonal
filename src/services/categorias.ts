import api from './api';
import type { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../types';
import { makeCacheKey, getCache, setCache, invalidateCache } from './cache';

export const categoriasService = {
  async getAll(tipo?: string): Promise<Categoria[]> {
    const cacheKey = makeCacheKey('categorias', { tipo } as Record<string, unknown>);

    // Check cache first
    const cached = getCache<Categoria[]>(cacheKey);
    if (cached !== undefined) {
      // Fetch fresh data in background
      this.getAllNoCache(tipo).then(fresh => {
        setCache(cacheKey, fresh);
      }).catch(console.error);
      return cached;
    }

    // Fetch from API
    const params = tipo ? { tipo } : {};
    const response = await api.get('/categorias', { params });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  async getAllNoCache(tipo?: string): Promise<Categoria[]> {
    const params = tipo ? { tipo } : {};
    const response = await api.get('/categorias', { params });
    return response.data;
  },

  async getById(id: string): Promise<Categoria> {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  async create(data: CreateCategoriaDto): Promise<Categoria> {
    const response = await api.post('/categorias', data);
    // Invalidate cache after mutation
    invalidateCache('categorias');
    return response.data;
  },

  async update(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const response = await api.patch(`/categorias/${id}`, data);
    // Invalidate cache after mutation
    invalidateCache('categorias');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
    // Invalidate cache after mutation
    invalidateCache('categorias');
  },
};
