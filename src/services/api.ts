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
  withCredentials: true,
});

// Interceptor para manejar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es 401 y no es una petición de refresh/login, intentamos refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Obtener el refresh token del localStorage
        const refreshToken = localStorage.getItem('auth_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Intentar refresh del token
        const response = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );
        
        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('auth_refresh_token', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Reintentar la petición original
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, redirigir al login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        window.location.href = '/login?t=' + Date.now();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper para actualizar el header de casa desde AuthContext
export function setCasaHeader(casaId: string | null) {
  if (casaId) {
    api.defaults.headers.common['x-casa-id'] = casaId;
  } else {
    delete api.defaults.headers.common['x-casa-id'];
  }
}

export default api;
