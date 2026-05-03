import type { Categoria } from './categoria';
import type { Motivo } from './motivo';

export interface Archivo {
  id: string;
  tipo: string;
  nombre: string;
  url: string;
  transaccionId: string;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioMini {
  id: string;
  nombre: string;
  email: string;
}

export interface TransaccionHistorial {
  id: string;
  transaccionId: string;
  accion: 'CREAR' | 'MODIFICAR' | 'ELIMINAR';
  usuarioId: string;
  fecha: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  usuario?: UsuarioMini;
}

export interface Transaccion {
  id: string;
  motivoId: string;
  categoriaId: string;
  monto: number;
  fecha: string;
  descripcion?: string;
  facturable: boolean;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  motivo?: Motivo;
  categoria?: Categoria;
  archivos?: Archivo[];
  usuario?: UsuarioMini;
  usuarioId: string;
}

export interface CreateTransaccionDto {
  motivoId: string;
  categoriaId: string;
  monto: number;
  fecha: string;
  descripcion?: string;
  facturable?: boolean;
}

export interface UpdateTransaccionDto {
  motivoId?: string;
  categoriaId?: string;
  monto?: number;
  fecha?: string;
  descripcion?: string;
  facturable?: boolean;
}

export interface FiltrosTransaccion {
  fechaInicio?: string;
  fechaFin?: string;
  categoriaId?: string;
  motivoId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Reportes {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  porCategoria: {
    nombre: string;
    tipo: string;
    total: number;
  }[];
}
