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
  apariencia?: string;
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
  const [columnsPerRow, setColumnsPerRow] = useState(5);
  const [limiteMaximo, setLimiteMaximo] = useState(20);
  const [totalActual, setTotalActual] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([cargarCriaturas(), cargarEstadoActual()]);
      setLoading(false);
    };
    cargarDatos();
  }, [params.id]);

  const cargarEstadoActual = async () => {
    try {
      const response = await fetch(`/api/semilleros/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const actuales = data.semillero.criaturas.map((sc: any) => ({
          criaturaId: sc.id,
          cantidad: sc.cantidad,
          criatura: sc
        }));
        setSeleccionadas(actuales);
        setLimiteMaximo(data.semillero.LimiteMaximo || 20);
        
        const total = actuales.reduce((acc: number, curr: any) => acc + curr.cantidad, 0);
        setTotalActual(total);
      }
    } catch (error) {
      console.error('Error cargando estado actual:', error);
    }
  };

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
        return prev.filter(s => s.criaturaId !== criaturaId);
      }

      if (existing) {
        const newSeleccionadas = prev.map(s =>
          s.criaturaId === criaturaId
            ? { ...s, cantidad }
            : s
        );
        const newTotal = newSeleccionadas.reduce((acc: number, curr: any) => acc + curr.cantidad, 0);
        setTotalActual(newTotal);
        return newSeleccionadas;
      } else {
        const newSeleccionadas = [...prev, { criaturaId, cantidad, criatura }];
        const newTotal = newSeleccionadas.reduce((acc: number, curr: any) => acc + curr.cantidad, 0);
        setTotalActual(newTotal);
        return newSeleccionadas;
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

  const criaturasFiltradas = criaturas.filter((criatura) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      criatura.nombre.toLowerCase().includes(query) ||
      criatura.clasificacion?.toLowerCase().includes(query);
    const matchesTipo = tipoFilter === '' || criatura.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Gestionar Criaturas</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.createButton} onClick={handleGuardar} disabled={saving || seleccionadas.length === 0}>
            {saving ? 'Guardando...' : `Guardar (${seleccionadas.length})`}
          </button>
          <button className={styles.logoutButton} onClick={handleVolver}>
            ← Volver
          </button>
        </div>
      </div>

      <div className={styles.semillerosSection}>
        <div className={styles.addCriaturasInfo} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>Modifica la cantidad de cada criatura. Si estableces una cantidad en 0, se eliminará del semillero.</p>
          <div style={{ 
            background: totalActual > limiteMaximo ? '#ef4444' : 'rgba(255,255,255,0.1)', 
            padding: '0.5rem 1rem', 
            borderRadius: '12px',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}>
            Total: {totalActual} / {limiteMaximo}
          </div>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            className={`${styles.immersiveSearchInput} ${styles.searchBarInput}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]/g, ''))}
            placeholder="Buscar por nombre o clasificación..."
          />
          <select
            className={`${styles.immersiveSearchInput} ${styles.searchSelect}`}
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
          <select
            className={`${styles.immersiveSearchInput} ${styles.searchSelect}`}
            value={columnsPerRow}
            onChange={(e) => setColumnsPerRow(Number(e.target.value))}
          >
            <option value={5}>5 por fila</option>
            <option value={8}>8 por fila</option>
          </select>
        </div>

        {error && (
          <div className={styles.error} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'white', border: '1px solid #ef4444' }}>
            <p>{error}</p>
          </div>
        )}

        {criaturasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 style={{ color: 'white' }}>No se encontraron criaturas</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Prueba con otro nombre o borra el filtro.</p>
          </div>
        ) : (
          <div
            className={`${styles.criaturasGrid} ${columnsPerRow === 8 ? styles.grid8 : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
          >
            {criaturasFiltradas.map((criatura) => {
              const cantidad = getCantidadSeleccionada(criatura.id);
              return (
                <div
                  key={criatura.id}
                  className={styles.immersiveCriaturaCard}
                  style={{ cursor: 'default' }}
                >
                  <div className={styles.criaturaHeader}>
                    <h3 className={styles.immersiveCriaturaName}>{criatura.nombre}</h3>
                  </div>
                  {criatura.apariencia && criatura.apariencia.startsWith('http') ? (
                    <img
                      src={criatura.apariencia}
                      alt={criatura.nombre}
                      className={styles.criaturaCardImage}
                    />
                  ) : (
                    <div style={{ height: '100px' }} />
                  )}
                  
                  <div className={`${styles.cardQuantityControls} ${cantidad > 0 ? styles.cardQuantityControlsActive : ''}`}>
                    <button
                      className={styles.cardQuantityButton}
                      onClick={() => handleCantidadChange(criatura.id, cantidad - 1)}
                      disabled={cantidad === 0}
                    >
                      -
                    </button>
                    <span className={styles.cardQuantityValue}>{cantidad}</span>
                    <button
                      className={styles.cardQuantityButton}
                      onClick={() => handleCantidadChange(criatura.id, cantidad + 1)}
                      disabled={totalActual >= limiteMaximo}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.addCriaturasActions} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <button
            className={styles.logoutButton}
            onClick={handleVolver}
            disabled={saving}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            Cancelar
          </button>
          <button
            className={styles.createButton}
            onClick={handleGuardar}
            disabled={saving || seleccionadas.length === 0 || totalActual > limiteMaximo}
            style={{ padding: '0.75rem 2.5rem' }}
          >
            {saving ? 'Guardando...' : `Confirmar Selección (${seleccionadas.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}