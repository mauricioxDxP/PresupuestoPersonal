export interface Categoria {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  tipo: 'ingreso' | 'gasto';
}

export interface UpdateCategoriaDto {
  nombre?: string;
  tipo?: 'ingreso' | 'gasto';
}
