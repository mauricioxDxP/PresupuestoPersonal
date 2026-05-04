import { Categoria } from './categoria';
import { Motivo } from './motivo';

// Perfil de Permisos types
export interface PerfilCategoriaPermiso {
  id: string;
  perfilId: string;
  categoriaId: string;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeVer: boolean;
  puedeVerTransaccionesOtros: boolean;
  categoria?: Categoria;
}

export interface PerfilMotivoPermiso {
  id: string;
  perfilId: string;
  motivoId: string;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeVer: boolean;
  puedeVerTransaccionesOtros: boolean;
  motivo?: Motivo;
}

export interface Perfil {
  id: string;
  nombre: string;
  descripcion?: string;
  casaId: string;
  createdAt: string;
  updatedAt: string;
  categoriaPermisos: PerfilCategoriaPermiso[];
  motivoPermisos: PerfilMotivoPermiso[];
  usuarios?: { id: string; nombre: string; email: string }[];
}

export interface UsuarioPerfil {
  id: string;
  usuarioId: string;
  perfilId: string;
  casaId: string;
  createdAt: string;
  perfil: Perfil;
  casa: { id: string; nombre: string };
}

// DTOs for creating/updating
export interface CreatePerfilDto {
  nombre: string;
  descripcion?: string;
  casaId: string;
}

export interface UpdatePerfilDto {
  nombre?: string;
  descripcion?: string;
}

export interface AssignPerfilPermisoDto {
  categoriaId?: string;
  motivoId?: string;
  puedeCrear?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  puedeVer?: boolean;
  puedeVerTransaccionesOtros?: boolean;
}

export interface AssignPerfilDto {
  perfilId: string;
  casaId: string;
}