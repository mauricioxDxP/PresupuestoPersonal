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
import { categoriasService } from '../services';
import type { Categoria, CreateCategoriaDto } from '../types';
import { Button, Input, Select, Modal, Loading, ErrorMessage } from '../components/UI';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excel';
import type { DragEndEvent } from '@dnd-kit/core';

// Componente individual para cada categoría (sortable)
interface SortableCategoriaProps {
  categoria: Categoria;
  onEdit: (c: Categoria) => void;
  onDelete: (id: string) => void;
}

const SortableCategoria: React.FC<SortableCategoriaProps> = ({ categoria, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria.id });

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
        <span className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--color-text)' }}>{categoria.nombre}</span>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs shrink-0`}
          style={{
            backgroundColor: categoria.tipo === 'ingreso' ? 'var(--color-badge-ingreso)' : 'var(--color-badge-gasto)',
            color: categoria.tipo === 'ingreso' ? 'var(--color-badge-ingreso-text)' : 'var(--color-badge-gasto-text)',
          }}
        >
          {categoria.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
        </span>
      </div>
      <div className="flex gap-2 shrink-0 ml-2">
        <button onClick={() => onEdit(categoria)} className="text-sm min-w-[32px] text-center" style={{ color: 'var(--color-primary)' }}>
          ✎
        </button>
        <button onClick={() => onDelete(categoria.id)} className="text-sm min-w-[32px] text-center" style={{ color: 'var(--color-danger)' }}>
          ✕
        </button>
      </div>
    </div>
  );
};

export const CategoriasPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMultipleOpen, setModalMultipleOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateCategoriaDto>({
    nombre: '',
    tipo: 'gasto',
    orden: 0,
  });

  const [multipleForm, setMultipleForm] = useState({
    lista: '',
    tipo: 'gasto' as 'ingreso' | 'gasto',
  });

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Pequeña distancia para diferenciar drag de tap
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExcelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriasService.getAll(filtroTipo || undefined);
      setCategorias(data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await categoriasService.update(editando.id, form);
      } else {
        // Calcular el máximo orden actual + 1
        const maxOrden = categorias.length > 0 ? Math.max(...categorias.map((c) => c.orden)) : 0;
        await categoriasService.create({ ...form, orden: maxOrden + 1 });
      }
      setModalOpen(false);
      setEditando(null);
      setForm({ nombre: '', tipo: 'gasto', orden: 0 });
      cargarCategorias();
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

      const maxOrden = categorias.length > 0 ? Math.max(...categorias.map((c) => c.orden)) : 0;

      for (let i = 0; i < nombres.length; i++) {
        await categoriasService.create({
          nombre: nombres[i],
          tipo: multipleForm.tipo,
          orden: maxOrden + i + 1,
        });
      }

      setModalMultipleOpen(false);
      setMultipleForm({ lista: '', tipo: 'gasto' });
      cargarCategorias();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await categoriasService.delete(id);
      cargarCategorias();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
    }
  };

  const handleExport = () => {
    const data = categorias.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      orden: c.orden,
    }));
    exportToExcel(data, 'categorias', 'Categorías');
    setExcelDropdownOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      const maxOrden = categorias.length > 0 ? Math.max(...categorias.map((c) => c.orden)) : 0;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].nombre) {
          await categoriasService.create({
            nombre: rows[i].nombre,
            tipo: rows[i].tipo || 'gasto',
            orden: maxOrden + i + 1,
          });
        }
      }
      cargarCategorias();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al importar';
      setError(message);
    }
    e.target.value = '';
    setExcelDropdownOpen(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categorias.findIndex((c) => c.id === active.id);
    const newIndex = categorias.findIndex((c) => c.id === over.id);

    const reordered = arrayMove(categorias, oldIndex, newIndex);

    // Actualizar órdenes en la base de datos
    for (let i = 0; i < reordered.length; i++) {
      await categoriasService.update(reordered[i].id, { orden: i + 1 });
    }

    cargarCategorias();
  };

  const openEdit = (cat: Categoria) => {
    setEditando(cat);
    setForm({ nombre: cat.nombre, tipo: cat.tipo as 'ingreso' | 'gasto', orden: cat.orden });
    setModalOpen(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Categorías</h1>
        
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
                  onClick={() => {
                    downloadTemplate('categoria');
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
            setForm({ nombre: '', tipo: 'gasto', orden: 0 });
            setModalOpen(true);
          }}>
            + Nueva
          </Button>
          <Button onClick={() => {
            setMultipleForm({ lista: '', tipo: 'gasto' });
            setModalMultipleOpen(true);
          }}>
            + Múltiples
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            { value: 'ingreso', label: 'Ingresos' },
            { value: 'gasto', label: 'Gastos' },
          ]}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Lista vertical con drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={categorias.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {categorias.map((cat) => (
            <SortableCategoria
              key={cat.id}
              categoria={cat}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {categorias.length === 0 && !error && (
        <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No hay categorías. ¡Crea una!</p>
      )}

      {/* Modal Individual */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as 'ingreso' | 'gasto' })}
            options={[
              { value: 'gasto', label: 'Gasto' },
              { value: 'ingreso', label: 'Ingreso' },
            ]}
          />
          <div className="flex gap-2 mt-4">
            <Button type="submit">{editando ? 'Actualizar' : 'Crear'}</Button>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Múltiples */}
      <Modal
        isOpen={modalMultipleOpen}
        onClose={() => setModalMultipleOpen(false)}
        title="Añadir Múltiples Categorías"
      >
        <form onSubmit={handleMultipleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Categorías (una por línea)
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded h-40"
              style={{
                backgroundColor: 'var(--color-input-bg)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)',
              }}
              placeholder="Alimentación&#10;Transporte&#10;Entretenimiento"
              value={multipleForm.lista}
              onChange={(e) => setMultipleForm({ ...multipleForm, lista: e.target.value })}
              required
            />
          </div>
          <Select
            label="Tipo"
            value={multipleForm.tipo}
            onChange={(e) => setMultipleForm({ ...multipleForm, tipo: e.target.value as 'ingreso' | 'gasto' })}
            options={[
              { value: 'gasto', label: 'Gasto' },
              { value: 'ingreso', label: 'Ingreso' },
            ]}
          />
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
