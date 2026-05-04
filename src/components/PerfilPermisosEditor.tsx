import { useState, useEffect } from 'react';
import { assignPerfilCategoriaPermiso, assignPerfilMotivoPermiso } from '../services/perfis';
import { Perfil, PerfilCategoriaPermiso, PerfilMotivoPermiso } from '../types/perfil';
import { Categoria, Motivo } from '../types';
import api from '../services/api';

interface PerfilPermisosEditorProps {
  perfil: Perfil;
  casaId: string;
  onUpdate: () => void;
}

export function PerfilPermisosEditor({ perfil, casaId, onUpdate }: PerfilPermisosEditorProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Permisos state: categoriaId -> permisos, motivoId -> permisos
  const [permisosCategoria, setPermisosCategoria] = useState<{[catId: string]: {
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeVer: boolean;
    puedeVerTransaccionesOtros: boolean;
  }}>({});
  const [permisosMotivo, setPermisosMotivo] = useState<{[motivoId: string]: {
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeVer: boolean;
    puedeVerTransaccionesOtros: boolean;
  }}>({});

  useEffect(() => {
    loadCategoriasYMotivos();
  }, [casaId]);

  // Sync perfil permissions into state when perfil changes
  useEffect(() => {
    const catPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
    (perfil.categoriaPermisos || []).forEach((cp: PerfilCategoriaPermiso) => {
      catPerm[cp.categoriaId] = {
        puedeCrear: cp.puedeCrear,
        puedeEditar: cp.puedeEditar,
        puedeEliminar: cp.puedeEliminar,
        puedeVer: cp.puedeVer,
        puedeVerTransaccionesOtros: cp.puedeVerTransaccionesOtros,
      };
    });
    setPermisosCategoria(catPerm);

    const motPerm: {[key: string]: {puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean; puedeVer: boolean; puedeVerTransaccionesOtros: boolean}} = {};
    (perfil.motivoPermisos || []).forEach((mp: PerfilMotivoPermiso) => {
      motPerm[mp.motivoId] = {
        puedeCrear: mp.puedeCrear,
        puedeEditar: mp.puedeEditar,
        puedeEliminar: mp.puedeEliminar,
        puedeVer: mp.puedeVer,
        puedeVerTransaccionesOtros: mp.puedeVerTransaccionesOtros,
      };
    });
    setPermisosMotivo(motPerm);
  }, [perfil]);

  const loadCategoriasYMotivos = async () => {
    try {
      const [catRes, motRes] = await Promise.all([
        api.get('/categorias'),
        api.get('/motivos'),
      ]);
      setCategorias(catRes.data.filter((c: any) => !c.eliminado));
      setMotivos(motRes.data.filter((m: any) => !m.eliminado));
    } catch (err) {
      console.error('Error loading categorias/motivos:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermisoCategoria = (
    catId: string, 
    tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar' | 'puedeVer' | 'puedeVerTransaccionesOtros'
  ) => {
    setPermisosCategoria(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false }),
        [tipo]: !prev[catId]?.[tipo],
      },
    }));
  };

  const togglePermisoMotivo = (
    motivoId: string, 
    tipo: 'puedeCrear' | 'puedeEditar' | 'puedeEliminar' | 'puedeVer' | 'puedeVerTransaccionesOtros'
  ) => {
    setPermisosMotivo(prev => ({
      ...prev,
      [motivoId]: {
        ...(prev[motivoId] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false }),
        [tipo]: !prev[motivoId]?.[tipo],
      },
    }));
  };

  const savePermisos = async () => {
    setSaving(true);
    setSuccessMsg('');

    try {
      // Save categoria permisos
      for (const [catId, perms] of Object.entries(permisosCategoria)) {
        await assignPerfilCategoriaPermiso(perfil.id, {
          categoriaId: catId,
          ...perms,
        });
      }

      // Save motivo permisos
      for (const [motivoId, perms] of Object.entries(permisosMotivo)) {
        await assignPerfilMotivoPermiso(perfil.id, {
          motivoId,
          ...perms,
        });
      }

      setSuccessMsg('Permisos guardados correctamente');
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>;
  }

  return (
    <div>
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

      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Permisos del Perfil
          </h5>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
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

        <div className="space-y-4">
          {categorias.map(cat => {
            const catMotivos = motivos.filter(m => m.categoriaId === cat.id);
            if (catMotivos.length === 0) return null;
            const pCat = permisosCategoria[cat.id] || { puedeCrear: false, puedeEditar: false, puedeEliminar: false, puedeVer: false, puedeVerTransaccionesOtros: false };
            return (
              <div key={cat.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                {/* Category header row */}
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
                {/* Motivos table */}
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

      <button
        onClick={savePermisos}
        disabled={saving}
        className="w-full py-2 px-4 rounded-lg font-medium"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Guardando...' : 'Guardar Permisos'}
      </button>
    </div>
  );
}