import api from './api';
import { Perfil, CreatePerfilDto, UpdatePerfilDto, AssignPerfilPermisoDto, AssignPerfilDto, UsuarioPerfil } from '../types/perfil';

/**
 * Obtiene todos los perfiles de permisos para una casa
 */
export async function getPerfis(casaId: string): Promise<Perfil[]> {
  const response = await api.get<Perfil[]>('/perfis', {
    params: { casaId },
  });
  return response.data;
}

/**
 * Obtiene un perfil específico por ID
 */
export async function getPerfil(id: string): Promise<Perfil> {
  const response = await api.get<Perfil>(`/perfis/${id}`);
  return response.data;
}

/**
 * Crea un nuevo perfil de permisos
 */
export async function createPerfil(data: CreatePerfilDto): Promise<Perfil> {
  const response = await api.post<Perfil>('/perfis', data);
  return response.data;
}

/**
 * Actualiza un perfil existente
 */
export async function updatePerfil(id: string, data: UpdatePerfilDto): Promise<Perfil> {
  const response = await api.patch<Perfil>(`/perfis/${id}`, data);
  return response.data;
}

/**
 * Elimina un perfil de permisos
 */
export async function deletePerfil(id: string): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/perfis/${id}`);
  return response.data;
}

/**
 * Clona un perfil existente
 */
export async function clonePerfil(id: string): Promise<Perfil> {
  const response = await api.post<Perfil>(`/perfis/${id}/clone`);
  return response.data;
}

/**
 * Asigna permiso de categoría a un perfil
 */
export async function assignPerfilCategoriaPermiso(
  perfilId: string,
  data: AssignPerfilPermisoDto
): Promise<Perfil> {
  const response = await api.post<Perfil>(`/perfis/${perfilId}/permisos/categoria`, data);
  return response.data;
}

/**
 * Asigna permiso de motivo a un perfil
 */
export async function assignPerfilMotivoPermiso(
  perfilId: string,
  data: AssignPerfilPermisoDto
): Promise<Perfil> {
  const response = await api.post<Perfil>(`/perfis/${perfilId}/permisos/motivo`, data);
  return response.data;
}

// ============================================
// User Profile Assignment (in UsersService territory)
// ============================================

/**
 * Asigna un perfil de permisos a un usuario para una casa específica
 */
export async function assignUserPerfil(usuarioId: string, data: AssignPerfilDto): Promise<UsuarioPerfil> {
  const response = await api.post<UsuarioPerfil>(`/users/${usuarioId}/perfil`, data);
  return response.data;
}

/**
 * Obtiene el perfil asignado a un usuario para una casa específica
 */
export async function getUserPerfil(usuarioId: string, casaId: string): Promise<UsuarioPerfil | null> {
  try {
    const response = await api.get<UsuarioPerfil>(`/users/${usuarioId}/perfil`, {
      params: { casaId },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Remueve el perfil asignado a un usuario para una casa específica
 */
export async function removeUserPerfil(usuarioId: string, casaId: string): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/users/${usuarioId}/perfil`, {
    params: { casaId },
  });
  return response.data;
}