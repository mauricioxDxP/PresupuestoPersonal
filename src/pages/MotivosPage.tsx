import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motivosService, categoriasService } from '../services';
import type { Motivo, Categoria, CreateMotivoDto } from '../types';
import { Button, Input, Select, Card, Modal, Loading, ErrorMessage } from '../components/UI';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excel';
import type { DragEndEvent } from '@dnd-kit/core';

// Componente individual para cada motivo (sortable)
interface SortableMotivoProps {
  motivo: Motivo;
  onEdit: (m: Motivo) => void;
  onDelete: (id: string) => void;
}

const SortableMotivo: React.FC<SortableMotivoProps> = ({ motivo, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: motivo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border rounded px-3 py-2.5 mb-2 hover:shadow-md transition-shadow active:shadow-lg"
    >
      <div className="flex items-center gap-2 sm:gap-3 select-none min-w-0 flex-1">
        <span
          className="text-lg shrink-0 cursor-grab"
          style={{ color: 'var(--color-text-muted)', touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >⋮⋮</span>
        <span className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--color-text)' }}>{motivo.nombre}</span>
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>#{motivo.orden}</span>
      </div>
      <div className="flex gap-2 shrink-0 ml-2">
        <button onClick={() => onEdit(motivo)} className="text-blue-600 hover:text-blue-800 text-sm min-w-[32px] text-center" style={{ color: 'var(--color-primary)' }}>
          ✎
        </button>
        <button onClick={() => onDelete(motivo.id)} className="text-sm min-w-[32px] text-center" style={{ color: 'var(--color-danger)' }}>
          ✕
        </button>
      </div>
    </div>
  );
};

// Componente para una categoría con sus motivos
interface CategoriaGroupProps {
  categoria: Categoria;
  motivos: Motivo[];
  onEdit: (m: Motivo) => void;
  onDelete: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

const CategoriaGroup: React.FC<CategoriaGroupProps> = ({
  categoria,
  motivos,
  onEdit,
  onDelete,
  onDragEnd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Card title={categoria.nombre}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={motivos.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {motivos.map((motivo) => (
            <SortableMotivo
              key={motivo.id}
              motivo={motivo}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Card>
  );
};

export const MotivosPage: React.FC = () => {
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMultipleOpen, setModalMultipleOpen] = useState(false);
  const [editando, setEditando] = useState<Motivo | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateMotivoDto>({
    nombre: '',
    categoriaId: '',
    mostrarSinTransacciones: false,
    orden: 0,
  });

  const [multipleForm, setMultipleForm] = useState({
    lista: '',
    categoriaId: '',
    mostrarSinTransacciones: false,
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
      const [motivosData, categoriasData] = await Promise.all([
        motivosService.getAll(filtroCategoria || undefined),
        categoriasService.getAll(),
      ]);
      setMotivos(motivosData);
      setCategorias(categoriasData);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await motivosService.update(editando.id, form);
      } else {
        await motivosService.create(form);
      }
      setModalOpen(false);
      setEditando(null);
      setForm({ nombre: '', categoriaId: '', mostrarSinTransacciones: false, orden: 0 });
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nombres = multipleForm.lista
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n);

      if (!multipleForm.categoriaId) {
        setError('Debe seleccionar una categoría');
        return;
      }

      // Obtener el máximo orden solo de motivos de esta categoría
      const motivosCategoria = motivos.filter((m) => m.categoriaId === multipleForm.categoriaId);
      const maxOrden = motivosCategoria.length > 0 
        ? Math.max(...motivosCategoria.map((m) => m.orden)) 
        : 0;

      for (let i = 0; i < nombres.length; i++) {
        await motivosService.create({
          nombre: nombres[i],
          categoriaId: multipleForm.categoriaId,
          mostrarSinTransacciones: multipleForm.mostrarSinTransacciones,
          orden: maxOrden + i + 1,
        });
      }

      setModalMultipleOpen(false);
      setMultipleForm({ lista: '', categoriaId: '', mostrarSinTransacciones: false });
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este motivo?')) return;
    try {
      await motivosService.delete(id);
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
    }
  };

  const handleExport = () => {
    const data = motivos.map((m) => ({
      nombre: m.nombre,
      categoria: m.categoria?.nombre,
      orden: m.orden,
    }));
    exportToExcel(data, 'motivos', 'Motivos');
    setExcelDropdownOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      const maxOrden = motivos.length > 0 ? Math.max(...motivos.map((m) => m.orden)) : 0;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.nombre) {
          const cat = categorias.find((c) => c.nombre === row.categoriaId) || categorias[0];
          await motivosService.create({
            nombre: row.nombre,
            categoriaId: cat?.id || '',
            orden: (row.orden as number) || maxOrden + i + 1,
          });
        }
      }
      cargarDatos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al importar';
      setError(message);
    }
    e.target.value = '';
    setExcelDropdownOpen(false);
  };

  const handleDragEnd = async (event: DragEndEvent, categoriaId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const categoriaMotivos = motivos
      .filter((m) => m.categoriaId === categoriaId)
      .sort((a, b) => a.orden - b.orden);

    const oldIndex = categoriaMotivos.findIndex((m) => m.id === active.id);
    const newIndex = categoriaMotivos.findIndex((m) => m.id === over.id);

    const reordered = arrayMove(categoriaMotivos, oldIndex, newIndex);

    // Actualizar órdenes en la base de datos
    for (let i = 0; i < reordered.length; i++) {
      await motivosService.update(reordered[i].id, { ...reordered[i], orden: i + 1 });
    }

    cargarDatos();
  };

  const openEdit = (motivo: Motivo) => {
    setEditando(motivo);
    setForm({
      nombre: motivo.nombre,
      categoriaId: motivo.categoriaId,
      mostrarSinTransacciones: motivo.mostrarSinTransacciones,
      orden: motivo.orden,
    });
    setModalOpen(true);
  };

  const motivosAgrupados = React.useMemo(() => {
    const grupos: Record<string, { categoria: Categoria; motivos: Motivo[] }> = {};
    
    const categoriasFiltradas = filtroCategoria 
      ? categorias.filter((c) => c.id === filtroCategoria)
      : categorias;

    for (const cat of categoriasFiltradas) {
      const motivosCategoria = motivos
        .filter((m) => m.categoriaId === cat.id)
        .sort((a, b) => a.orden - b.orden);
      
      if (motivosCategoria.length > 0) {
        grupos[cat.id] = { categoria: cat, motivos: motivosCategoria };
      }
    }

    return grupos;
  }, [motivos, categorias, filtroCategoria]);

  if (loading) return <Loading />;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Motivos</h1>
        
        <div className="flex flex-wrap gap-2">
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
                  onClick={() => {
                    downloadTemplate('motivo');
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

          <Button onClick={() => {
            setEditando(null);
            setForm({ nombre: '', categoriaId: '', mostrarSinTransacciones: false, orden: 0 });
            setModalOpen(true);
          }}>
            + Nuevo
          </Button>
          <Button onClick={() => {
            setMultipleForm({ lista: '', categoriaId: '', mostrarSinTransacciones: false });
            setModalMultipleOpen(true);
          }}>
            + Múltiples
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Select
          label="Filtrar por categoría"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
          ]}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Lista vertical por categoría con drag & drop */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(motivosAgrupados).map(([categoriaId, { categoria, motivos: motivosList }]) => (
          <CategoriaGroup
            key={categoriaId}
            categoria={categoria}
            motivos={motivosList}
            onEdit={openEdit}
            onDelete={handleDelete}
            onDragEnd={(event) => handleDragEnd(event, categoriaId)}
          />
        ))}
      </div>

      {Object.keys(motivosAgrupados).length === 0 && !error && (
        <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No hay motivos. ¡Crea uno!</p>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Motivo' : 'Nuevo Motivo'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            options={[
              { value: '', label: 'Seleccionar categoría' },
              ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
            ]}
          />
          <Input
            label="Orden"
            type="number"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
          />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="mostrarSinTransacciones"
              checked={form.mostrarSinTransacciones}
              onChange={(e) => setForm({ ...form, mostrarSinTransacciones: e.target.checked })}
            />
            <label htmlFor="mostrarSinTransacciones" className="text-sm">
              Mostrar sin transacciones
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

      <Modal
        isOpen={modalMultipleOpen}
        onClose={() => setModalMultipleOpen(false)}
        title="Añadir Múltiples Motivos"
      >
        <form onSubmit={handleMultipleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Motivos (uno por línea)
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded h-40"
              style={{
                backgroundColor: 'var(--color-input-bg)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)',
              }}
              placeholder="Gasolina&#10;Estacionamiento&#10;Peaje"
              value={multipleForm.lista}
              onChange={(e) => setMultipleForm({ ...multipleForm, lista: e.target.value })}
              required
            />
          </div>
          <Select
            label="Categoría"
            value={multipleForm.categoriaId}
            onChange={(e) => setMultipleForm({ ...multipleForm, categoriaId: e.target.value })}
            options={[
              { value: '', label: 'Seleccionar categoría' },
              ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
            ]}
          />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="mostrarSinTransaccionesMultiple"
              checked={multipleForm.mostrarSinTransacciones}
              onChange={(e) => setMultipleForm({ ...multipleForm, mostrarSinTransacciones: e.target.checked })}
            />
            <label htmlFor="mostrarSinTransaccionesMultiple" className="text-sm">
              Mostrar sin transacciones
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit">Crear Todos</Button>
            <Button variant="secondary" type="button" onClick={() => setModalMultipleOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
