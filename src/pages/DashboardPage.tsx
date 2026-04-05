import React, { useState, useEffect } from 'react';
import { transaccionesService } from '../services';
import type { Reportes, Transaccion } from '../types';
import { Card, Loading, ErrorMessage } from '../components/UI';

export const DashboardPage: React.FC = () => {
  const [reportes, setReportes] = useState<Reportes | null>(null);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [reportesData, transData] = await Promise.all([
        transaccionesService.getReportes(),
        transaccionesService.getAll(),
      ]);
      setReportes(reportesData);
      setTransaccionesRecientes(transData.data.slice(0, 5));
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
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && <ErrorMessage message={error} />}

      {/* Totales */}
      {reportes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-gray-500">Total Ingresos</p>
            <p className="text-3xl font-bold text-green-600">
              Bs{reportes.totalIngresos.toFixed(2)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Total Gastos</p>
            <p className="text-3xl font-bold text-red-600">Bs{reportes.totalGastos.toFixed(2)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Balance</p>
            <p
              className={`text-3xl font-bold ${reportes.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              Bs{reportes.balance.toFixed(2)}
            </p>
          </Card>
        </div>
      )}

      {/* Por categoría */}
      {reportes && reportes.porCategoria.length > 0 && (
        <Card title="Por Categoría" className="mb-8">
          <div className="space-y-2">
            {reportes.porCategoria.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>{cat.nombre}</span>
                <span
                  className={`font-medium ${cat.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
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
            <div key={trans.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="font-medium">{trans.motivo?.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">({trans.categoria?.nombre})</span>
              </div>
              <span
                className={`font-bold ${trans.categoria?.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
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
