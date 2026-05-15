import React, { useState, useEffect, useMemo } from 'react';
import { transaccionesService } from '../services';
import { generateMonthlyReport, type ReporteMensualData } from '../utils/excel';
import { Button, Select, Card, Loading, ErrorMessage } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import type { Moneda, Billetera } from '../types';

export const ReportesPage: React.FC = () => {
  const { selectedCasaId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const [reportePreview, setReportePreview] = useState<ReporteMensualData | null>(null);
  const [tipoReporte, setTipoReporte] = useState<'mensual' | 'semanal'>('mensual');
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('');
  const [filtroMoneda, setFiltroMoneda] = useState<Moneda>('BOB');
  const [filtroBilletera, setFiltroBilletera] = useState<Billetera | ''>('');

  /**
   * Formatea una fecha ISO usando UTC para evitar el desfase de zona horaria.
   * Esto asegura que '2026-04-01T00:00:00.000Z' se muestre como 01/04/2026
   * sin importar la configuración regional del navegador.
   */
  const formatFecha = (fecha: string): string => {
    const d = new Date(fecha);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Generar opciones de años (actual ± 5)
  const currentYear = new Date().getFullYear();
  const anios = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  // Generar semanas disponibles para el mes seleccionado
  const semanasDelMes = useMemo(() => {
    const semanas: { value: string; label: string; fechaInicio: Date; fechaFin: Date }[] = [];
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    // Encontrar el primer lunes
    let inicio = new Date(primerDia);
    while (inicio.getDay() !== 1) {
      inicio.setDate(inicio.getDate() - 1);
    }

    // Si el lunes começa antes del primer día del mes, avançar una semana
    if (inicio < primerDia) {
      inicio.setDate(inicio.getDate() + 7);
    }

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    while (inicio <= ultimoDia) {
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);

      const label = `${inicio.getDate()}-${months[inicio.getMonth()]} - ${fin.getDate()}-${months[fin.getMonth()]}`;
      semanas.push({
        value: inicio.toISOString().split('T')[0],
        label,
        fechaInicio: new Date(inicio),
        fechaFin: fin,
      });

      inicio.setDate(inicio.getDate() + 7);
    }

    return semanas;
  }, [anio, mes]);

  // Inicializar semana seleccionada si cambió el mes
  useEffect(() => {
    if (semanasDelMes.length > 0 && !semanasDelMes.find(s => s.value === semanaSeleccionada)) {
      setSemanaSeleccionada(semanasDelMes[0].value);
    }
  }, [anio, mes, semanasDelMes, semanaSeleccionada]);

  const cargarPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: Record<string, string> = {};
      if (filtroMoneda) filters.moneda = filtroMoneda;
      if (filtroBilletera) filters.billetera = filtroBilletera;
      const data = await transaccionesService.getReporteMensualNoCache(anio, mes, filters);
      setReportePreview(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar el reporte';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async () => {
    if (!reportePreview) {
      await cargarPreview();
    }

    try {
      setGenerando(true);
      const filters: Record<string, string> = {};
      if (filtroMoneda) filters.moneda = filtroMoneda;
      if (filtroBilletera) filters.billetera = filtroBilletera;
      const data = reportePreview || await transaccionesService.getReporteMensual(anio, mes, filters);
      await generateMonthlyReport(data, includeEmpty);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar el reporte';
      setError(message);
    } finally {
      setGenerando(false);
    }
  };

  const generarExcelReporteSemanal = async () => {
    try {
      setGenerando(true);
      const filters: Record<string, string> = {};
      if (filtroMoneda) filters.moneda = filtroMoneda;
      if (filtroBilletera) filters.billetera = filtroBilletera;
      await transaccionesService.downloadReporteExcel('semanal', anio, mes, includeEmpty, filters);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar el reporte';
      setError(message);
    } finally {
      setGenerando(false);
    }
  };

  // Cargar preview al cambiar mes/año/casa o filtros
  useEffect(() => {
    cargarPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes, selectedCasaId, filtroMoneda, filtroBilletera]);

  // Calcular totales del preview
  const totalTransacciones = reportePreview?.transacciones.length || 0;
  const totalIngresos = reportePreview?.transacciones
    .filter((t) => t.categoria.tipo === 'ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0) || 0;
  const totalGastos = reportePreview?.transacciones
    .filter((t) => t.categoria.tipo === 'gasto')
    .reduce((sum, t) => sum + Number(t.monto), 0) || 0;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--color-text)' }}>
        📊 Reportes
      </h1>

      {/* Selector de período y filtros */}
      <Card title="Filtros del reporte" className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label="Moneda"
            value={filtroMoneda}
            onChange={(e) => setFiltroMoneda(e.target.value as Moneda)}
            options={[
              { value: 'BOB', label: 'BOB - Bolivianos' },
              { value: 'USD', label: 'USD - Dólares' },
            ]}
          />
          <Select
            label="Billetera"
            value={filtroBilletera}
            onChange={(e) => setFiltroBilletera(e.target.value as Billetera | '')}
            options={[
              { value: '', label: 'Todos' },
              { value: 'efectivo', label: '💵 Efectivo' },
              { value: 'banco', label: '🏦 Banco' },
              { value: 'app', label: '📱 App' },
            ]}
          />
          <Select
            label="Tipo"
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value as 'mensual' | 'semanal')}
            options={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'semanal', label: 'Semanal' },
            ]}
          />
          <Select
            label="Mes"
            value={String(mes)}
            onChange={(e) => setMes(parseInt(e.target.value))}
            options={meses.map((m) => ({ value: String(m.value), label: m.label }))}
          />
          <Select
            label="Año"
            value={String(anio)}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            options={anios.map((a) => ({ value: String(a), label: String(a) }))}
          />
          {tipoReporte === 'semanal' ? (
            <Select
              label="Semana"
              value={semanaSeleccionada}
              onChange={(e) => setSemanaSeleccionada(e.target.value)}
              options={semanasDelMes.map((s) => ({ value: s.value, label: s.label }))}
            />
          ) : (
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={includeEmpty}
                  onChange={(e) => setIncludeEmpty(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  Incluir motivos vacíos
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {tipoReporte === 'mensual' && (
            <Button onClick={generarExcel} disabled={generando} className="w-full sm:w-auto">
              {generando ? '⏳ Generando...' : '📥 Reporte Mensual'}
            </Button>
          )}
          {tipoReporte === 'semanal' && (
            <Button variant="secondary" onClick={generarExcelReporteSemanal} disabled={generando} className="w-full sm:w-auto">
              {generando ? '⏳ Generando...' : '📥 Reporte Semanal'}
            </Button>
          )}
          <Button variant="ghost" onClick={cargarPreview} disabled={loading} className="w-full sm:w-auto">
            🔄 Actualizar
          </Button>
        </div>
      </Card>

      {error && <ErrorMessage message={error} />}

      {/* Preview del reporte */}
      {loading ? (
        <Loading />
      ) : reportePreview ? (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
            <Card>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Transacciones</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{totalTransacciones}</p>
            </Card>
            <Card>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Ingresos</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-ingreso)' }}>
                Bs{totalIngresos.toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Gastos</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-gasto)' }}>
                Bs{totalGastos.toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance</p>
              <p
                className="text-2xl font-bold"
                style={{ color: (totalIngresos - totalGastos) >= 0 ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
              >
                Bs{(totalIngresos - totalGastos).toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Vista previa jerárquica */}
          <Card title={`Vista previa - ${reportePreview.nombreMes.charAt(0).toUpperCase() + reportePreview.nombreMes.slice(1)}`}>
            {totalTransacciones === 0 && (
              <p className="text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                No hay transacciones en este período.
              </p>
            )}

            {(() => {
              const { transacciones, categorias, motivos } = reportePreview;

              // Agrupar por categoría > motivo
              const transByCat: Record<string, Record<string, typeof transacciones>> = {};
              for (const t of transacciones) {
                if (!transByCat[t.categoriaId]) transByCat[t.categoriaId] = {};
                if (!transByCat[t.categoriaId][t.motivoId]) transByCat[t.categoriaId][t.motivoId] = [];
                transByCat[t.categoriaId][t.motivoId].push(t);
              }

              return (
                <div className="space-y-4">
                  {categorias.map((cat) => {
                    const transCat = transByCat[cat.id] || {};
                    const motivosCat = motivos.filter((m) => m.categoriaId === cat.id);
                    const hasTrans = Object.keys(transCat).length > 0;
                    const hasEmptyMotivos = includeEmpty && motivosCat.some(
                      (m) => m.mostrarSinTransacciones && !transCat[m.id]
                    );

                    if (!hasTrans && !hasEmptyMotivos) return null;

                    let catTotal = 0;

                    return (
                      <div key={cat.id} className="border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                        <h3
                          className="font-bold text-base mb-2"
                          style={{ color: cat.tipo === 'ingreso' ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
                        >
                          ▸ {cat.nombre}
                        </h3>

                        <div className="space-y-1 ml-4">
                          {motivosCat.map((motivo) => {
                            const transMotivo = transCat[motivo.id] || [];
                            const hasTrans = transMotivo.length > 0;

                            if (!hasTrans) {
                              if (includeEmpty && motivo.mostrarSinTransacciones) {
                                return (
                                  <div key={motivo.id} className="text-sm flex justify-between max-w-md" style={{ color: 'var(--color-text-muted)' }}>
                                    <span>• {motivo.nombre} — Sin transacciones</span>
                                    <span className="shrink-0">Bs0.00</span>
                                  </div>
                                );
                              }
                              return null;
                            }

                            const motivoTotal = transMotivo.reduce((sum, t) => sum + Number(t.monto), 0);
                            catTotal += motivoTotal;

                            return (
                              <div key={motivo.id}>
                                <div className="flex items-center gap-3 max-w-md">
                                  <span className="font-medium text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                    • {motivo.nombre}
                                  </span>
                                  {transMotivo.length > 1 && (
                                    <span className="font-bold text-sm shrink-0" style={{ color: 'var(--color-text)' }}>
                                      Bs{motivoTotal.toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                {transMotivo.length === 1 ? (
                                  // Una sola transacción: mostrar inline
                                  <div className="flex items-center gap-3 max-w-md ml-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                    <span className="flex-1 min-w-0 truncate">
                                      {formatFecha(transMotivo[0].fecha)}
                                      {transMotivo[0].descripcion && ` — ${transMotivo[0].descripcion}`}
                                    </span>
                                    <span className="font-medium shrink-0" style={{ color: 'var(--color-text)' }}>
                                      Bs{Number(transMotivo[0].monto).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  // Múltiples transacciones: listar cada una
                                  <div className="ml-4 space-y-1">
                                    {transMotivo.map((t) => (
                                      <div key={t.id} className="flex items-center gap-3 max-w-md text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        <span className="flex-1 min-w-0 truncate">
                                          {formatFecha(t.fecha)}
                                          {t.descripcion && ` — ${t.descripcion}`}
                                        </span>
                                        <span className="font-medium shrink-0" style={{ color: 'var(--color-text)' }}>
                                          Bs{Number(t.monto).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Total categoría */}
                        <div className="flex items-center gap-3 max-w-md mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                          <span className="font-bold text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--color-text)' }}>
                            Total {cat.nombre}
                          </span>
                          <span className="font-bold text-base shrink-0" style={{ color: cat.tipo === 'ingreso' ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}>
                            Bs{catTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </>
      ) : null}
    </div>
  );
};
