import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import api from '../services/api';

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

interface User {
  id: string;
  email: string;
  nombre: string;
}

export function PermissionsPage() {
  const { user, selectedCasaId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedMotivo, setSelectedMotivo] = useState<string>('');
  const [permisos, setPermisos] = useState({ puedeCrear: false, puedeEditar: false, puedeEliminar: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isMaestro = user?.casas?.find(c => c.id === selectedCasaId)?.rol === Rol.MAESTRO_CASA;

  useEffect(() => {
    if (isMaestro && user?.casaIds?.length) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.casaIds?.[0]) return;
    
    try {
      const [usersRes, categoriasRes, motivosRes] = await Promise.all([
        api.get(`/users?casaId=${user.casaIds[0]}`),
        api.get('/categorias'),
        api.get('/motivos'),
      ]);
      setUsers(usersRes.data.filter((u: any) => u.rol !== Rol.MAESTRO_CASA));
      setCategorias(categoriasRes.data.filter((c: any) => !c.eliminado));
      setMotivos(motivosRes.data.filter((m: any) => !m.eliminado));
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleAssignCategoriaPermiso = async () => {
    if (!selectedUser || !selectedCategoria) {
      setError('Selecciona usuario y categoría');
      return;
    }

    try {
      await api.post(`/users/${selectedUser}/permisos/categoria`, {
        categoriaId: selectedCategoria,
        ...permisos,
      });
      setSuccess('Permisos de categoría asignados');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar permisos');
      setSuccess('');
    }
  };

  const handleAssignMotivoPermiso = async () => {
    if (!selectedUser || !selectedMotivo) {
      setError('Selecciona usuario y motivo');
      return;
    }

    try {
      await api.post(`/users/${selectedUser}/permisos/motivo`, {
        motivoId: selectedMotivo,
        ...permisos,
      });
      setSuccess('Permisos de motivo asignados');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar permisos');
      setSuccess('');
    }
  };

  const filteredMotivos = selectedCategoria 
    ? motivos.filter(m => m.categoriaId === selectedCategoria)
    : [];

  if (!isMaestro) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Solo el usuario maestro puede gestionar permisos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Gestión de Permisos
      </h1>

      {error && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{ 
            backgroundColor: 'var(--color-error-bg, #fef2f2)',
            color: 'var(--color-error, #dc2626)'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{ 
            backgroundColor: 'var(--color-success-bg, #f0fdf4)',
            color: 'var(--color-success, #16a34a)'
          }}
        >
          {success}
        </div>
      )}

      <div 
        className="p-6 rounded-xl space-y-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Asignar Permisos de Categoría
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Usuario
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">Selecciona un usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Categoría
            </label>
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                setSelectedMotivo('');
              }}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeCrear}
              onChange={(e) => setPermisos({ ...permisos, puedeCrear: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Crear</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeEditar}
              onChange={(e) => setPermisos({ ...permisos, puedeEditar: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Editar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeEliminar}
              onChange={(e) => setPermisos({ ...permisos, puedeEliminar: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Eliminar</span>
          </label>
        </div>

        <button
          onClick={handleAssignCategoriaPermiso}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Asignar Permisos de Categoría
        </button>
      </div>

      <div 
        className="p-6 rounded-xl space-y-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Asignar Permisos de Motivo (Restrictivo)
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Los permisos de motivo restringen acceso a motivos específicos dentro de una categoría.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Usuario
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">Selecciona un usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Categoría
            </label>
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                setSelectedMotivo('');
              }}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Motivo
            </label>
            <select
              value={selectedMotivo}
              onChange={(e) => setSelectedMotivo(e.target.value)}
              disabled={!selectedCategoria}
              className="w-full px-4 py-2 rounded-lg border disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">Selecciona motivo</option>
              {filteredMotivos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeCrear}
              onChange={(e) => setPermisos({ ...permisos, puedeCrear: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Crear</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeEditar}
              onChange={(e) => setPermisos({ ...permisos, puedeEditar: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Editar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={permisos.puedeEliminar}
              onChange={(e) => setPermisos({ ...permisos, puedeEliminar: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text)' }}>Eliminar</span>
          </label>
        </div>

        <button
          onClick={handleAssignMotivoPermiso}
          disabled={!selectedCategoria || !selectedMotivo}
          className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Asignar Permisos de Motivo
        </button>
      </div>
    </div>
  );
}