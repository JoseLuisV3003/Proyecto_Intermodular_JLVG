'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../dashboard.module.css';

interface Criatura {
  id: number;
  nombre: string;
  clasificacion?: string;
  tipo?: string;
  descripcion?: string;
}

interface CriaturaSeleccionada {
  criaturaId: number;
  cantidad: number;
  criatura: Criatura;
}

export default function AddCriaturasPage() {
  const params = useParams();
  const router = useRouter();
  const [criaturas, setCriaturas] = useState<Criatura[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<CriaturaSeleccionada[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarCriaturas();
  }, []);

  const cargarCriaturas = async () => {
    try {
      const response = await fetch('/api/criaturas');
      if (response.ok) {
        const data = await response.json();
        setCriaturas(data.criaturas);
      } else {
        setError('Error al cargar criaturas');
      }
    } catch (error) {
      console.error('Error cargando criaturas:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (criaturaId: number, cantidad: number) => {
    if (cantidad < 0) return;

    setSeleccionadas(prev => {
      const existing = prev.find(s => s.criaturaId === criaturaId);
      const criatura = criaturas.find(c => c.id === criaturaId);

      if (!criatura) return prev;

      if (cantidad === 0) {
        // Remover si cantidad es 0
        return prev.filter(s => s.criaturaId !== criaturaId);
      }

      if (existing) {
        // Actualizar cantidad existente
        return prev.map(s =>
          s.criaturaId === criaturaId
            ? { ...s, cantidad }
            : s
        );
      } else {
        // Agregar nueva selección
        return [...prev, { criaturaId, cantidad, criatura }];
      }
    });
  };

  const handleGuardar = async () => {
    if (seleccionadas.length === 0) {
      router.push(`/dashboard/${params.id}`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/semilleros/${params.id}/criaturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criaturas: seleccionadas.map(s => ({
            criaturaId: s.criaturaId,
            cantidad: s.cantidad
          }))
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/${params.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar criaturas');
      }
    } catch (error) {
      console.error('Error guardando criaturas:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleVolver = () => {
    router.push(`/dashboard/${params.id}`);
  };

  const getCantidadSeleccionada = (criaturaId: number) => {
    const seleccionada = seleccionadas.find(s => s.criaturaId === criaturaId);
    return seleccionada ? seleccionada.cantidad : 0;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando criaturas...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Añadir Criaturas al Semillero</h1>
        <button className={styles.logoutButton} onClick={handleVolver}>
          ← Volver
        </button>
      </div>

      <div className={styles.semillerosSection}>
        <div className={styles.addCriaturasInfo}>
          <p>Selecciona las criaturas que quieres añadir a tu semillero y especifica la cantidad de cada una.</p>
          {seleccionadas.length > 0 && (
            <div className={styles.seleccionSummary}>
              <strong>{seleccionadas.length} criatura(s) seleccionada(s)</strong>
            </div>
          )}
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar criaturas por nombre o clasificación..."
          />
          <select
            className={`${styles.searchInput} ${styles.searchSelect}`}
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="Normal">Normal</option>
            <option value="Subtipo">Subtipo</option>
            <option value="Legendarios">Legendarios</option>
            <option value="Venerables">Venerables</option>
            <option value="Desterrados">Desterrados</option>
            <option value="Prohibidos">Prohibidos</option>
            <option value="Extintos">Extintos</option>
          </select>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {criaturas.filter((criatura) => {
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch =
              query === '' ||
              criatura.nombre.toLowerCase().includes(query) ||
              criatura.clasificacion?.toLowerCase().includes(query);
            const matchesTipo = tipoFilter === '' || criatura.tipo === tipoFilter;
            return matchesSearch && matchesTipo;
          }).length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No se encontraron criaturas</h3>
            <p>Prueba con otro nombre o borra el filtro.</p>
          </div>
        ) : (
          <div className={styles.criaturasList}>
            {criaturas
              .filter((criatura) => {
                const query = searchTerm.toLowerCase().trim();
                const matchesSearch =
                  query === '' ||
                  criatura.nombre.toLowerCase().includes(query) ||
                  criatura.clasificacion?.toLowerCase().includes(query);
                const matchesTipo = tipoFilter === '' || criatura.tipo === tipoFilter;
                return matchesSearch && matchesTipo;
              })
              .map((criatura) => (
                <div key={criatura.id} className={styles.criaturaAddCard}>
              <div className={styles.criaturaInfo}>
                <h3 className={styles.criaturaName}>{criatura.nombre}</h3>
                {criatura.clasificacion && (
                  <p className={styles.criaturaClasificacion}>{criatura.clasificacion}</p>
                )}
                {criatura.descripcion && (
                  <p className={styles.criaturaDesc}>
                    {criatura.descripcion.length > 150
                      ? `${criatura.descripcion.substring(0, 150)}...`
                      : criatura.descripcion}
                  </p>
                )}
              </div>

              <div className={styles.cantidadControls}>
                <label className={styles.cantidadLabel}>Cantidad:</label>
                <div className={styles.cantidadInputGroup}>
                  <button
                    className={styles.cantidadButton}
                    onClick={() => handleCantidadChange(criatura.id, getCantidadSeleccionada(criatura.id) - 1)}
                    disabled={getCantidadSeleccionada(criatura.id) === 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={getCantidadSeleccionada(criatura.id)}
                    onChange={(e) => handleCantidadChange(criatura.id, parseInt(e.target.value) || 0)}
                    className={styles.cantidadInput}
                  />
                  <button
                    className={styles.cantidadButton}
                    onClick={() => handleCantidadChange(criatura.id, getCantidadSeleccionada(criatura.id) + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className={styles.addCriaturasActions}>
          <button
            className={styles.cancelButton}
            onClick={handleVolver}
            disabled={saving}
          >
            Volver sin guardar
          </button>
          <button
            className={styles.createButton}
            onClick={handleGuardar}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}