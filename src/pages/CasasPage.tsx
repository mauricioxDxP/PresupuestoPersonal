import { useState, useEffect } from 'react';
import api from '../services/api';

interface Casa {
  id: string;
  nombre: string;
  createdAt: string;
  usuariosMiembros?: {
    id: string;
    rol: string;
    usuario: { id: string; email: string; nombre: string; rol: string };
  }[];
  _count?: {
    usuariosMiembros: number;
    categorias: number;
  };
}

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  eliminado: boolean;
}

interface UsuarioCasa {
  id: string;
  casaId: string;
  rol: string;
  casa: { id: string; nombre: string };
}

export function CasasPage() {
  const [casas, setCasas] = useState<Casa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosConCasas, setUsuariosConCasas] = useState<Map<string, UsuarioCasa[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'casas' | 'usuarios'>('casas');
  const [showForm, setShowForm] = useState(false);
  const [newCasaNombre, setNewCasaNombre] = useState('');
  const [editingCasaId, setEditingCasaId] = useState<string | null>(null);
  const [editingCasaNombre, setEditingCasaNombre] = useState('');
  const [selectedCasa, setSelectedCasa] = useState<string | null>(null);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  // Global state for "Por Casa" view assignment
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedRol, setSelectedRol] = useState('USUARIO');
  // Per-user state for "Por Usuario" view assignment
  const [assignForm, setAssignForm] = useState<{ usuarioId: string; casaId: string; rol: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [casasRes, usuariosRes] = await Promise.all([
        api.get('/casas'),
        api.get('/users'),
      ]);
      setCasas(casasRes.data);
      setUsuarios(usuariosRes.data.filter((u: any) => !u.eliminado));
      
      // Build map of userId -> casas
      const map = new Map<string, UsuarioCasa[]>();
      casasRes.data.forEach((casa: Casa) => {
        casa.usuariosMiembros?.forEach((uc: any) => {
          if (!map.has(uc.usuario.id)) {
            map.set(uc.usuario.id, []);
          }
          map.get(uc.usuario.id)!.push({
            id: uc.id,
            casaId: casa.id,
            rol: uc.rol,
            casa: { id: casa.id, nombre: casa.nombre },
          });
        });
      });
      setUsuariosConCasas(map);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCasaNombre.trim()) return;
    try {
      await api.post('/casas', { nombre: newCasaNombre });
      setNewCasaNombre('');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando casa');
    }
  };

  const handleDeleteCasa = async (id: string) => {
    if (!confirm('¿Eliminar esta casa?')) return;
    try {
      await api.delete(`/casas/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleEditCasa = async (id: string) => {
    if (!editingCasaNombre.trim()) return;
    try {
      await api.patch(`/casas/${id}`, { nombre: editingCasaNombre });
      setEditingCasaId(null);
      setEditingCasaNombre('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const startEditingCasa = (casa: Casa) => {
    setEditingCasaId(casa.id);
    setEditingCasaNombre(casa.nombre);
  };

  // handleAssignUsuario removed - using handleAssignUsuarioFromCasa and handleAssignUsuarioFromUsuario

  const handleRemoveUsuario = async (casaId: string, usuarioId: string) => {
    if (!confirm('¿Quitar usuario de esta casa?')) return;
    try {
      await api.delete(`/casas/${casaId}/usuarios/${usuarioId}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getUsuariosNoAsignados = (casaId: string) => {
    const asignados = casas.find(c => c.id === casaId)?.usuariosMiembros?.map(u => u.usuario.id) || [];
    return usuarios.filter(u => !asignados.includes(u.id));
  };

  // Handle assign from "Por Casa" view (uses global selectedCasa/selectedUsuario)
  const handleAssignUsuarioFromCasa = async (casaId: string) => {
    if (!selectedUsuario) return;
    try {
      await api.post(`/casas/${casaId}/usuarios`, {
        usuarioId: selectedUsuario,
        rol: selectedRol,
      });
      setSelectedUsuario('');
      setShowUsuarioForm(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  // Handle assign from "Por Usuario" view (uses assignForm state)
  const handleAssignUsuarioFromUsuario = async (usuarioId: string) => {
    if (!assignForm?.casaId) return;
    try {
      await api.post(`/casas/${assignForm.casaId}/usuarios`, {
        usuarioId,
        rol: assignForm.rol || 'USUARIO',
      });
      setAssignForm(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          🏠 Gestión
        </h1>
        
        {/* Toggle View */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setView('casas')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'casas' ? 'var(--color-primary)' : 'var(--color-input-bg)',
              color: view === 'casas' ? 'white' : 'var(--color-text)',
            }}
          >
            Por Casa
          </button>
          <button
            onClick={() => setView('usuarios')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'usuarios' ? 'var(--color-primary)' : 'var(--color-input-bg)',
              color: view === 'usuarios' ? 'white' : 'var(--color-text)',
            }}
          >
            Por Usuario
          </button>
        </div>

        {view === 'casas' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {showForm ? 'Cancelar' : '+ Nueva Casa'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Crear Casa */}
      {view === 'casas' && showForm && (
        <form onSubmit={handleCreateCasa} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-input-bg)' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCasaNombre}
              onChange={(e) => setNewCasaNombre(e.target.value)}
              placeholder="Nombre de la casa"
              className="flex-1 px-3 py-2 rounded-lg border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              autoFocus
            />
            <button type="submit" className="px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              Crear
            </button>
          </div>
        </form>
      )}

      {/* Vista por CASA */}
      {view === 'casas' && (
        <div className="grid gap-6 md:grid-cols-2">
          {casas.map((casa) => (
            <div key={casa.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-input-bg)' }}>
              <div className="flex items-center justify-between mb-3">
                {editingCasaId === casa.id ? (
                  <div className="flex-1 flex gap-2 mr-2">
                    <input
                      type="text"
                      value={editingCasaNombre}
                      onChange={(e) => setEditingCasaNombre(e.target.value)}
                      className="flex-1 px-2 py-1 rounded border text-lg font-semibold"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleEditCasa(casa.id)}
                    />
                    <button onClick={() => handleEditCasa(casa.id)} className="p-1 rounded" style={{ color: 'var(--color-success, #16a34a)' }} title="Guardar">✓</button>
                    <button onClick={() => setEditingCasaId(null)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Cancelar">✕</button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>{casa.nombre}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => startEditingCasa(casa)} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-primary)' }} title="Editar">✏️</button>
                      <button onClick={() => handleDeleteCasa(casa.id)} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-error)' }} title="Eliminar">🗑️</button>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1 text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                <div>👥 {casa._count?.usuariosMiembros || casa.usuariosMiembros?.length || 0} usuarios</div>
                <div>📁 {casa._count?.categorias || 0} categorías</div>
                <div className="text-xs">Creada: {new Date(casa.createdAt).toLocaleDateString('es-ES')}</div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Usuarios en esta casa</h4>
                  <button
                    onClick={() => { setSelectedCasa(casa.id); setShowUsuarioForm(true); }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                  >
                    + Agregar
                  </button>
                </div>
                
                {casa.usuariosMiembros && casa.usuariosMiembros.length > 0 ? (
                  <div className="space-y-2">
                    {casa.usuariosMiembros.map((uc) => (
                      <div key={uc.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{uc.usuario.nombre}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{uc.usuario.email}</div>
                          <div className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>{uc.rol === 'MAESTRO_CASA' ? '🏠 Maestro' : '👤 Usuario'}</div>
                        </div>
                        <button onClick={() => handleRemoveUsuario(casa.id, uc.usuario.id)} className="p-1 text-xs rounded" style={{ color: 'var(--color-error)' }} title="Quitar">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>Sin usuarios</div>
                )}
              </div>

              {showUsuarioForm && selectedCasa === casa.id && (
                <div className="p-3 rounded border" style={{ borderColor: 'var(--color-input-border)', backgroundColor: 'var(--color-input-bg)' }}>
                  <div className="flex flex-wrap gap-2 items-end">
                    <select
                      value={selectedUsuario}
                      onChange={(e) => setSelectedUsuario(e.target.value)}
                      className="flex-1 min-w-[120px] px-2 py-1.5 border rounded text-sm"
                      style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text)' }}
                    >
                      <option value="">Usuario...</option>
                      {getUsuariosNoAsignados(casa.id).map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                    <select
                      value={selectedRol}
                      onChange={(e) => setSelectedRol(e.target.value)}
                      className="px-2 py-1.5 border rounded text-sm"
                      style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text)' }}
                    >
                      <option value="USUARIO">Usuario</option>
                      <option value="MAESTRO_CASA">Maestro</option>
                    </select>
                    <button onClick={() => handleAssignUsuarioFromCasa(casa.id)} disabled={!selectedUsuario} className="px-3 py-1.5 rounded text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Agregar</button>
                    <button onClick={() => { setShowUsuarioForm(false); setSelectedUsuario(''); }} className="px-3 py-1.5 rounded text-sm" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vista por USUARIO */}
      {view === 'usuarios' && (
        <div className="space-y-4">
          {usuarios.map((usuario) => {
            const casasDelUsuario = usuariosConCasas.get(usuario.id) || [];
            return (
              <div key={usuario.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-input-bg)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{usuario.nombre}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{usuario.email}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>
                      {usuario.rol === 'ADMIN' ? '⚡ Admin' : usuario.rol === 'MAESTRO_CASA' ? '🏠 Maestro de Casa' : '👤 Usuario'}
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {casasDelUsuario.length} casa{casasDelUsuario.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {casasDelUsuario.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {casasDelUsuario.map((uc) => (
                      <div key={uc.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text)' }}>🏠 {uc.casa.nombre}</span>
                        <span className="text-xs" style={{ color: 'var(--color-primary)' }}>({uc.rol === 'MAESTRO_CASA' ? 'Maestro' : 'Usuario'})</span>
                        <button onClick={() => handleRemoveUsuario(uc.casaId, usuario.id)} className="ml-1" style={{ color: 'var(--color-error)' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
                    No asignado a ninguna casa
                  </div>
                )}
                
                {/* Asignar a casa - per-user state */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex flex-wrap gap-2 items-end">
                    <select
                      value={assignForm?.usuarioId === usuario.id ? (assignForm?.casaId || '') : ''}
                      onChange={(e) => setAssignForm(e.target.value ? { usuarioId: usuario.id, casaId: e.target.value, rol: 'USUARIO' } : null)}
                      className="flex-1 min-w-[150px] px-2 py-1.5 border rounded text-sm"
                      style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text)' }}
                    >
                      <option value="">Asignar a casa...</option>
                      {casas
                        .filter(c => !casasDelUsuario.find(uc => uc.casaId === c.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                    {assignForm?.usuarioId === usuario.id && (
                      <>
                        <select
                          value={assignForm.rol}
                          onChange={(e) => setAssignForm({ ...assignForm, rol: e.target.value })}
                          className="px-2 py-1.5 border rounded text-sm"
                          style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text)' }}
                        >
                          <option value="USUARIO">Usuario</option>
                          <option value="MAESTRO_CASA">Maestro</option>
                        </select>
                        <button
                          onClick={() => handleAssignUsuarioFromUsuario(usuario.id)}
                          disabled={!assignForm?.casaId}
                          className="px-3 py-1.5 rounded text-sm font-medium"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                        >
                          Asignar
                        </button>
                        <button
                          onClick={() => setAssignForm(null)}
                          className="px-3 py-1.5 rounded text-sm"
                          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {casas.length === 0 && view === 'casas' && (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No hay casas creadas.</div>
      )}
      {usuarios.length === 0 && view === 'usuarios' && (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No hay usuarios.</div>
      )}
    </div>
  );
}
