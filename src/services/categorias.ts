import api from './api';
import type { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../types';

export const categoriasService = {
  async getAll(tipo?: string): Promise<Categoria[]> {
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
    return response.data;
  },

  async update(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const response = await api.patch(`/categorias/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },
};
