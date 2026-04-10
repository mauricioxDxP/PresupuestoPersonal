import React, { useState, useEffect, useCallback } from 'react';
import { transaccionesService } from '../services';
import type { Reportes, Transaccion } from '../types';
import { Card, Loading, ErrorMessage } from '../components/UI';

export const DashboardPage: React.FC = () => {
  const [reportes, setReportes] = useState<Reportes | null>(null);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<Transaccion[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(true);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [errorReportes, setErrorReportes] = useState<string | null>(null);
  const [errorTransacciones, setErrorTransacciones] = useState<string | null>(null);

  const fetchReportes = useCallback(async () => {
    try {
      setLoadingReportes(true);
      setErrorReportes(null);
      const data = await transaccionesService.getReportes();
      setReportes(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar reportes';
      setErrorReportes(message);
    } finally {
      setLoadingReportes(false);
    }
  }, []);

  const fetchTransaccionesRecientes = useCallback(async () => {
    try {
      setLoadingTransacciones(true);
      setErrorTransacciones(null);
      const data = await transaccionesService.getAll({}, { page: 1, limit: 5 });
      setTransaccionesRecientes(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar transacciones';
      setErrorTransacciones(message);
    } finally {
      setLoadingTransacciones(false);
    }
  }, []);

  useEffect(() => {
    fetchReportes();
    fetchTransaccionesRecientes();
  }, [fetchReportes, fetchTransaccionesRecientes]);

  // Solo mostrar loading inicial si no hay ningún dato todavía
  const showInitialLoading = !reportes && !transaccionesRecientes.length && loadingReportes && loadingTransacciones;
  const hasError = errorReportes || errorTransacciones;

  if (showInitialLoading) return <Loading />;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Dashboard</h1>

      {hasError && <ErrorMessage message={errorReportes || errorTransacciones || ''} />}

      {/* Totales */}
      {reportes && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Ingresos</p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text-ingreso)' }}>
              Bs{reportes.totalIngresos.toFixed(2)}
            </p>
          </Card>
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Gastos</p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text-gasto)' }}>Bs{reportes.totalGastos.toFixed(2)}</p>
          </Card>
          <Card>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Balance</p>
            <p
              className={`text-2xl sm:text-3xl font-bold`}
              style={{ color: reportes.balance >= 0 ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
            >
              Bs{reportes.balance.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      {/* Por categoría */}
      {reportes && reportes.porCategoria.length > 0 && (
        <Card title="Por Categoría" className="mb-6 sm:mb-8">
          <div className="space-y-2">
            {reportes.porCategoria.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm sm:text-base">{cat.nombre}</span>
                <span
                  className={`font-medium text-sm sm:text-base`}
                  style={{ color: cat.tipo === 'ingreso' ? 'var(--color-text-ingreso)' : 'var(--color-text-gasto)' }}
                >
                  {cat.tipo === 'ingreso' ? '+' : '-'}Bs{cat.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transacciones recientes */}
      <Card title="Transacciones Recientes">
        <div className="space-y-2">
          {transaccionesRecientes.map((trans) => (
            <div key={trans.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-sm sm:text-base">{trans.motivo?.nombre}</span>
                <span className="text-xs sm:text-sm ml-2" style={{ color: 'var(--color-text-muted)' }}>({trans.categoria?.nombre})</span>
              </div>
              <span
                className={`font-bold text-sm sm:text-base shrink-0 ml-2 ${trans.categoria?.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
              >
                {trans.categoria?.tipo === 'ingreso' ? '+' : '-'}Bs{Number(trans.monto).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
