import api from './api';
import type {
  Transaccion,
  CreateTransaccionDto,
  UpdateTransaccionDto,
  FiltrosTransaccion,
  Reportes,
  PaginatedResult,
} from '../types';

export const transaccionesService = {
  async getAll(filtros?: FiltrosTransaccion, pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<Transaccion>> {
    const response = await api.get('/transacciones', { params: { ...filtros, ...pagination } });
    return response.data;
  },

  async getById(id: string): Promise<Transaccion> {
    const response = await api.get(`/transacciones/${id}`);
    return response.data;
  },

  async create(data: CreateTransaccionDto): Promise<Transaccion> {
    const response = await api.post('/transacciones', data);
    return response.data;
  },

  async update(id: string, data: UpdateTransaccionDto): Promise<Transaccion> {
    const response = await api.patch(`/transacciones/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transacciones/${id}`);
  },

  async getReportes(filtros?: FiltrosTransaccion): Promise<Reportes> {
    const response = await api.get('/transacciones/reportes', { params: filtros });
    return response.data;
  },

  async getReporteMensual(anio: number, mes: number) {
    const response = await api.get('/transacciones/reporte-mensual', {
      params: { anio, mes },
    });
    return response.data;
  },
};
