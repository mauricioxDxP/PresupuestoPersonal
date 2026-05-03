import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import api from '../services/api';
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
  }>;
  motivoPermisos?: Array<{
    id: string;
    motivo: { id: string; nombre: string; categoriaId: string };
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
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
  const [permisosCategoria, setPermisosCategoria] = useState<{[catId: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}}>({});
  const [permisosMotivo, setPermisosMotivo] = useState<{[motivoId: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}}>({});
  const [successMsg, setSuccessMsg] = useState('');

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

    // Load current permisos into state
    const catPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}} = {};
    (u.categoriaPermisos || []).forEach(cp => {
      catPerm[cp.categoria.id] = {
        puedeCrear: cp.puedeCrear,
        puedeEditar: cp.puedeEditar,
        puedeEliminar: cp.puedeEliminar,
      };
    });
    setPermisosCategoria(catPerm);

    const motPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}} = {};
    (u.motivoPermisos || []).forEach(mp => {
      motPerm[mp.motivo.id] = {
        puedeCrear: mp.puedeCrear,
        puedeEditar: mp.puedeEditar,
        puedeEliminar: mp.puedeEliminar,
      };
    });
    setPermisosMotivo(motPerm);

    await loadCategoriasYMotivos();
    setLoadingPermisos(false);
  };

  const togglePermisoCategoria = (catId: string, tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar') => {
    setPermisosCategoria(prev => ({
      ...prev,
      [catId]: {
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        ...(prev[catId] || {}),
        [tipo]: !prev[catId]?.[tipo],
      },
    }));
  };

  const togglePermisoMotivo = (motivoId: string, tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar') => {
    setPermisosMotivo(prev => ({
      ...prev,
      [motivoId]: {
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
        ...(prev[motivoId] || {}),
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

              {/* Permisos de Categoría */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Permisos por Categoría
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const newPermisos: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}} = {};
                        categorias.forEach(cat => {
                          newPermisos[cat.id] = { puedeCrear: true, puedeEditar: true, puedeEliminar: true };
                        });
                        setPermisosCategoria(newPermisos);
                      }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermisosCategoria({})}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Limpiar todos
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Categoría</th>
                        <th className="text-center p-3 font-medium w-20" style={{ color: 'var(--color-text-muted)' }}>Crear</th>
                        <th className="text-center p-3 font-medium w-20" style={{ color: 'var(--color-text-muted)' }}>Editar</th>
                        <th className="text-center p-3 font-medium w-20" style={{ color: 'var(--color-text-muted)' }}>Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map(cat => {
                        const p = permisosCategoria[cat.id] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false };
                        return (
                          <tr 
                            key={cat.id}
                            className="border-t"
                            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                          >
                            <td className="p-3" style={{ color: 'var(--color-text)' }}>{cat.nombre}</td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.puedeCrear}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeCrear')}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.puedeEditar}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeEditar')}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.puedeEliminar}
                                onChange={() => togglePermisoCategoria(cat.id, 'puedeEliminar')}
                                className="w-4 h-4"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Permisos de Motivo */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Permisos por Motivo (Restrictivo)
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const newPermisos: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean}} = {};
                        motivos.forEach(mot => {
                          newPermisos[mot.id] = { puedeCrear: true, puedeEditar: true, puedeEliminar: true };
                        });
                        setPermisosMotivo(newPermisos);
                      }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermisosMotivo({})}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Limpiar todos
                    </button>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Los permisos de motivo restringen acceso a motivos específicos dentro de una categoría.
                </p>
                <div className="space-y-3">
                  {categorias.map(cat => {
                    const catMotivos = motivos.filter(m => m.categoriaId === cat.id);
                    if (catMotivos.length === 0) return null;
                    return (
                      <div key={cat.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="font-medium p-3" style={{ color: 'var(--color-text)', backgroundColor: 'var(--color-surface)' }}>{cat.nombre}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ borderColor: 'var(--color-border)' }}>
                                <th className="text-left p-2 pl-4 font-medium text-xs" style={{ color: 'var(--color-text-muted)' }}>Motivo</th>
                                <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Crear</th>
                                <th className="text-center p-2 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Editar</th>
                                <th className="text-center p-2 pr-4 font-medium w-16 text-xs" style={{ color: 'var(--color-text-muted)' }}>Eliminar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catMotivos.map(mot => {
                                const p = permisosMotivo[mot.id] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false };
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
                                        checked={p.puedeCrear}
                                        onChange={() => togglePermisoMotivo(mot.id, 'puedeCrear')}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={p.puedeEditar}
                                        onChange={() => togglePermisoMotivo(mot.id, 'puedeEditar')}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                    <td className="p-2 pr-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={p.puedeEliminar}
                                        onChange={() => togglePermisoMotivo(mot.id, 'puedeEliminar')}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
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