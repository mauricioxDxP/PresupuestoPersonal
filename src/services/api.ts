import axios from 'axios';

// Usa la variable de entorno si existe, sino detecta el hostname actual
// Esto funciona tanto en localhost como en la red local
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL + '/api';
  
  // En desarrollo o red local: usa el mismo host que la página
  const hostname = window.location.hostname;
  const port = import.meta.env.DEV ? '3001' : '3001';
  return `http://${hostname}:${port}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
