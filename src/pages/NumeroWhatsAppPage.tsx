import { useState, useEffect } from 'react';
import { useAuth, Rol } from '../context/AuthContext';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  nombre: string;
  numero?: string | null;
  rol: Rol;
}

export function NumeroWhatsAppPage() {
  const { user, selectedCasaId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [numeroInput, setNumeroInput] = useState('');
  const [casaSelect, setCasaSelect] = useState<string>('');
  const [userCasas, setUserCasas] = useState<{id: string, nombre: string, rol: Rol}[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isMaestro = user?.casas?.find(c => c.id === selectedCasaId)?.rol === Rol.MAESTRO_CASA;

  useEffect(() => {
    if (isMaestro && selectedCasaId) {
      loadUsers();
    }
  }, [isMaestro, selectedCasaId]);

  const loadUsers = async () => {
    try {
      const res = await api.get(`/users?casaId=${selectedCasaId}`);
      // Filter out ADMIN and show all users including MAESTRO_CASA and oneself
      setUsers(res.data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleAsignarNumero = async () => {
    if (!selectedUser) {
      setError('Selecciona un usuario');
      return;
    }

    const numero = numeroInput.trim();
    if (!numero) {
      setError('Ingresa un número de WhatsApp');
      return;
    }

    if (!numero.startsWith('+')) {
      setError('El número debe comenzar con + (ej: +59170000000)');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/users/${selectedUser}`, { numero });
      setSuccess(`Número ${numero} asignado correctamente`);
      setError('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar número');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarNumero = async () => {
    if (!selectedUser) {
      setError('Selecciona un usuario');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/users/${selectedUser}`, { numero: null });
      setSuccess('Número de WhatsApp eliminado');
      setError('');
      setNumeroInput('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar número');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarCasaDefault = async () => {
    if (!selectedUser) {
      setError('Selecciona un usuario');
      return;
    }

    if (!casaSelect) {
      setError('Selecciona una casa');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/${selectedUser}/config-whatsapp`, { casaIdPorDefecto: casaSelect });
      setSuccess('Casa por defecto configurada correctamente');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al configurar casa');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u.id === selectedUser);

  // When selecting a user, also fetch their casas if available
  useEffect(() => {
    if (selectedUser && selectedUserData) {
      // Set default casaSelect to the current selectedCasaId or the user's first casa
      const userCasa = user?.casas?.find(c => c.id === selectedCasaId);
      if (userCasa) {
        setCasaSelect(userCasa.id);
      } else if (user?.casas && user.casas.length > 0) {
        setCasaSelect(user.casas[0].id);
      }
      
      // Also load the selected user's casas for the config
      loadUserCasas(selectedUser);
    }
  }, [selectedUser, selectedUserData, selectedCasaId]);

  const loadUserCasas = async (userId: string) => {
    try {
      const res = await api.get(`/users/${userId}/casas`);
      setUserCasas(res.data);
    } catch (err) {
      console.error('Error loading user casas:', err);
      // Fallback to current user's casas
      setUserCasas(user?.casas || []);
    }
  };

  if (!isMaestro) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Solo el usuario maestro puede configurar números de WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        📱 Configuración WhatsApp
      </h1>

      {error && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{ 
            backgroundColor: 'var(--color-error-bg, #fef2f2)',
            color: 'var(--color-error, #dc2626)'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{ 
            backgroundColor: 'var(--color-success-bg, #f0fdf4)',
            color: 'var(--color-success, #16a34a)'
          }}
        >
          {success}
        </div>
      )}

      <div 
        className="p-6 rounded-xl space-y-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Seleccionar Usuario
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Usuario
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setNumeroInput('');
              setCasaSelect('');
            }}
            className="w-full px-4 py-2 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <option value="">Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.numero || 'sin número'})
              </option>
            ))}
          </select>
        </div>

        {selectedUserData && (
          <div 
            className="p-4 rounded-lg mt-4"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Información del Usuario
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div style={{ color: 'var(--color-text-muted)' }}>Nombre:</div>
              <div style={{ color: 'var(--color-text)' }}>{selectedUserData.nombre}</div>
              <div style={{ color: 'var(--color-text-muted)' }}>Email:</div>
              <div style={{ color: 'var(--color-text)' }}>{selectedUserData.email}</div>
              <div style={{ color: 'var(--color-text-muted)' }}>Número actual:</div>
              <div style={{ color: 'var(--color-text)' }}>
                {selectedUserData.numero || <span className="italic">No asignado</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <>
          <div 
            className="p-6 rounded-xl space-y-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Número de WhatsApp
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Asigna un número de teléfono para que el usuario pueda usar WhatsApp.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Número de WhatsApp
              </label>
              <input
                type="text"
                value={numeroInput}
                onChange={(e) => setNumeroInput(e.target.value)}
                placeholder="+59170000000"
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAsignarNumero}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {loading ? 'Guardando...' : 'Asignar Número'}
              </button>
              
              <button
                onClick={handleLimpiarNumero}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--color-error, #dc2626)',
                  border: '1px solid var(--color-error, #dc2626)'
                }}
              >
                Quitar Número
              </button>
            </div>
          </div>

          <div 
            className="p-6 rounded-xl space-y-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Casa por Defecto para WhatsApp
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Selecciona qué casa usará el usuario en WhatsApp por defecto.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Casa
              </label>
              <select
                value={casaSelect}
                onChange={(e) => setCasaSelect(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="">Selecciona casa</option>
                {userCasas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAsignarCasaDefault}
              disabled={loading || !casaSelect}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-success, #16a34a)', 
                color: '#fff' 
              }}
            >
              {loading ? 'Guardando...' : 'Establecer Casa por Defecto'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}