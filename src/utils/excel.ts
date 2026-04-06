import * as XLSX from 'xlsx';

export interface ExcelRow {
  nombre: string;
  tipo?: 'ingreso' | 'gasto';
  categoriaId?: string;
  orden?: number;
}

// Para transacciones
export interface TransaccionExcelRow {
  monto: number;
  fecha: string;
  descripcion?: string;
  categoria?: string;  // Nombre de categoría en vez de ID
  motivo?: string;   // Nombre de motivo en vez de ID
  facturable?: boolean;
}

export const exportToExcel = <T>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const importFromExcel = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Convierte una fecha de Excel a string YYYY-MM-DD.
 * Excel guarda fechas como números de serie (días desde 1899-12-30).
 * Si ya es string, lo devuelve tal cual.
 */
export const parseExcelDate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    // Ya es string, validar formato básico
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Intentar parsear otros formatos
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return null;
  }
  
  if (typeof value === 'number') {
    // Número de serie de Excel → Date
    // 25569 = días entre 1899-12-30 y 1970-01-01
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return null;
  }
  
  return null;
};

export const importTransaccionesFromExcel = (file: File): Promise<TransaccionExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<TransaccionExcelRow>(worksheet, { defval: null });
        
        // Normalizar fechas: convertir números de serie Excel a strings YYYY-MM-DD
        const normalized = json.map(row => ({
          ...row,
          fecha: parseExcelDate(row.fecha) ?? row.fecha,
          descripcion: row.descripcion ?? '',
          categoria: row.categoria ?? '',
          motivo: row.motivo ?? '',
          facturable: row.facturable ?? false,
        }));
        
        resolve(normalized);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Formatea una fecha ISO usando UTC para evitar el desfase de zona horaria.
 * Esto asegura que '2026-04-01T00:00:00.000Z' se muestre como 01/04/2026
 * sin importar la configuración regional del navegador.
 */
