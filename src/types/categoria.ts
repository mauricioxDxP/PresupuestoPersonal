export interface Categoria {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  orden: number;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  // Permisos del usuario actual sobre esta categoría (para filtros UI)
  puedeVer?: boolean;
  puedeVerTransaccionesOtros?: boolean;
}

export interface CreateCategoriaDto {
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  orden?: number;
}

export interface UpdateCategoriaDto {
  nombre?: string;
  tipo?: 'ingreso' | 'gasto';
  orden?: number;
}
