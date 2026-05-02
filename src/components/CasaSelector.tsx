import { useAuth } from '../context/AuthContext';

export function CasaSelector() {
  const { user, selectedCasaId, setSelectedCasaId } = useAuth();

  if (!user || user.casas.length <= 1) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCasaId = e.target.value;
    setSelectedCasaId(newCasaId);
    // selectedCasaId change triggers refreshPermisos in AuthContext
  };

  return (
    <div className="flex items-center gap-2">
      <label
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Casa:
      </label>
      <select
        value={selectedCasaId || ''}
        onChange={handleChange}
        className="px-3 py-1.5 rounded-lg border text-sm"
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: 'var(--color-input-border)',
          color: 'var(--color-text)',
        }}
      >
        {user.casas.map((casa) => (
          <option key={casa.id} value={casa.id}>
            {casa.nombre} ({casa.rol === 'MAESTRO_CASA' ? 'Maestro' : 'Usuario'})
          </option>
        ))}
      </select>
    </div>
  );
}
