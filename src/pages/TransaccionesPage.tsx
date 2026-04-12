import React, { useState, useEffect, useRef, useCallback } from 'react';
import { transaccionesService, categoriasService, motivosService, archivosService } from '../services';
import type {
  Transaccion,
  Categoria,
  Motivo,
  Archivo,
  CreateTransaccionDto,
  FiltrosTransaccion,
  Reportes,
} from '../types';
import { Button, Input, Select, Card, Modal, Loading, ErrorMessage } from '../components/UI';
import { exportToExcel, importTransaccionesFromExcel, downloadTemplate } from '../utils/excel';

export const TransaccionesPage: React.FC = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [reportes, setReportes] = useState<Reportes | null>(null);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loadingMotivos, setLoadingMotivos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTransaccion>({});
  const [filtrosTemp, setFiltrosTemp] = useState<FiltrosTransaccion>({});
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  const [form, setForm] = useState<CreateTransaccionDto>({
    motivoId: '',
    categoriaId: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    facturable: false,
  });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<Archivo[]>([]);
  const [archivosEliminados, setArchivosEliminados] = useState<string[]>([]);
  const [visorImagen, setVisorImagen] = useState<string | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  // Cleanup previews when modal closes
  const limpiarFormulario = () => {
    setForm({
      motivoId: '',
      categoriaId: '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      facturable: false,
    });
    setArchivos([]);
    setArchivosExistentes([]);
    setEditando(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExcelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTransacciones = useCallback(async () => {
    try {
      setLoadingTransacciones(true);
      const data = await transaccionesService.getAll(filtros, { page, limit: pageSize });
      setTransacciones(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar transacciones';
      setError(message);
    } finally {
      setLoadingTransacciones(false);
    }
  }, [filtros, page]);

  const fetchCategorias = useCallback(async () => {
    try {
      setLoadingCategorias(true);
      const data = await categoriasService.getAll();
      setCategorias(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  const fetchMotivos = useCallback(async () => {
    try {
      setLoadingMotivos(true);
      const data = await motivosService.getAll();
      setMotivos(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar motivos';
      setError(message);
    } finally {
      setLoadingMotivos(false);
    }
  }, []);

  const fetchReportes = useCallback(async () => {
    try {
      const data = await transaccionesService.getReportes(filtros);
      setReportes(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar reportes';
      setError(message);
    }
  }, [filtros]);

  // Fetch independientes - cada uno se carga cuando puede
  useEffect(() => {
    fetchTransacciones();
    fetchReportes();
  }, [fetchTransacciones, fetchReportes]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    fetchMotivos();
  }, [fetchMotivos]);

  const aplicarFiltros = () => {
    setFiltros(filtrosTemp);
  };

  const limpiarFiltros = () => {
    setFiltrosTemp({});
    setFiltros({});
    setPage(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const archivosValidos = files.filter(f => {
      const tipo = f.type;
      return tipo.startsWith('image/') || tipo === 'application/pdf';
    });

    if (archivosValidos.length !== files.length) {
      setError('Solo se permiten imágenes (JPG, PNG) y PDFs');
    }

    setArchivos(prev => [...prev, ...archivosValidos]);
  };

  const removeArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const eliminarArchivoExistente = async (id: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await archivosService.delete(id);
      setArchivosEliminados(prev => [...prev, id]);
      setArchivosExistentes(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let transaccionId: string;

      if (editando) {
        await transaccionesService.update(editando.id, form);
        transaccionId = editando.id;

        // Eliminar archivos marcados
        if (archivosEliminados.length > 0) {
          for (const id of archivosEliminados) {
            try {
              await archivosService.delete(id);
            } catch (error) {
              console.error(`Error al eliminar ${id}:`, error);
            }
          }
        }
      } else {
        const nuevaTransaccion = await transaccionesService.create(form);
        transaccionId = nuevaTransaccion.id;
      }

      // Subir archivos si hay
      if (archivos.length > 0 && transaccionId) {
        setSubiendoArchivos(true);
        try {
          await archivosService.uploadMultiple(archivos, transaccionId);
        } catch (error) {
          console.error('Error al subir archivos:', error);
          // No fellamos la transaccinn por error de archivos
        } finally {
          setSubiendoArchivos(false);
        }
      }

      setModalOpen(false);
      limpiarFormulario();
      fetchTransacciones();
      fetchReportes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await transaccionesService.delete(id);
      fetchTransacciones();
      fetchReportes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
    }
  };

  const handleExport = async () => {
    const data = transacciones.map((t) => ({
      monto: Number(t.monto),
      fecha: t.fecha.split('T')[0],
      descripcion: t.descripcion || '',
      categoria: t.categoria?.nombre,
      motivo: t.motivo?.nombre,
      facturable: t.facturable,
    }));
    await exportToExcel(data, 'transacciones', 'Transacciones');
    setExcelDropdownOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await importTransaccionesFromExcel(file);
      
      let successCount = 0;
      let skippedCount = 0;
      const skippedDetails: string[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        
        // Validar monto
        if (!row.monto || isNaN(row.monto) || row.monto <= 0) {
          skippedCount++;
          skippedDetails.push(`Fila ${rowNum}: monto inválido (${row.monto})`);
          continue;
        }
        
        // Validar fecha
        if (!row.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)) {
          skippedCount++;
          skippedDetails.push(`Fila ${rowNum}: fecha inválida (${row.fecha})`);
          continue;
        }
        
        // Buscar categoría por nombre
        const categoria = categorias.find((c) => 
          c.nombre.toLowerCase() === row.categoria?.toLowerCase()
        );
        
        if (!categoria) {
          skippedCount++;
          skippedDetails.push(`Fila ${rowNum}: categoría no encontrada "${row.categoria}"`);
          continue;
        }

        // Buscar motivo por nombre dentro de esa categoría
        const motivo = motivos.find((m) => 
          m.categoriaId === categoria.id && 
          m.nombre.toLowerCase() === row.motivo?.toLowerCase()
        );

        if (!motivo) {
          skippedCount++;
          skippedDetails.push(`Fila ${rowNum}: motivo no encontrado "${row.motivo}" en categoría "${row.categoria}"`);
          continue;
        }

        await transaccionesService.create({
          motivoId: motivo.id,
          categoriaId: categoria.id,
          monto: row.monto,
          fecha: row.fecha,
          descripcion: row.descripcion || '',
          facturable: row.facturable || false,
        });
        
        successCount++;
      }
      
      // Mostrar resumen de importación
      if (skippedCount > 0) {
        const summary = `Importación completada: ${successCount} exitosa(s), ${skippedCount} saltada(s).\n\nDetalles:\n${skippedDetails.join('\n')}`;
        alert(summary);
      } else {
        alert(`Importación exitosa: ${successCount} transacción(es) importada(s).`);
      }
      
      fetchTransacciones();
      fetchReportes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al importar';
      setError(message);
    }
    e.target.value = '';
    setExcelDropdownOpen(false);
  };

  const openEdit = (trans: Transaccion) => {
    setEditando(trans);
    setForm({
      motivoId: trans.motivoId,
      categoriaId: trans.categoriaId,
      monto: Number(trans.monto),
      fecha: trans.fecha.split('T')[0],
      descripcion: trans.descripcion || '',
      facturable: trans.facturable,
    });
    setArchivos([]);
    setArchivosExistentes(trans.archivos || []);
    setModalOpen(true);
  };

  const motivosPorCategoria = motivos.filter((m) => m.categoriaId === form.categoriaId);

  /**
   * Formatea una fecha ISO (2026-04-02T00:00:00.000Z) a DD/MM/YYYY
   * sin pasar por new Date() para evitar el desfase de zona horaria.
   */
  const formatFecha = (fecha: string): string => {
    // Extraer solo la parte YYYY-MM-DD (ignorar hora UTC)
    const datePart = fecha.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  // Solo mostrar loading inicial si no hay datos todavía
  const showInitialLoading = !transacciones.length && !categorias.length && !motivos.length && (loadingTransacciones || loadingCategorias || loadingMotivos);

  if (showInitialLoading) return <Loading />;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Reportes */}
      {reportes && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Ingresos</p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-ingreso)' }}>
              Bs{reportes.totalIngresos.toFixed(2)}
            </p>
          </Card>
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Gastos</p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-gasto)' }}>Bs{reportes.totalGastos.toFixed(2)}</p>
          </Card>
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance</p>
            <p
              className={`text-xl sm:text-2xl font-bold`}
              style={{ color: reportes.balance >= 0 ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
            >
              Bs{reportes.balance.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Transacciones</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Dropdown Excel */}
          <div className="relative" ref={dropdownRef}>
            <Button onClick={() => setExcelDropdownOpen(!excelDropdownOpen)}>
              Excel ▼
            </Button>
            {excelDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-40 border rounded shadow-lg z-10"
                style={{ backgroundColor: 'var(--color-dropdown-bg)', borderColor: 'var(--color-border)' }}
              >
                <button
                  onClick={async () => {
                    await downloadTemplate('transaccion');
                    setExcelDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  Template
                </button>
                <label
                  className="block w-full text-left px-4 py-2 cursor-pointer text-sm"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  Importar
                  <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                </label>
                <button
                  onClick={handleExport}
                  className="block w-full text-left px-4 py-2 text-sm"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  Exportar
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => {
              setEditando(null);
              setForm({
                motivoId: '',
                categoriaId: '',
                monto: 0,
                fecha: new Date().toISOString().split('T')[0],
                descripcion: '',
                facturable: false,
              });
              setArchivos([]);
              setArchivosExistentes([]);
              setModalOpen(true);
            }}
          >
            + Nueva
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-3 sm:mb-4">
        <button
          className="cursor-pointer text-sm font-medium select-none flex items-center gap-2 w-full"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
        >
          <svg
            className={`w-4 h-4 transition-transform ${filtrosAbiertos ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Filtros
          {Object.values(filtros).some(v => v) && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-text)' }}>
              activos
            </span>
          )}
        </button>

        {filtrosAbiertos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <Input
              label="Fecha inicio"
              type="date"
              value={filtrosTemp.fechaInicio || ''}
              onChange={(e) => setFiltrosTemp({ ...filtrosTemp, fechaInicio: e.target.value })}
            />
            <Input
              label="Fecha fin"
              type="date"
              value={filtrosTemp.fechaFin || ''}
              onChange={(e) => setFiltrosTemp({ ...filtrosTemp, fechaFin: e.target.value })}
            />
            <Select
              label="Categoría"
              value={filtrosTemp.categoriaId || ''}
              onChange={(e) => setFiltrosTemp({ ...filtrosTemp, categoriaId: e.target.value })}
              options={[
                { value: '', label: 'Todas' },
                ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
              ]}
            />
            <Select
              label="Motivo"
              value={filtrosTemp.motivoId || ''}
              onChange={(e) => setFiltrosTemp({ ...filtrosTemp, motivoId: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                ...motivos.map((m) => ({ value: m.id, label: m.nombre })),
              ]}
            />
            <div className="flex items-end gap-2 col-span-1 sm:col-span-2 md:col-span-4">
              <Button onClick={aplicarFiltros} className="w-full sm:w-auto">
                🔍 Aplicar filtros
              </Button>
              <Button variant="secondary" onClick={limpiarFiltros} className="w-full sm:w-auto">
                ✕ Limpiar
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-2">
        {transacciones.map((trans) => (
          <Card key={trans.id}>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`font-bold text-base ${trans.categoria?.tipo === 'ingreso' ? '' : ''}`}
                    style={{ color: trans.categoria?.tipo === 'ingreso' ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
                  >
                    {trans.categoria?.tipo === 'ingreso' ? '+' : '-'}Bs
                    {Number(trans.monto).toFixed(2)}
                  </span>
                  <span className="font-medium text-sm truncate">{trans.motivo?.nombre}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {trans.categoria?.nombre} • {formatFecha(trans.fecha)}
                </p>
                {trans.descripcion && <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>{trans.descripcion}</p>}
                {trans.archivos && trans.archivos.length > 0 && (
                  <p className="text-xs text-blue-500">{trans.archivos.length} archivo(s)</p>
                )}
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => openEdit(trans)}
                  className="text-blue-600 hover:text-blue-800 text-sm min-w-[60px]"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(trans.id)}
                  className="text-sm min-w-[60px]"
                  style={{ color: 'var(--color-danger)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-3 px-2">
          <p className="text-sm text-center sm:text-left" style={{ color: 'var(--color-text-muted)' }}>
            Mostrando {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems}
          </p>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              ← Ant
            </button>
            
            {(() => {
              const pages: (number | string)[] = [];
              const delta = 1; // menos páginas en mobile
              
              for (let i = 1; i <= totalPages; i++) {
                if (
                  i === 1 ||
                  i === totalPages ||
                  (i >= page - delta && i <= page + delta)
                ) {
                  pages.push(i);
                } else if (pages[pages.length - 1] !== '...') {
                  pages.push('...');
                }
              }
              
              return pages.map((p, idx) => {
                if (p === '...') {
                  return <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>…</span>;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors active:scale-95 ${
                      p === page
                        ? ''
                        : ''
                    }`}
                    style={
                      p === page
                        ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-text)' }
                        : { color: 'var(--color-text-secondary)' }
                    }
                    onMouseEnter={(e) => {
                      if (p !== page) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (p !== page) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {p}
                  </button>
                );
              });
            })()}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-dropdown-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              Sig →
            </button>
          </div>
        </div>
      )}

      {transacciones.length === 0 && !error && (
        <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No hay transacciones. ¡Registra una!</p>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Transacción' : 'Nueva Transacción'}
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Categoría"
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value, motivoId: '' })}
            options={[
              { value: '', label: 'Seleccionar categoría' },
              ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
            ]}
          />
          {form.categoriaId && (
            <Select
              label="Motivo"
              value={form.motivoId}
              onChange={(e) => setForm({ ...form, motivoId: e.target.value })}
              options={[
                { value: '', label: 'Seleccionar motivo' },
                ...motivosPorCategoria.map((m) => ({ value: m.id, label: m.nombre })),
              ]}
            />
          )}
          <Input
            label="Monto"
            type="number"
            step="0.01"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
            required
          />
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />
          <Input
            label="Descripción"
            value={form.descripcion || ''}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="facturable"
              checked={form.facturable}
              onChange={(e) => setForm({ ...form, facturable: e.target.checked })}
            />
            <label htmlFor="facturable" className="text-sm">
              Facturable
            </label>
          </div>

          {/* Archivos existentes (solo en edición) */}
          {editando && archivosExistentes.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Archivos adjuntos
              </label>
              <div className="flex flex-wrap gap-2">
                {archivosExistentes.map((archivo) => (
                  archivo.tipo === 'imagen' ? (
                    <div key={archivo.id} className="relative flex items-start gap-1">
                      <img
                        src={archivo.url}
                        alt={archivo.nombre}
                        className="w-16 h-16 rounded object-cover cursor-pointer border"
                        style={{ borderColor: 'var(--color-border)' }}
                        onClick={() => setVisorImagen(archivo.url)}
                      />
                      <button
                        type="button"
                        onClick={() => eliminarArchivoExistente(archivo.id)}
                        className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-xs"
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div key={archivo.id} className="relative flex items-start gap-1">
                      <a
                        href={archivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded border text-sm"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <span style={{ color: 'var(--color-text)' }}>📄 {archivo.nombre}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarArchivoExistente(archivo.id)}
                        className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-red-500 text-white rounded-full text-xs"
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Upload de archivos */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Archivos adjuntos (imágenes o PDF)
            </label>
            <label
              className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded cursor-pointer transition-colors"
              style={{ 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  + Agregar archivos
                </span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Lista de archivos seleccionados */}
            {archivos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {archivos.map((file, index) => (
                  file.type.startsWith('image/') ? (
                    <div key={index} className="relative w-16 h-16 rounded overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeArchivo(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 rounded border text-sm" style={{ borderColor: 'var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text)' }}>📄 {file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeArchivo(index)}
                        className="text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={subiendoArchivos}>
              {editando ? 'Actualizar' : 'Crear'}
              {subiendoArchivos && ' 📎'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Visor de imagen */}
      {visorImagen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-2xl"
            onClick={() => setVisorImagen(null)}
          >
            ×
          </button>
          <img
            src={visorImagen}
            alt="Vista previa"
            className="max-w-[90vw] max-h-[90vh] rounded"
          />
        </div>
      )}
    </div>
  );
};
