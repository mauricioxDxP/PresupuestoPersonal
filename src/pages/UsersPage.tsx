import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import api from '../services/api';
import { getPerfis, assignUserPerfil, removeUserPerfil, getUserPerfil } from '../services/perfis';
import { Perfil } from '../types/perfil';
import { FormModal } from '../components/UI';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  createdAt: string;
  categoriaPermisos?: Array<{
    id: string;
    categoria: { id: string; nombre: string };
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeVer: boolean;
    puedeVerTransaccionesOtros: boolean;
  }>;
  motivoPermisos?: Array<{
    id: string;
    motivo: { id: string; nombre: string; categoriaId: string };
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeVer: boolean;
    puedeVerTransaccionesOtros: boolean;
  }>;
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
}

interface Motivo {
  id: string;
  nombre: string;
  categoriaId: string;
}

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', nombre: '' });
  const [error, setError] = useState('');

  // Permisos modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  // Permisos editing state
  const [permisosCategoria, setPermisosCategoria] = useState<{[catId: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}}>({});
  const [permisosMotivo, setPermisosMotivo] = useState<{[motivoId: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}}>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Perfil state
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [selectedPerfilId, setSelectedPerfilId] = useState<string | null>(null);
  const [userPerfil, setUserPerfil] = useState<{ perfil: Perfil; casa: { id: string; nombre: string } } | null>(null);

  const isMaestro = user?.rol === Rol.MAESTRO_CASA;

  useEffect(() => {
    if (isMaestro && user?.casaIds?.length) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    if (!user?.casaIds?.[0]) return;
    
    try {
      const response = await api.get(`/users?casaId=${user.casaIds[0]}`);
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoriasYMotivos = async () => {
    const [catRes, motRes] = await Promise.all([
      api.get('/categorias'),
      api.get('/motivos'),
    ]);
    setCategorias(catRes.data.filter((c: any) => !c.eliminado));
    setMotivos(motRes.data.filter((m: any) => !m.eliminado));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post(`/users?casaId=${user?.casaIds?.[0]}`, {
        ...newUser,
      });
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', nombre: '' });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const openPermisosModal = async (u: User) => {
    setSelectedUser(u);
    setShowPermisosModal(true);
    setLoadingPermisos(true);
    setSuccessMsg('');
    setSelectedPerfilId(null);
    setUserPerfil(null);

    // Load current permisos into state
    const catPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
    (u.categoriaPermisos || []).forEach(cp => {
      catPerm[cp.categoria.id] = {
        puedeCrear: cp.puedeCrear,
        puedeEditar: cp.puedeEditar,
        puedeEliminar: cp.puedeEliminar,
        puedeVer: cp.puedeVer,
        puedeVerTransaccionesOtros: cp.puedeVerTransaccionesOtros,
      };
    });
    setPermisosCategoria(catPerm);

    const motPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
    (u.motivoPermisos || []).forEach(mp => {
      motPerm[mp.motivo.id] = {
        puedeCrear: mp.puedeCrear,
        puedeEditar: mp.puedeEditar,
        puedeEliminar: mp.puedeEliminar,
        puedeVer: mp.puedeVer,
        puedeVerTransaccionesOtros: mp.puedeVerTransaccionesOtros,
      };
    });
    setPermisosMotivo(motPerm);

    // Load perfis and current user perfil assignment
    const casaId = user?.casaIds?.[0];
    if (casaId) {
      try {
        const [perfisData, perfilData] = await Promise.all([
          getPerfis(casaId),
          getUserPerfil(u.id, casaId),
        ]);
        setPerfis(perfisData);
        if (perfilData) {
          setUserPerfil(perfilData);
          setSelectedPerfilId(perfilData.perfil.id);
        }
      } catch (err) {
        console.error('Error loading perfis:', err);
      }
    }

    await loadCategoriasYMotivos();
    setLoadingPermisos(false);
  };

  const togglePermisoCategoria = (catId: string, tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar' | 'puedeVer' | 'puedeVerTransaccionesOtros') => {
    setPermisosCategoria(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {}),
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        puedeVer: false,
        puedeVerTransaccionesOtros: false,
        [tipo]: !prev[catId]?.[tipo],
      },
    }));
  };

  const togglePermisoMotivo = (motivoId: string, tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar' | 'puedeVer' | 'puedeVerTransaccionesOtros') => {
    setPermisosMotivo(prev => ({
      ...prev,
      [motivoId]: {
        ...(prev[motivoId] || {}),
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        puedeVer: false,
        puedeVerTransaccionesOtros: false,
        [tipo]: !prev[motivoId]?.[tipo],
      },
    }));
  };

  const savePermisos = async () => {
    if (!selectedUser) return;
    setSuccessMsg('');

    try {
      // Save categoria permisos
      for (const [catId, perms] of Object.entries(permisosCategoria)) {
        await api.post(`/users/${selectedUser.id}/permisos/categoria`, {
          categoriaId: catId,
          ...perms,
        });
      }

      // Save motivo permisos
      for (const [motivoId, perms] of Object.entries(permisosMotivo)) {
        await api.post(`/users/${selectedUser.id}/permisos/motivo`, {
          motivoId,
          ...perms,
        });
      }

      setSuccessMsg('Permisos guardados correctamente');
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar permisos');
    }
  };

  const handleAssignPerfil = async () => {
    if (!selectedUser || !selectedPerfilId || !user?.casaIds?.[0]) return;
    
    try {
      const result = await assignUserPerfil(selectedUser.id, {
        perfilId: selectedPerfilId,
        casaId: user.casaIds[0],
      });
      setUserPerfil(result);
      setSuccessMsg('Perfil asignado correctamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al asignar perfil');
    }
  };

  const handleRemovePerfil = async () => {
    if (!selectedUser || !user?.casaIds?.[0]) return;
    
    try {
      await removeUserPerfil(selectedUser.id, user.casaIds[0]);
      setUserPerfil(null);
      setSelectedPerfilId(null);
      setSuccessMsg('Perfil removido correctamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al remover perfil');
    }
  };

  if (!isMaestro) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Solo el usuario maestro puede gestionar usuarios.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Gestión de Usuarios
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Cargando...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr 
                className="text-left text-sm"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '2px solid var(--color-border)'
                }}
              >
                <th className="p-3" style={{ color: 'var(--color-text-muted)' }}>Nombre</th>
                <th className="p-3" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                <th className="p-3" style={{ color: 'var(--color-text-muted)' }}>Rol</th>
                <th className="p-3" style={{ color: 'var(--color-text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr 
                  key={u.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="p-3" style={{ color: 'var(--color-text)' }}>{u.nombre}</td>
                  <td className="p-3" style={{ color: 'var(--color-text)' }}>{u.email}</td>
                  <td className="p-3">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: u.rol === Rol.MAESTRO_CASA ? 'var(--color-primary-bg)' : 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                    >
                      {u.rol === Rol.MAESTRO_CASA ? 'Maestro' : 'Usuario'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {u.rol !== Rol.MAESTRO_CASA && (
                        <>
                          <button
                            onClick={() => openPermisosModal(u)}
                            className="text-sm px-3 py-1 rounded border"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          >
                            Permisos
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-sm px-3 py-1 rounded"
                            style={{ color: 'var(--color-error, #dc2626)' }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <FormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nuevo Usuario"
        >
          {error && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'var(--color-error-bg, #fef2f2)',
                color: 'var(--color-error, #dc2626)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nombre
              </label>
              <input
                type="text"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Email
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 px-4 rounded-lg font-medium border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Crear
              </button>
            </div>
          </form>
        </FormModal>
      )}

{/* Permisos Modal */}
      {showPermisosModal && selectedUser && (
        <FormModal
          isOpen={showPermisosModal}
          onClose={() => setShowPermisosModal(false)}
          title={`Permisos de ${selectedUser.nombre}`}
        >
          {loadingPermisos ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              Cargando...
            </div>
          ) : (
            <>
              {successMsg && (
                <div 
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: 'var(--color-success-bg, #f0fdf4)',
                    color: 'var(--color-success, #16a34a)'
                  }}
                >
                  {successMsg}
                </div>
              )}

              {/* Perfil de Permisos Section */}
              <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Perfil de Permisos
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Asigna un perfil para establecer permisos rápidamente. Los permisos individuales se usan como respaldo si no hay perfil asignado.
                </p>
                
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Perfil
                    </label>
                    <select
                      value={selectedPerfilId || ''}
                      onChange={(e) => setSelectedPerfilId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--color-bg)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)'
                      }}
                    >
                      <option value="">Sin perfil (permisos individuales)</option>
                      {perfis.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedPerfilId && (
                    <button
                      type="button"
                      onClick={handleAssignPerfil}
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                    >
                      {userPerfil ? 'Cambiar Perfil' : 'Asignar Perfil'}
                    </button>
                  )}
                  
                  {userPerfil && (
                    <button
                      type="button"
                      onClick={handleRemovePerfil}
                      className="px-4 py-2 rounded-lg font-medium border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-error, #dc2626)' }}
                    >
                      Remover Perfil
                    </button>
                  )}
                </div>

                {userPerfil && (
                  <div className="mt-3 p-3 rounded border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <div className="text-sm">
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {userPerfil.perfil.nombre}
                      </span>
                      {userPerfil.perfil.descripcion && (
                        <span style={{ color: 'var(--color-text-muted)' }}> — {userPerfil.perfil.descripcion}</span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {userPerfil.perfil.categoriaPermisos.length} permisos de categoría, {userPerfil.perfil.motivoPermisos.length} permisos de motivo
                    </div>
                  </div>
                )}
              </div>

              {/* Permisos unificados: Categoría + Motivo */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Permisos
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        // Seleccionar todos para TODOS los motivos y categorias
                        const newPermisosMotivo: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
                        motivos.forEach(mot => {
                          newPermisosMotivo[mot.id] = { puedeCrear: true, puedeEditar: true, puedeEliminar: true, puedeVer: true, puedeVerTransaccionesOtros: true };
                        });
                        setPermisosMotivo(newPermisosMotivo);
                        const newPermisosCat: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
                        categorias.forEach(cat => {
                          newPermisosCat[cat.id] = { puedeCrear: true, puedeEditar: true, puedeEliminar: true, puedeVer: true, puedeVerTransaccionesOtros: true };
                        });
                        setPermisosCategoria(newPermisosCat);
                      }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPermisosMotivo({});
                        setPermisosCategoria({});
                      }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Limpiar todos
                    </button>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  La primera fila de cada tabla muestra los permisos de categoría (aplican a todos sus motivos).
                </p>
                <div className="space-y-4">
                  {categorias.map(cat => {
                    const catMotivos = motivos.filter(m => m.categoriaId === cat.id);
                    if (catMotivos.length === 0) return null;
                    const pCat = permisosCategoria[cat.id] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false };
                    return (
                      <div key={cat.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="p-3 flex flex-wrap items-center gap-4" style={{ backgroundColor: 'var(--color-surface)' }}>
                          <span className="font-medium" style={{ color: 'var(--color-text)' }}>{cat.nombre}</span>
                          <div className="flex gap-3 text-xs items-center flex-wrap">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pCat.puedeVer}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeVer')}
                                className="w-4 h-4"
                              />
                              <span style={{ color: 'var(--color-text-muted)' }}>Ver</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pCat.puedeCrear}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeCrear')}
                                className="w-4 h-4"
                              />
                              <span style={{ color: 'var(--color-text-muted)' }}>Crear</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pCat.puedeEditar}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeEditar')}
                                className="w-4 h-4"
                              />
                              <span style={{ color: 'var(--color-text-muted)' }}>Editar</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pCat.puedeEliminar}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeEliminar')}
                                className="w-4 h-4"
                              />
                              <span style={{ color: 'var(--color-text-muted)' }}>Eliminar</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pCat.puedeVerTransaccionesOtros}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeVerTransaccionesOtros')}
                                className="w-4 h-4"
                              />
                              <span style={{ color: 'var(--color-text-muted)' }}>Ver Otros</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newPermisosMotivo = { ...permisosMotivo };
                              catMotivos.forEach(mot => {
                                newPermisosMotivo[mot.id] = { puedeCrear: true, puedeEditar: true, puedeEliminar: true, puedeVer: true, puedeVerTransaccionesOtros: true };
                              });
                              setPermisosMotivo(newPermisosMotivo);
                              setPermisosCategoria(prev => ({
                                ...prev,
                                [cat.id]: { puedeCrear: true, puedeEditar: true, puedeEliminar: true, puedeVer: true, puedeVerTransaccionesOtros: true },
                              }));
                            }}
                            className="px-2 py-1 rounded border text-xs"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                          >
                            Seleccionar todos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newPermisosMotivo = { ...permisosMotivo };
                              catMotivos.forEach(mot => {
                                newPermisosMotivo[mot.id] = { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false };
                              });
                              setPermisosMotivo(newPermisosMotivo);
                              setPermisosCategoria(prev => ({
                                ...prev,
                                [cat.id]: { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false },
                              }));
                            }}
                            className="px-2 py-1 rounded border text-xs"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                          >
                            Limpiar todos
                          </button>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderColor: 'var(--color-border)' }}>
                              <th className="text-left p-2 pl-4 font-medium text-xs" style={{ color: 'var(--color-text-muted)' }}>Motivo</th>
                              <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Ver</th>
                              <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Crear</th>
                              <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Editar</th>
                              <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Eliminar</th>
                              <th className="text-center p-2 pr-4 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Ver Otros</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catMotivos.map(mot => {
                              const pMot = permisosMotivo[mot.id] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false };
                              return (
                                <tr 
                                  key={mot.id}
                                  className="border-t"
                                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                                >
                                  <td className="p-2 pl-4" style={{ color: 'var(--color-text-muted)' }}>{mot.nombre}</td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={pMot.puedeVer}
                                      onChange={() => togglePermisoMotivo(mot.id, 'puedeVer')}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={pMot.puedeCrear}
                                      onChange={() => togglePermisoMotivo(mot.id, 'puedeCrear')}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={pMot.puedeEditar}
                                      onChange={() => togglePermisoMotivo(mot.id, 'puedeEditar')}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={pMot.puedeEliminar}
                                      onChange={() => togglePermisoMotivo(mot.id, 'puedeEliminar')}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                  <td className="p-2 pr-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={pMot.puedeVerTransaccionesOtros}
                                      onChange={() => togglePermisoMotivo(mot.id, 'puedeVerTransaccionesOtros')}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPermisosModal(false)}
                  className="flex-1 py-2 px-4 rounded-lg font-medium border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cerrar
                </button>
                <button
                  onClick={savePermisos}
                  className="flex-1 py-2 px-4 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  Guardar Permisos
                </button>
              </div>
            </>
          )}
        </FormModal>
      )}
    </div>
  );
}