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
