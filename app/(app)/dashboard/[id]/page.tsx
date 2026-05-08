'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

interface Criatura {
  id: number;
  nombre: string;
  clasificacion?: string;
  tipo?: string;
  danio_base?: number;
  germinacion?: string;
  descripcion?: string;
  apariencia?: string;
  observaciones?: string;
  forma_ser?: string;
  cantidad: number;
  habilidades: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
  depredadores: Array<{
    id: number;
    descripcion?: string;
  }>;
}

interface Semillero {
  id: number;
  nombre: string;
  criaturas: Criatura[];
}

export default function SemilleroDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [semillero, setSemillero] = useState<Semillero | null>(null);
  const [selectedCriatura, setSelectedCriatura] = useState<Criatura | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cantidadAEliminar, setCantidadAEliminar] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState(5);

  const criaturasAMostrar = semillero
    ? semillero.criaturas.filter((criatura) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          query === '' ||
          criatura.nombre.toLowerCase().includes(query) ||
          criatura.clasificacion?.toLowerCase().includes(query);
        const matchesTipo = tipoFilter === '' || criatura.tipo === tipoFilter;
        return matchesSearch && matchesTipo;
      })
    : [];
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      cargarSemillero();
    }
  }, [params.id]);

  const cargarSemillero = async () => {
    try {
      const response = await fetch(`/api/semilleros/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSemillero(data.semillero);
      } else {
        setError('Semillero no encontrado');
      }
    } catch (error) {
      console.error('Error cargando semillero:', error);
      setError('Error al cargar el semillero');
    } finally {
      setLoading(false);
    }
  };

  const handleCriaturaClick = (criatura: Criatura) => {
    setSelectedCriatura(criatura);
  };

  const handleCloseModal = () => {
    setSelectedCriatura(null);
  };

  const handleAddCriaturas = () => {
    router.push(`/dashboard/${params.id}/add-criaturas`);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleOpenDeleteModal = () => {
    if (selectedCriatura) {
      setCantidadAEliminar(1);
      setShowDeleteModal(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCantidadAEliminar(1);
  };

  const handleEliminarCriatura = async () => {
    if (!selectedCriatura) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/semilleros/${params.id}/criaturas`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criaturaId: selectedCriatura.id,
          cantidad: cantidadAEliminar
        }),
      });

      if (response.ok) {
        const data = await response.json();
        handleCloseDeleteModal();
        setSelectedCriatura(null);
        // Recargar el semillero
        cargarSemillero();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar criatura');
      }
    } catch (error) {
      console.error('Error eliminando criatura:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeCantidadEliminar = (valor: number) => {
    if (!selectedCriatura) return;
    const maximo = selectedCriatura.cantidad;
    if (valor >= 0 && valor <= maximo) {
      setCantidadAEliminar(valor);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando semillero...</div>
      </div>
    );
  }

  if (error || !semillero) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error || 'Semillero no encontrado'}</p>
          <button className={styles.createButton} onClick={handleBackToDashboard}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{semillero.nombre}</h1>
        <button className={styles.logoutButton} onClick={handleBackToDashboard}>
          ← Volver
        </button>
      </div>

      <div className={styles.semillerosSection}>
        <h2 className={styles.sectionTitle}>Criaturas en el Semillero</h2>
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
          <select
            className={`${styles.searchInput} ${styles.searchSelect}`}
            value={columnsPerRow}
            onChange={(e) => setColumnsPerRow(Number(e.target.value))}
            title="Criaturas por fila"
          >
            <option value={5}>5 por fila</option>
            <option value={8}>8 por fila</option>
          </select>
          {semillero.criaturas.length > 0 && (
            <button className={styles.createButton} onClick={handleAddCriaturas} style={{ margin: 0, padding: '0.5rem 1rem' }}>
              Añadir Más Criaturas
            </button>
          )}
        </div>

        {criaturasAMostrar.length === 0 ? (
          searchTerm.trim() ? (
            <div className={styles.emptyState}>
              <h3>No se encontraron criaturas</h3>
              <p>Prueba con otro nombre o borra el filtro.</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3>No tienes criaturas en este semillero</h3>
              <p>Añade criaturas para empezar tu colección.</p>
              <button className={styles.createButton} onClick={handleAddCriaturas}>
                Añadir Criaturas
              </button>
            </div>
          )
        ) : (
          <div 
            className={`${styles.criaturasGrid} ${columnsPerRow === 8 ? styles.grid8 : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
          >
            {criaturasAMostrar.map((criatura) => (
              <div
                key={criatura.id}
                className={styles.criaturaCard}
                onClick={() => handleCriaturaClick(criatura)}
              >
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.criaturaName}>{criatura.nombre}</h3>
                  <span className={styles.cantidadBadge}>x{criatura.cantidad}</span>
                </div>
                {criatura.apariencia && criatura.apariencia.startsWith('http') && (
                  <img
                    src={criatura.apariencia}
                    alt={criatura.nombre}
                    className={styles.criaturaCardImage}
                  />
                )}
                {columnsPerRow !== 8 && criatura.clasificacion && (
                  <p className={styles.criaturaClasificacion}>{criatura.clasificacion}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles de criatura */}
      {selectedCriatura && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedCriatura.nombre}</h2>
              <button className={styles.closeButton} onClick={handleCloseModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.criaturaDetails}>
                {/* Columna de Texto */}
                <div className={styles.criaturaInfoText}>
                  {selectedCriatura.clasificacion && (
                    <div className={styles.detailRow}>
                      <strong>Clasificación:</strong> {selectedCriatura.clasificacion}
                    </div>
                  )}

                  {selectedCriatura.danio_base && (
                    <div className={styles.detailRow}>
                      <strong>Daño Base:</strong> {selectedCriatura.danio_base}
                    </div>
                  )}

                  {selectedCriatura.descripcion && (
                    <div className={styles.detailRow}>
                      <strong>Descripción:</strong>
                      <p>{selectedCriatura.descripcion}</p>
                    </div>
                  )}

                  {selectedCriatura.forma_ser && (
                    <div className={styles.detailRow}>
                      <strong>Forma de Ser:</strong>
                      <p>{selectedCriatura.forma_ser}</p>
                    </div>
                  )}

                  {selectedCriatura.germinacion && (
                    <div className={styles.detailRow}>
                      <strong>Germinación:</strong>
                      <p>{selectedCriatura.germinacion}</p>
                    </div>
                  )}

                  {selectedCriatura.observaciones && (
                    <div className={styles.detailRow}>
                      <strong>Observaciones:</strong>
                      <p>{selectedCriatura.observaciones}</p>
                    </div>
                  )}

                  {selectedCriatura.habilidades.length > 0 && (
                    <div className={styles.detailRow}>
                      <strong>Habilidades:</strong>
                      <ul className={styles.habilidadesList}>
                        {selectedCriatura.habilidades.map((habilidad) => (
                          <li key={habilidad.id}>
                            <strong>{habilidad.nombre}</strong>
                            {habilidad.descripcion && <p>{habilidad.descripcion}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCriatura.depredadores.length > 0 && (
                    <div className={styles.detailRow}>
                      <strong>Depredadores:</strong>
                      <ul className={styles.depredadoresList}>
                        {selectedCriatura.depredadores.map((depredador) => (
                          <li key={depredador.id}>
                            {depredador.descripcion || 'Sin descripción'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={styles.detailRow}>
                    <strong>Cantidad en semillero:</strong> {selectedCriatura.cantidad}
                  </div>
                </div>

                {/* Columna de Imagen */}
                <div className={styles.criaturaInfoImage}>
                  {selectedCriatura.apariencia && selectedCriatura.apariencia.startsWith('http') ? (
                    <>
                      <img
                        src={selectedCriatura.apariencia}
                        alt={selectedCriatura.nombre}
                        className={styles.detailImage}
                        style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                      />
                    </>
                  ) : selectedCriatura.apariencia ? (
                    <div className={styles.detailRow}>
                      <strong>Apariencia:</strong>
                      <p>{selectedCriatura.apariencia}</p>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', color: '#6b7280', textAlign: 'center' }}>
                      Sin imagen disponible
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseModal}>
                Salir
              </button>
              <button className={styles.deleteButtonAction} onClick={handleOpenDeleteModal}>
                Eliminar del Semillero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminar criaturas */}
      {showDeleteModal && selectedCriatura && (
        <div className={styles.modalOverlay} onClick={handleCloseDeleteModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Eliminar {selectedCriatura.nombre}</h2>
              <button className={styles.closeButton} onClick={handleCloseDeleteModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.deleteInfo}>
                <p>Tienes <strong>{selectedCriatura.cantidad}</strong> {selectedCriatura.cantidad === 1 ? 'criatura' : 'criaturas'} de este tipo en tu semillero.</p>
                <p>¿Cuántas deseas eliminar?</p>

                <div className={styles.cantidadDeleteControls}>
                  <label className={styles.cantidadLabel}>Cantidad a eliminar:</label>
                  <div className={styles.cantidadInputGroup}>
                    <button
                      className={styles.cantidadButton}
                      onClick={() => handleChangeCantidadEliminar(cantidadAEliminar - 1)}
                      disabled={cantidadAEliminar === 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={selectedCriatura.cantidad}
                      value={cantidadAEliminar}
                      onChange={(e) => handleChangeCantidadEliminar(parseInt(e.target.value) || 0)}
                      className={styles.cantidadInput}
                    />
                    <button
                      className={styles.cantidadButton}
                      onClick={() => handleChangeCantidadEliminar(cantidadAEliminar + 1)}
                      disabled={cantidadAEliminar >= selectedCriatura.cantidad}
                    >
                      +
                    </button>
                  </div>
                </div>

                {cantidadAEliminar >= selectedCriatura.cantidad && (
                  <div className={styles.deleteWarning}>
                    ⚠️ Se eliminará completamente esta criatura de tu semillero.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseDeleteModal} disabled={deleting}>
                Cancelar
              </button>
              <button className={styles.deleteButton} onClick={handleEliminarCriatura} disabled={deleting || cantidadAEliminar === 0}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}