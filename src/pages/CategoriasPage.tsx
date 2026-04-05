import React, { useState, useEffect, useRef } from 'react';
import { categoriasService } from '../services';
import type { Categoria, CreateCategoriaDto } from '../types';
import { Button, Input, Select, Card, Modal, Loading, ErrorMessage } from '../components/UI';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excel';

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
  });

  const [multipleForm, setMultipleForm] = useState({
    lista: '',
    tipo: 'gasto' as 'ingreso' | 'gasto',
  });

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
        await categoriasService.create(form);
      }
      setModalOpen(false);
      setEditando(null);
      setForm({ nombre: '', tipo: 'gasto' });
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

      for (const nombre of nombres) {
        await categoriasService.create({ nombre, tipo: multipleForm.tipo });
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
    }));
    exportToExcel(data, 'categorias', 'Categorías');
    setExcelDropdownOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await importFromExcel(file);
      for (const row of rows) {
        if (row.nombre) {
          await categoriasService.create({
            nombre: row.nombre,
            tipo: row.tipo || 'gasto',
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

  const openEdit = (cat: Categoria) => {
    setEditando(cat);
    setForm({ nombre: cat.nombre, tipo: cat.tipo as 'ingreso' | 'gasto' });
    setModalOpen(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        
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
                    downloadTemplate('categoria');
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

          <Button onClick={() => {
            setEditando(null);
            setForm({ nombre: '', tipo: 'gasto' });
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((cat) => (
          <Card key={cat.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{cat.nombre}</h3>
                <span
                  className={`inline-block px-2 py-1 rounded text-sm ${
                    cat.tipo === 'ingreso'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {cat.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="text-blue-600 hover:text-blue-800">
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categorias.length === 0 && !error && (
        <p className="text-gray-500 text-center py-8">No hay categorías. ¡Crea una!</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorías (una por línea)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded h-40"
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
