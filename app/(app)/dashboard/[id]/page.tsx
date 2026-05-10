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
  HabilidadAtaque?: number;
  HabilidadDefensa?: number;
  PuntosVitales?: number;
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
  LimiteDeCombate: number;
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
  const [isEditingLimite, setIsEditingLimite] = useState(false);
  const [nuevoLimite, setNuevoLimite] = useState(5);

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

  const handleEditLimite = () => {
    setNuevoLimite(semillero?.LimiteDeCombate || 5);
    setIsEditingLimite(true);
  };

  const handleSaveLimite = async () => {
    try {
      const response = await fetch(`/api/semilleros/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ LimiteDeCombate: nuevoLimite }),
      });
      if (response.ok) {
        setSemillero(prev => prev ? { ...prev, LimiteDeCombate: nuevoLimite } : null);
        setIsEditingLimite(false);
      }
    } catch (e) {
      console.error(e);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 className={styles.headerTitle}>{semillero.nombre}</h1>
          <div className={styles.limiteCombateBadge}>
            {isEditingLimite ? (
              <>
                <span style={{ fontWeight: '600' }}>Límite de combate:</span>
                <input
                  type="number"
                  value={nuevoLimite}
                  onChange={(e) => setNuevoLimite(parseInt(e.target.value) || 5)}
                  className={styles.immersiveSearchInput}
                  style={{ width: '80px', padding: '0.3rem', margin: 0, height: 'auto' }}
                  min="1"
                />
                <button onClick={handleSaveLimite} className={styles.createButton} style={{ padding: '0.3rem 0.8rem', margin: 0 }}>Guardar</button>
                <button onClick={() => setIsEditingLimite(false)} className={styles.cancelButton} style={{ padding: '0.3rem 0.8rem', margin: 0 }}>Cancelar</button>
              </>
            ) : (
              <>
                <span style={{ fontWeight: '600' }}>Límite de combate:</span>
                <span className={styles.limiteCombateValue}>{semillero.LimiteDeCombate}</span>
                <button onClick={handleEditLimite} className={styles.editButtonAction} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', marginLeft: '0.5rem', borderRadius: '8px' }}>Editar</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={styles.createButton}
            onClick={() => router.push(`/dashboard/${semillero.id}/combate`)}
            style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
          >
            Gestión Na'az
          </button>
          <button className={styles.logoutButton} onClick={handleBackToDashboard}>
            ← Volver
          </button>
        </div>
      </div>

      <div className={styles.semillerosSection}>
        <h2 className={styles.sectionTitle}>Na'az en el Semillero</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={`${styles.immersiveSearchInput} ${styles.searchBarInput}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Na'az por nombre o clasificación..."
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
                className={styles.immersiveCriaturaCard}
                onClick={() => handleCriaturaClick(criatura)}
              >
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.immersiveCriaturaName}>{criatura.nombre}</h3>
                  <span className={styles.immersiveBadge}>x{criatura.cantidad}</span>
                </div>
                {criatura.apariencia && criatura.apariencia.startsWith('http') && (
                  <img
                    src={criatura.apariencia}
                    alt={criatura.nombre}
                    className={styles.criaturaCardImage}
                  />
                )}
                {columnsPerRow !== 8 && criatura.clasificacion && (
                  <p className={styles.immersiveClasificacion}>{criatura.clasificacion}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles de criatura */}
      {selectedCriatura && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.manualModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.manualHeader}>
              <div className={styles.manualHeaderMain}>
                <h1 className={styles.manualTitle}>{selectedCriatura.nombre}</h1>
                <p className={styles.manualClassification}>
                  <strong>Clasificación:</strong> {selectedCriatura.clasificacion || 'Desconocida'}
                </p>
              </div>
              <div className={styles.manualHeaderStats}>
                <div>ALTURA: 80 cm</div>
                <div>Nº = <span className={styles.manualNumber}>{selectedCriatura.id}</span></div>
              </div>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
                style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', fontSize: '2rem', cursor: 'pointer', color: '#8b5e3c' }}
              >
                ×
              </button>
            </div>

            <div className={`${styles.manualBody} ${!(selectedCriatura.apariencia && selectedCriatura.apariencia.startsWith('http')) ? styles.manualBodyFull : ''}`}>
              <div className={styles.manualImageContainer}>
                {selectedCriatura.apariencia && selectedCriatura.apariencia.startsWith('http') && (
                  <img
                    src={selectedCriatura.apariencia}
                    alt={selectedCriatura.nombre}
                    className={styles.manualImage}
                  />
                )}
              </div>

              <div className={styles.manualInfo}>
                {/* Estadísticas Técnicas - Lo más primario */}
                {(selectedCriatura.danio_base != null ||
                  selectedCriatura.HabilidadAtaque != null ||
                  selectedCriatura.HabilidadDefensa != null ||
                  selectedCriatura.PuntosVitales != null) && (
                    <div className={styles.manualSection}>
                      <div className={styles.manualStatsGrid}>
                        {selectedCriatura.HabilidadAtaque != null && (
                          <div className={styles.manualText}><strong>HA:</strong> {selectedCriatura.HabilidadAtaque}</div>
                        )}
                        {selectedCriatura.HabilidadDefensa != null && (
                          <div className={styles.manualText}><strong>HD:</strong> {selectedCriatura.HabilidadDefensa}</div>
                        )}
                        {selectedCriatura.PuntosVitales != null && (
                          <div className={styles.manualText}><strong>PVs:</strong> {selectedCriatura.PuntosVitales}</div>
                        )}
                        {selectedCriatura.danio_base != null && (
                          <div className={styles.manualText}><strong>Daño Base:</strong> {selectedCriatura.danio_base}</div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Habilidades - También primario */}
                {selectedCriatura.habilidades.length > 0 && (
                  <div className={styles.manualSection}>
                    <span className={styles.manualSectionTitle}>Habilidades:</span>
                    {selectedCriatura.habilidades.map((habilidad) => (
                      <div key={habilidad.id} className={styles.manualSkill}>
                        <span className={styles.manualSkillName}>{habilidad.nombre}:</span>
                        <span className={styles.manualText}>{habilidad.descripcion || 'Sin descripción.'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Descripción */}
                {selectedCriatura.descripcion && (
                  <div className={styles.manualSection}>
                    <span className={styles.manualSectionTitle}>Descripción:</span>
                    <p className={styles.manualText}>{selectedCriatura.descripcion}</p>
                  </div>
                )}

                {/* Germinación */}
                {selectedCriatura.germinacion && (
                  <div className={styles.manualSection}>
                    <span className={styles.manualSectionTitle}>Germinación:</span>
                    <p className={styles.manualText}>{selectedCriatura.germinacion}</p>
                  </div>
                )}

                {/* Depredadores */}
                <div className={styles.manualSection}>
                  <span className={styles.manualSectionTitle}>Depredadores conocidos:</span>
                  <p className={styles.manualText}>
                    {selectedCriatura.depredadores.length > 0
                      ? selectedCriatura.depredadores.map(d => d.descripcion).join(', ')
                      : 'Desconocido'}
                  </p>
                </div>

                {/* Forma de Ser */}
                {selectedCriatura.forma_ser && (
                  <div className={styles.manualSection}>
                    <span className={styles.manualSectionTitle}>Forma de Ser:</span>
                    <p className={styles.manualText}>{selectedCriatura.forma_ser}</p>
                  </div>
                )}

                {/* Observaciones */}
                {selectedCriatura.observaciones && (
                  <div className={styles.manualSection}>
                    <span className={styles.manualSectionTitle}>Observaciones:</span>
                    <p className={styles.manualText}>{selectedCriatura.observaciones}</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.manualFooter}>
              <button className={styles.manualButtonSecondary} onClick={handleCloseModal}>
                Cerrar Manual
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
                    Se eliminará completamente esta criatura de tu semillero.
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