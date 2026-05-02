import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { setCasaHeader } from '../services/api';
import { clearCache } from '../services/cache';

export enum Rol {
  ADMIN = 'ADMIN',
  MAESTRO_CASA = 'MAESTRO_CASA',
  USUARIO = 'USUARIO',
}

export interface Casa {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  casas: Casa[];
  casaIds: string[];
}

export interface CategoriaPermiso {
  id: string;
  categoriaId: string;
  categoria: {
    id: string;
    nombre: string;
    tipo: string;
  };
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export interface MotivoPermiso {
  id: string;
  motivoId: string;
  motivo: {
    id: string;
    nombre: string;
  };
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

interface AuthState {
  user: User | null;
  selectedCasaId: string | null;
  permisos: {
    rol: Rol;
    casaIds: string[];
    casaId?: string;
    categoriaPermisos: CategoriaPermiso[];
    motivoPermisos: MotivoPermiso[];
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  googleAuth: (googleToken: string, casaId?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (categoriaId: string, motivoId?: string | null, action?: 'crear' | 'editar' | 'eliminar') => boolean;
  refreshPermisos: () => Promise<void>;
  setSelectedCasaId: (casaId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const SELECTED_CASA_KEY = 'selected_casa_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    selectedCasaId: null,
    permisos: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedCasaId = localStorage.getItem(SELECTED_CASA_KEY);
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCasaHeader(savedCasaId);
      setState(s => ({ ...s, selectedCasaId: savedCasaId }));
      loadUserFromToken(token);
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  // When selectedCasaId changes, refresh permisos to get fresh data for that casa
  useEffect(() => {
    if (state.isAuthenticated && state.selectedCasaId && refreshPermisos) {
      refreshPermisos();
    }
  }, [state.selectedCasaId, state.isAuthenticated]);

  const loadUserFromToken = async (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: payload.sub,
        email: payload.email,
        nombre: payload.nombre || '',
        rol: payload.rol,
        casaIds: payload.casaIds || [],
        casas: [],
      };
      
      setState(s => ({
        ...s,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));

      await refreshPermisos();
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const refreshPermisos = useCallback(async (retryCount = 0) => {
    try {
      const response = await api.get('/users/me/permisos');
      const permisos = response.data;
      
      setState(s => {
        const newUser = s.user ? {
          ...s.user,
          rol: permisos.rol,
          casaIds: Array.isArray(permisos.casaIds) && permisos.casaIds.length > 0 
            ? permisos.casaIds 
            : (permisos.casaId ? [permisos.casaId] : []),
          casas: permisos.casas || [],
        } : null;
        
        // Auto-select first casa if none selected and user has casas
        // Also clear selectedCasaId if it's no longer valid (user removed from that casa)
        let newSelectedCasaId: string | null = s.selectedCasaId;
        if (newSelectedCasaId && newUser && !newUser.casaIds.includes(newSelectedCasaId)) {
          newSelectedCasaId = null; // Clear invalid selection
          localStorage.removeItem(SELECTED_CASA_KEY);
        }
        if (!newSelectedCasaId && newUser && newUser.casaIds.length > 0) {
          newSelectedCasaId = newUser.casaIds[0];
          localStorage.setItem(SELECTED_CASA_KEY, newSelectedCasaId!);
        }
        
        return {
          ...s,
          permisos,
          user: newUser,
          selectedCasaId: newSelectedCasaId,
        };
      });
    } catch (error) {
      console.error('Error loading permisos:', error);
      // Reintentar hasta 2 veces si hay 503
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000));
        return refreshPermisos(retryCount + 1);
      }
    }
  }, []);

  const setSelectedCasaId = useCallback((casaId: string) => {
    console.log('[Auth] setSelectedCasaId called with:', casaId);
    localStorage.setItem(SELECTED_CASA_KEY, casaId);
    setCasaHeader(casaId);
    console.log('[Auth] Clearing cache...');
    // Clear cache when changing casa to avoid showing stale data
    clearCache();
    console.log('[Auth] Cache cleared, updating state...');
    setState(s => ({ ...s, selectedCasaId: casaId }));
    console.log('[Auth] State updated');
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setState(s => ({
      ...s,
      user,
      isAuthenticated: true,
    }));

    await refreshPermisos();
  };

  const register = async (email: string, password: string, nombre: string) => {
    const response = await api.post('/auth/register', { email, password, nombre });
    const { access_token, user } = response.data;
    
    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setState(s => ({
      ...s,
      user,
      isAuthenticated: true,
    }));

    await refreshPermisos();
  };

  const googleAuth = async (googleToken: string, casaId?: string) => {
    const response = await api.post('/auth/google', { googleToken, casaId });
    const { access_token, user } = response.data;
    
    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setState(s => ({
      ...s,
      user,
      isAuthenticated: true,
    }));

    await refreshPermisos();
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SELECTED_CASA_KEY);
    delete api.defaults.headers.common['Authorization'];
    clearCache();
    setState({
      user: null,
      selectedCasaId: null,
      permisos: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // Force full reload to reset all module-level state (cache, services, etc.)
    window.location.href = '/login';
  };

  const hasPermission = (
    categoriaId: string,
    motivoId: string | null = null,
    action: 'crear' | 'editar' | 'eliminar' = 'crear'
  ): boolean => {
    if (!state.permisos) return false;
    if (state.permisos.rol === Rol.ADMIN || state.permisos.rol === Rol.MAESTRO_CASA) {
      return true;
    }

    if (motivoId) {
      const motivoPermiso = state.permisos.motivoPermisos.find(
        mp => mp.motivoId === motivoId
      );
      if (motivoPermiso) {
        switch (action) {
          case 'crear': return motivoPermiso.puedeCrear;
          case 'editar': return motivoPermiso.puedeEditar;
          case 'eliminar': return motivoPermiso.puedeEliminar;
        }
      }
    }

    const categoriaPermiso = state.permisos.categoriaPermisos.find(
      cp => cp.categoriaId === categoriaId
    );
    if (categoriaPermiso) {
      switch (action) {
        case 'crear': return categoriaPermiso.puedeCrear;
        case 'editar': return categoriaPermiso.puedeEditar;
        case 'eliminar': return categoriaPermiso.puedeEliminar;
      }
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        googleAuth,
        logout,
        hasPermission,
        refreshPermisos,
        setSelectedCasaId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
