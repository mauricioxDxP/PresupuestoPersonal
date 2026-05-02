import axios from 'axios';

// Usa la variable de entorno si existe, sino detecta el hostname actual
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL + '/api';
  
  const hostname = 'localhost';
  const port = '3001';
  return `http://${hostname}:${port}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para actualizar el header de casa desde AuthContext
export function setCasaHeader(casaId: string | null) {
  if (casaId) {
    api.defaults.headers.common['x-casa-id'] = casaId;
  } else {
    delete api.defaults.headers.common['x-casa-id'];
  }
}

export default api;
