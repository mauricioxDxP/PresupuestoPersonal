import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import { getPerfis, createPerfil, updatePerfil, deletePerfil, clonePerfil } from '../services/perfis';
import { FormModal } from '../components/UI';
import { Perfil } from '../types/perfil';
import { PerfilPermisosEditor } from '../components/PerfilPermisosEditor';

export function PerfisPage() {
  const { user, selectedCasaId } = useAuth();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);
  const [newPerfil, setNewPerfil] = useState({ nombre: '', descripcion: '' });
  const [editPerfil, setEditPerfil] = useState({ nombre: '', descripcion: '' });
  const [error, setError] = useState('');

  const isMaestro = user?.casas?.find(c => c.id === selectedCasaId)?.rol === Rol.MAESTRO_CASA;

  useEffect(() => {
    if (isMaestro && user?.casaIds?.[0]) {
      loadPerfis();
    }
  }, [user]);

  const loadPerfis = async () => {
    if (!user?.casaIds?.[0]) return;
    
    try {
      const data = await getPerfis(user.casaIds[0]);
      setPerfis(data);
    } catch (err) {
      console.error('Error loading perfis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await createPerfil({
        nombre: newPerfil.nombre,
        descripcion: newPerfil.descripcion,
        casaId: user!.casaIds![0],
      });
      setShowCreateModal(false);
      setNewPerfil({ nombre: '', descripcion: '' });
      await loadPerfis();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear perfil');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerfil) return;
    setError('');

    try {
      await updatePerfil(selectedPerfil.id, {
        nombre: editPerfil.nombre,
        descripcion: editPerfil.descripcion,
      });
      setShowEditModal(false);
      setSelectedPerfil(null);
      await loadPerfis();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar perfil');
    }
  };

  const handleDelete = async (perfil: Perfil) => {
    if (!confirm(`¿Eliminar el perfil "${perfil.nombre}"? Los usuarios asignados perderán sus permisos.`)) return;
    
    try {
      await deletePerfil(perfil.id);
      await loadPerfis();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar perfil');
    }
  };

  const handleClone = async (perfil: Perfil) => {
    try {
      await clonePerfil(perfil.id);
      await loadPerfis();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al clonar perfil');
    }
  };

  const openEditModal = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setEditPerfil({ nombre: perfil.nombre, descripcion: perfil.descripcion || '' });
    setShowEditModal(true);
  };

  if (!isMaestro) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Solo el usuario maestro puede gestionar perfiles de permisos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Perfiles de Permisos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Agrupa permisos para asignarlos fácilmente a usuarios
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          + Nuevo Perfil
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Cargando...
        </div>
      ) : perfis.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <p>No hay perfiles creados.</p>
          <p className="text-sm mt-1">Crea tu primer perfil para agrupar permisos.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {perfis.map(perfil => (
            <div
              key={perfil.id}
              className="border rounded-lg p-4"
              style={{ 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                    {perfil.nombre}
                  </h3>
                  {perfil.descripcion && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {perfil.descripcion}
                    </p>
                  )}
                </div>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: 'var(--color-primary-bg)',
                    color: 'var(--color-text)'
                  }}
                >
                  {perfil.categoriaPermisos.length + perfil.motivoPermisos.length} permisos
                </span>
              </div>

              <div className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                <div>{perfil.categoriaPermisos.length} categorías</div>
                <div>{perfil.motivoPermisos.length} motivos</div>
                {perfil.usuarios && perfil.usuarios.length > 0 && (
                  <div className="mt-1">{perfil.usuarios.length} usuarios asignados</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(perfil)}
                  className="flex-1 py-2 px-3 rounded border text-sm font-medium"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleClone(perfil)}
                  className="py-2 px-3 rounded border text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  title="Clonar perfil"
                >
                  📋
                </button>
                <button
                  onClick={() => handleDelete(perfil)}
                  className="py-2 px-3 rounded text-sm"
                  style={{ color: 'var(--color-error, #dc2626)' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <FormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nuevo Perfil"
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

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nombre
              </label>
              <input
                type="text"
                value={newPerfil.nombre}
                onChange={(e) => setNewPerfil({ ...newPerfil, nombre: e.target.value })}
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
                Descripción (opcional)
              </label>
              <textarea
                value={newPerfil.descripcion}
                onChange={(e) => setNewPerfil({ ...newPerfil, descripcion: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                rows={2}
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

      {/* Edit Modal - includes permissions editor */}
      {showEditModal && selectedPerfil && (
        <FormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Editar: ${selectedPerfil.nombre}`}
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

          <form onSubmit={handleUpdate} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nombre
              </label>
              <input
                type="text"
                value={editPerfil.nombre}
                onChange={(e) => setEditPerfil({ ...editPerfil, nombre: e.target.value })}
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
                Descripción (opcional)
              </label>
              <textarea
                value={editPerfil.descripcion}
                onChange={(e) => setEditPerfil({ ...editPerfil, descripcion: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
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
                Guardar
              </button>
            </div>
          </form>

          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <h4 className="font-medium mb-3" style={{ color: 'var(--color-text)' }}>
              Permisos del Perfil
            </h4>
            <PerfilPermisosEditor
              perfil={selectedPerfil}
              casaId={user!.casaIds![0]}
              onUpdate={async () => {
                // Reload perfil after permission changes
                const updated = await getPerfis(user!.casaIds![0]);
                const refreshed = updated.find(p => p.id === selectedPerfil.id);
                if (refreshed) setSelectedPerfil(refreshed);
              }}
            />
          </div>
        </FormModal>
      )}
    </div>
  );
}