const formatFechaCorregida = (fecha: string): string => {
  const d = new Date(fecha);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const downloadTemplate = (type: 'categoria' | 'motivo' | 'transaccion'): void => {
  if (type === 'categoria') {
    exportToExcel([{ nombre: 'Ejemplo', tipo: 'gasto' }], 'template_categorias', 'Categorías');
  } else if (type === 'motivo') {
    exportToExcel([{ nombre: 'Ejemplo', categoriaId: 'Nombre de categoría', orden: 1 }], 'template_motivos', 'Motivos');
  } else {
    // Template para transacciones con nombres
    exportToExcel([{ 
      monto: 1000, 
      fecha: '2024-01-01', 
      descripcion: 'Ejemplo', 
      categoria: 'Alimentación', 
      motivo: 'Supermercado',
      facturable: false 
    }] as TransaccionExcelRow[], 'template_transacciones', 'Transacciones');
  }
};

/**
 * Genera un reporte mensual jerárquico en Excel.
 * 
 * Estructura:
 *   CATEGORÍA (total)
 *     Motivo (total)
 *       Transacción individual (fecha, monto, descripción) — si hay >1 transacción
 *       O si hay 1 sola: motivo + fecha + monto + descripción en una fila
 *     Motivo sin transacciones (si includeEmpty=true y mostrarSinTransacciones=true)
 *   TOTAL CATEGORÍA
 */
export interface ReporteMensualData {
  transacciones: Array<{
    id: string;
    monto: number | string;
    fecha: string;
    descripcion: string | null;
    motivoId: string;
    categoriaId: string;
    motivo: { id: string; nombre: string; orden: number; mostrarSinTransacciones: boolean };
    categoria: { id: string; nombre: string; tipo: string };
  }>;
  categorias: Array<{ id: string; nombre: string; tipo: string }>;
  motivos: Array<{ id: string; nombre: string; categoriaId: string; orden: number; mostrarSinTransacciones: boolean }>;
  nombreMes: string;
}

export const generateMonthlyReport = (
  data: ReporteMensualData,
  includeEmpty: boolean,
): void => {
  const { transacciones, categorias, motivos, nombreMes } = data;

  // Capitalizar nombre del mes
  const tituloMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  // Agrupar transacciones por categoría > motivo
  const transByCatMotivo: Record<string, Record<string, typeof transacciones>> = {};
  for (const t of transacciones) {
    const catId = t.categoriaId;
    const motId = t.motivoId;
    if (!transByCatMotivo[catId]) transByCatMotivo[catId] = {};
    if (!transByCatMotivo[catId][motId]) transByCatMotivo[catId][motId] = [];
    transByCatMotivo[catId][motId].push(t);
  }

  // Construir filas del reporte
  const rows: Record<string, unknown>[] = [];

  // Título
  rows.push({
    'REPORTE MENSUAL': tituloMes,
    '': '',
    '': '',
    '': '',
  });
  rows.push({}); // fila vacía

  // Encabezados
  rows.push({
    'Categoría': 'Categoría',
    'Motivo': 'Motivo',
    'Fecha': 'Fecha',
    'Monto': 'Monto',
    'Descripción': 'Descripción',
  });

  // Procesar cada categoría
  for (const cat of categorias) {
    const transCat = transByCatMotivo[cat.id] || {};
    const motivosCat = motivos.filter((m) => m.categoriaId === cat.id);

    // Verificar si esta categoría tiene algo que mostrar
    const hasTransactions = Object.keys(transCat).length > 0;
    const hasEmptyMotivos = includeEmpty && motivosCat.some(
      (m) => m.mostrarSinTransacciones && !transCat[m.id]
    );

    if (!hasTransactions && !hasEmptyMotivos) continue;

    let catTotal = 0;
    const motivoRows: Record<string, unknown>[] = [];

    for (const motivo of motivosCat) {
      const transMotivo = transCat[motivo.id] || [];
      const hasTrans = transMotivo.length > 0;

      // Si no tiene transacciones, solo mostrar si includeEmpty y mostrarSinTransacciones
      if (!hasTrans) {
        if (includeEmpty && motivo.mostrarSinTransacciones) {
          motivoRows.push({
            'Categoría': '',
            'Motivo': motivo.nombre,
            'Fecha': '—',
            'Monto': 0,
            'Descripción': 'Sin transacciones',
          });
        }
        continue;
      }

      const motivoTotal = transMotivo.reduce((sum, t) => sum + Number(t.monto), 0);
      catTotal += motivoTotal;

      if (transMotivo.length === 1) {
        // Una sola transacción: mostrar todo en una fila
        const t = transMotivo[0];
        const fecha = formatFechaCorregida(t.fecha);
        motivoRows.push({
          'Categoría': '',
          'Motivo': motivo.nombre,
          'Fecha': fecha,
          'Monto': motivoTotal,
          'Descripción': t.descripcion || '',
        });
      } else {
        // Múltiples transacciones: fila del motivo con total
        motivoRows.push({
          'Categoría': '',
          'Motivo': `${motivo.nombre} (Total)`,
          'Fecha': '',
          'Monto': motivoTotal,
          'Descripción': '',
        });
        // Luego cada transacción
        for (const t of transMotivo) {
          const fecha = formatFechaCorregida(t.fecha);
          motivoRows.push({
            'Categoría': '',
            'Motivo': '',
            'Fecha': fecha,
            'Monto': Number(t.monto),
            'Descripción': t.descripcion || '',
          });
        }
      }
    }

    if (motivoRows.length === 0) continue;

    // Fila de categoría
    rows.push({
      'Categoría': `▸ ${cat.nombre}`,
      'Motivo': '',
      'Fecha': '',
      'Monto': '',
      'Descripción': '',
    });

    // Filas de motivos
    for (const row of motivoRows) {
      rows.push(row);
    }

    // Total de categoría
    rows.push({
      'Categoría': `  Total ${cat.nombre}`,
      'Motivo': '',
      'Fecha': '',
      'Monto': catTotal,
      'Descripción': '',
    });

    // Fila vacía separadora
    rows.push({});
  }

  // Gran total
  const totalIngresos = transacciones
    .filter((t) => t.categoria.tipo === 'ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0);
  const totalGastos = transacciones
    .filter((t) => t.categoria.tipo === 'gasto')
    .reduce((sum, t) => sum + Number(t.monto), 0);

  rows.push({
    'Categoría': 'RESUMEN',
    'Motivo': '',
    'Fecha': '',
    'Monto': '',
    'Descripción': '',
  });
  rows.push({
    'Categoría': 'Total Ingresos',
    'Motivo': '',
    'Fecha': '',
    'Monto': totalIngresos,
    'Descripción': '',
  });
  rows.push({
    'Categoría': 'Total Gastos',
    'Motivo': '',
    'Fecha': '',
    'Monto': totalGastos,
    'Descripción': '',
  });
  rows.push({
    'Categoría': 'Balance',
    'Motivo': '',
    'Fecha': '',
    'Monto': totalIngresos - totalGastos,
    'Descripción': '',
  });

  // Crear y descargar el archivo
  const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

  // Ajustar anchos de columna
  worksheet['!cols'] = [
    { wch: 25 }, // Categoría
    { wch: 30 }, // Motivo
    { wch: 14 }, // Fecha
    { wch: 14 }, // Monto
    { wch: 35 }, // Descripción
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, tituloMes);
  XLSX.writeFile(workbook, `reporte_${tituloMes.replace(/\s/g, '_')}.xlsx`);
};
