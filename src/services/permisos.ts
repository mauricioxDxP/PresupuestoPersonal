import api from './api';
import { Categoria } from '../types/categoria';
import { Motivo } from '../types/motivo';
import { UsuarioPerfil } from '../types/perfil';

export interface UsuarioCategoriaPermiso {
  id: string;
  usuarioId: string;
  categoriaId: string;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeVer: boolean;
  puedeVerTransaccionesOtros: boolean;
  categoria?: Categoria;
}

export interface UsuarioMotivoPermiso {
  id: string;
  usuarioId: string;
  motivoId: string;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeVer: boolean;
  puedeVerTransaccionesOtros: boolean;
  motivo?: Motivo;
}

export interface UsuarioPermisosResponse {
  rol: string;
  casaIds: string[];
  casas: { id: string; nombre: string }[];
  categoriaPermisos: UsuarioCategoriaPermiso[];
  motivoPermisos: UsuarioMotivoPermiso[];
}

export interface UsuarioPermisosFullResponse extends UsuarioPermisosResponse {
  perfil?: UsuarioPerfil | null;
}

/**
 * Obtiene los permisos del usuario actual para una casa específica
 */
export async function getPermisosUsuario(casaId: string): Promise<UsuarioPermisosResponse> {
  const response = await api.get<UsuarioPermisosResponse>('/users/me/permisos', {
    params: { casaId },
  });
  return response.data;
}

/**
 * Obtiene los permisos del usuario actual incluyendo perfil asignado
 */
export async function getPermisosUsuarioFull(casaId: string): Promise<UsuarioPermisosFullResponse> {
  const [permisosResponse, perfilResponse] = await Promise.all([
    api.get<UsuarioPermisosResponse>('/users/me/permisos', {
      params: { casaId },
    }),
    api.get<UsuarioPerfil | null>(`/users/me/perfil`, {
      params: { casaId },
    }).catch(() => null),
  ]);

  return {
    ...permisosResponse.data,
    perfil: perfilResponse?.data ?? null,
  };
}

/**
 * Obtiene solo los IDs de categorías y motivos que el usuario puede VER
 * Útil para filtrar selectors en el frontend
 */
export async function getVisibleCategoriaMotivoIds(casaId: string): Promise<{
  categoriaIds: string[];
  motivoIds: string[];
  canViewOthers: boolean;
}> {
  const permisos = await getPermisosUsuario(casaId);
  
  const categoriaIds = permisos.categoriaPermisos
    .filter(p => p.puedeVer)
    .map(p => p.categoriaId);
  
  const motivoIds = permisos.motivoPermisos
    .filter(p => p.puedeVer)
    .map(p => p.motivoId);
  
  // Si alguno de los permisos no tiene puedeVerTransaccionesOtros, no puede ver otros
  const canViewOthers = permisos.categoriaPermisos
    .every(p => p.puedeVerTransaccionesOtros) && 
    permisos.motivoPermisos.every(p => p.puedeVerTransaccionesOtros);
  
  return { categoriaIds, motivoIds, canViewOthers };
}