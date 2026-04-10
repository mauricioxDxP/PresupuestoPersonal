import api from './api';
import type {
  Transaccion,
  CreateTransaccionDto,
  UpdateTransaccionDto,
  FiltrosTransaccion,
  Reportes,
  PaginatedResult,
} from '../types';
import { makeCacheKey, getCache, setCache, invalidateCache } from './cache';

export const transaccionesService = {
  async getAll(filtros?: FiltrosTransaccion, pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<Transaccion>> {
    // Build cache key from params
    const cacheKey = makeCacheKey('transacciones', { 
      ...filtros, 
      ...pagination 
    } as Record<string, unknown>);
    
    // Check cache first - return immediately if available
    const cached = getCache<PaginatedResult<Transaccion>>(cacheKey);
    if (cached !== undefined) {
      // Fetch fresh data in background (fire and forget)
      this.getAllNoCache(filtros, pagination)
        .then(fresh => setCache(cacheKey, fresh))
        .catch(() => { /* ignore background errors */ });
      return cached;
    }

    // Fetch from API and cache
    const response = await api.get('/transacciones', { params: { ...filtros, ...pagination } });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  // Non-cached version for explicit refresh
  async getAllNoCache(filtros?: FiltrosTransaccion, pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<Transaccion>> {
    const response = await api.get('/transacciones', { params: { ...filtros, ...pagination } });
    return response.data;
  },

  // Force refresh - bypass cache and update it
  async forceRefresh(filtros?: FiltrosTransaccion, pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<Transaccion>> {
    const cacheKey = makeCacheKey('transacciones', { 
      ...filtros, 
      ...pagination 
    } as Record<string, unknown>);
    const response = await api.get('/transacciones', { params: { ...filtros, ...pagination } });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  async getById(id: string): Promise<Transaccion> {
    const response = await api.get(`/transacciones/${id}`);
    return response.data;
  },

  async create(data: CreateTransaccionDto): Promise<Transaccion> {
    const response = await api.post('/transacciones', data);
    // Invalidate transaction caches after mutation
    invalidateCache('transacciones');
    invalidateCache('transacciones-reportes');
    invalidateCache('transacciones-reporte-mensual');
    return response.data;
  },

  async update(id: string, data: UpdateTransaccionDto): Promise<Transaccion> {
    const response = await api.patch(`/transacciones/${id}`, data);
    // Invalidate transaction caches after mutation
    invalidateCache('transacciones');
    invalidateCache('transacciones-reportes');
    invalidateCache('transacciones-reporte-mensual');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transacciones/${id}`);
    // Invalidate transaction caches after mutation
    invalidateCache('transacciones');
    invalidateCache('transacciones-reportes');
    invalidateCache('transacciones-reporte-mensual');
  },

  async getReportes(filtros?: FiltrosTransaccion): Promise<Reportes> {
    const cacheKey = makeCacheKey('transacciones-reportes filtros', filtros as Record<string, unknown>);

    // Check cache first
    const cached = getCache<Reportes>(cacheKey);
    if (cached !== undefined) {
      this.getReportesNoCache(filtros).then(fresh => {
        setCache(cacheKey, fresh);
      }).catch(console.error);
      return cached;
    }

    // Fetch and cache
    const response = await api.get('/transacciones/reportes', { params: filtros });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  async getReportesNoCache(filtros?: FiltrosTransaccion): Promise<Reportes> {
    const response = await api.get('/transacciones/reportes', { params: filtros });
    return response.data;
  },

  async getReporteMensual(anio: number, mes: number) {
    const cacheKey = makeCacheKey('transacciones-reporte-mensual', { anio, mes });

    // Check cache first
    const cached = getCache(cacheKey);
    if (cached !== undefined) {
      this.getReporteMensualNoCache(anio, mes).then(fresh => {
        setCache(cacheKey, fresh);
      }).catch(console.error);
      return cached;
    }

    // Fetch and cache
    const response = await api.get('/transacciones/reporte-mensual', {
      params: { anio, mes },
    });
    const data = response.data;
    setCache(cacheKey, data);
    return data;
  },

  async getReporteMensualNoCache(anio: number, mes: number) {
    const response = await api.get('/transacciones/reporte-mensual', {
      params: { anio, mes },
    });
    return response.data;
  },
};
