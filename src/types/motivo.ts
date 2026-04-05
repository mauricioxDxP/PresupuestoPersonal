import type { Categoria } from './categoria';

export interface Motivo {
  id: string;
  nombre: string;
  categoriaId: string;
  mostrarSinTransacciones: boolean;
  orden: number;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
}

export interface CreateMotivoDto {
  nombre: string;
  categoriaId: string;
  mostrarSinTransacciones?: boolean;
  orden?: number;
}

export interface UpdateMotivoDto {
  nombre?: string;
  categoriaId?: string;
  mostrarSinTransacciones?: boolean;
  orden?: number;
}
