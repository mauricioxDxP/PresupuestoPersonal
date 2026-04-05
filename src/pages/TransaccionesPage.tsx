import React, { useState, useEffect, useRef } from 'react';
import { transaccionesService, categoriasService, motivosService } from '../services';
import type {
  Transaccion,
  Categoria,
  Motivo,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTransaccion>({});
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExcelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [transData, categoriasData, motivosData, reportesData] = await Promise.all([
        transaccionesService.getAll(filtros, { page, limit: pageSize }),
        categoriasService.getAll(),
        motivosService.getAll(),
        transaccionesService.getReportes(),
      ]);
      setTransacciones(transData.data);
      setTotalPages(transData.meta.totalPages);
      setTotalItems(transData.meta.total);
      setCategorias(categoriasData);
      setMotivos(motivosData);
      setReportes(reportesData);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset page cuando cambian filtros
  }, [filtros]);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await transaccionesService.update(editando.id, form);
      } else {
        await transaccionesService.create(form);
      }
      setModalOpen(false);
      setEditando(null);
      setForm({
        motivoId: '',
        categoriaId: '',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        facturable: false,
      });
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await transaccionesService.delete(id);
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
    }
  };

  const handleExport = () => {
    const data = transacciones.map((t) => ({
      monto: Number(t.monto),
      fecha: t.fecha.split('T')[0],
      descripcion: t.descripcion || '',
      categoria: t.categoria?.nombre,
      motivo: t.motivo?.nombre,
      facturable: t.facturable,
    }));
    exportToExcel(data, 'transacciones', 'Transacciones');
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
      
      cargarDatos();
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

  if (loading) return <Loading />;

  return (
    <div className="p-4 md:p-6">
      {/* Reportes */}
      {reportes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-2xl font-bold text-green-600">
              Bs{reportes.totalIngresos.toFixed(2)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Gastos</p>
            <p className="text-2xl font-bold text-red-600">Bs{reportes.totalGastos.toFixed(2)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Balance</p>
            <p
              className={`text-2xl font-bold ${reportes.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              Bs{reportes.balance.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        
        <div className="flex flex-wrap gap-2">
          {/* Dropdown Excel */}
          <div className="relative" ref={dropdownRef}>
            <Button onClick={() => setExcelDropdownOpen(!excelDropdownOpen)}>
              Excel ▼
            </Button>
            {excelDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    downloadTemplate('transaccion');
                    setExcelDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Template
                </button>
                <label className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Importar
                  <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                </label>
                <button
                  onClick={handleExport}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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
              setModalOpen(true);
            }}
          >
            + Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Input
          label="Fecha inicio"
          type="date"
          value={filtros.fechaInicio || ''}
          onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
        />
        <Input
          label="Fecha fin"
          type="date"
          value={filtros.fechaFin || ''}
          onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
        />
        <Select
          label="Categoría"
          value={filtros.categoriaId || ''}
          onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
          options={[
            { value: '', label: 'Todas' },
            ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
          ]}
        />
        <Select
          label="Motivo"
          value={filtros.motivoId || ''}
          onChange={(e) => setFiltros({ ...filtros, motivoId: e.target.value })}
          options={[
            { value: '', label: 'Todos' },
            ...motivos.map((m) => ({ value: m.id, label: m.nombre })),
          ]}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-2">
        {transacciones.map((trans) => (
          <Card key={trans.id}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${trans.categoria?.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {trans.categoria?.tipo === 'ingreso' ? '+' : '-'}Bs
                    {Number(trans.monto).toFixed(2)}
                  </span>
                  <span className="font-medium">{trans.motivo?.nombre}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {trans.categoria?.nombre} • {formatFecha(trans.fecha)}
                </p>
                {trans.descripcion && <p className="text-sm text-gray-400">{trans.descripcion}</p>}
                {trans.archivos && trans.archivos.length > 0 && (
                  <p className="text-xs text-blue-500">{trans.archivos.length} archivo(s)</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(trans)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(trans.id)}
                  className="text-red-600 hover:text-red-800"
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
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Anterior
            </button>
            
            {(() => {
              const pages: (number | string)[] = [];
              const delta = 2; // páginas a cada lado de la actual
              
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
                  return <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400">…</span>;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              });
            })()}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {transacciones.length === 0 && !error && (
        <p className="text-gray-500 text-center py-8">No hay transacciones. ¡Registra una!</p>
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
          <div className="flex gap-2 mt-4">
            <Button type="submit">{editando ? 'Actualizar' : 'Crear'}</Button>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
