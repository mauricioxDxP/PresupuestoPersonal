import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import api from '../services/api';

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
    motivo: { id: string; nombre: string };
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  }>;
}

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', nombre: '' });
  const [error, setError] = useState('');

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
    <div className="space-y-6">
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
                    {u.rol !== Rol.MAESTRO_CASA && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-sm px-3 py-1 rounded"
                        style={{ color: 'var(--color-error, #dc2626)' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div 
            className="w-full max-w-md p-6 rounded-xl shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Nuevo Usuario
            </h2>

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
          </div>
        </div>
      )}
    </div>
  );
}