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
  AlturaCM?: number;
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

interface Preset {
  id: number;
  nombre: string;
  criaturas: Array<Criatura & { cantidad_en_preset: number }>;
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

  // Preset Selection State
  const [isPresetMode, setIsPresetMode] = useState(false);
  const [presetSelection, setPresetSelection] = useState<Criatura[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
      cargarPresets();
    }
  }, [params.id]);

  const cargarPresets = async () => {
    try {
      const response = await fetch(`/api/semilleros/${params.id}/presets`);
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Error cargando presets:', error);
    }
  };

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
    if (isPresetMode) {
      handleAddToSelection(null as any, criatura);
    } else {
      setSelectedCriatura(criatura);
    }
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

  const handleAddToSelection = (e: React.MouseEvent | null, criatura: Criatura) => {
    if (e) e.stopPropagation();
    if (!semillero) return;

    if (presetSelection.length >= semillero.LimiteDeCombate) {
      return;
    }

    const countSelected = presetSelection.filter(c => c.id === criatura.id).length;
    if (countSelected >= criatura.cantidad) {
      return;
    }

    setPresetSelection([...presetSelection, criatura]);
  };

  const handleRemoveFromSelection = (indexToRemove: number) => {
    setPresetSelection(presetSelection.filter((_, i) => i !== indexToRemove));
  };

  const handleGuardarPreset = async () => {
    if (!presetName.trim()) {
      showNotification('Por favor, introduce un nombre para la formación.', 'error');
      return;
    }

    if (presetSelection.length === 0) {
      showNotification('Selecciona al menos una criatura para guardar una formación.', 'error');
      return;
    }

    const criaturasAgrupadas: { [key: number]: number } = {};
    presetSelection.forEach(c => {
      criaturasAgrupadas[c.id] = (criaturasAgrupadas[c.id] || 0) + 1;
    });

    const dataToSend = {
      nombre: presetName,
      criaturas: Object.entries(criaturasAgrupadas).map(([id, cantidad]) => ({
        id: parseInt(id),
        cantidad
      }))
    };

    try {
      const method = editingPresetId ? 'PUT' : 'POST';
      const url = editingPresetId
        ? `/api/presets/${editingPresetId}`
        : `/api/semilleros/${params.id}/presets`;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setPresetName('');
        setIsPresetModalOpen(false);
        setPresetSelection([]);
        setIsPresetMode(false);
        setEditingPresetId(null);
        cargarPresets();
        showNotification(editingPresetId ? 'Formación actualizada correctamente.' : 'Formación guardada correctamente.', 'success');
      } else {
        showNotification('Error al guardar la formación.', 'error');
      }
    } catch (error) {
      console.error('Error guardando preset:', error);
      showNotification('Error al guardar la formación.', 'error');
    }
  };

  const handleEditPreset = (preset: any) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.nombre);

    const selection: Criatura[] = [];
    preset.criaturas.forEach((c: any) => {
      const criaturaBase = semillero?.criaturas.find(cb => cb.id === c.id);
      if (criaturaBase) {
        for (let i = 0; i < c.cantidad_en_preset; i++) {
          selection.push(criaturaBase);
        }
      }
    });

    setPresetSelection(selection);
    setIsPresetMode(true);
    setIsPresetsDropdownOpen(false);
  };

  const handleEliminarPreset = async (id: number) => {
    // Acción directa sin confirmación por petición del usuario
    try {
      const response = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Formación eliminada correctamente.', 'success');
        cargarPresets();
      }
    } catch (error) {
      console.error('Error eliminando preset:', error);
      showNotification('Error al eliminar la formación.', 'error');
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className={styles.createButton} onClick={handleAddCriaturas} style={{ margin: 0, padding: '0.5rem 1rem' }}>
                Añadir más Na'az
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  className={styles.createButton}
                  onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                  style={{ margin: 0, padding: '0.5rem 1rem', background: '#6366f1', borderColor: '#6366f1' }}
                >
                  Formaciones ▾
                </button>

                {isPresetsDropdownOpen && (
                  <div className={styles.modernModalOverlay} onClick={() => setIsPresetsDropdownOpen(false)}>
                    <div className={styles.modernModalContent} onClick={e => e.stopPropagation()}>
                      <div className={styles.modernModalHeader}>
                        <h2>Gestión de Formaciones</h2>
                        <button className={styles.modernCloseButton} onClick={() => setIsPresetsDropdownOpen(false)}>×</button>
                      </div>

                      <div className={styles.modernModalBody}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '2rem' }}>
                          <p style={{ color: '#475569', margin: 0, fontSize: '1.1rem' }}>Administra tus formaciones de combate guardadas.</p>
                          <button
                            onClick={() => { setIsPresetMode(true); setIsPresetsDropdownOpen(false); setPresetSelection([]); setEditingPresetId(null); setPresetName(''); }}
                            className={styles.createButton}
                            style={{ background: '#10b981', borderColor: '#10b981', padding: '0.75rem 1.5rem', margin: 0, fontSize: '1rem' }}
                          >
                            + Crear nueva formación
                          </button>
                        </div>

                        {presets.length === 0 ? (
                          <div className={styles.modernEmptyState}>

                            <h3 className={styles.modernEmptyStateTitle}>Aún no has creado ninguna formación</h3>
                            <p className={styles.modernEmptyStateText}>Tus formaciones aparecerán aquí.</p>
                          </div>
                        ) : (
                          <div className={styles.presetsGrid}>
                            {presets.map(p => (
                              <div key={p.id} className={styles.modernPresetCard}>
                                <div className={styles.presetCardHeader}>
                                  <div className={styles.presetCardInfo}>
                                    <strong className={styles.presetCardName}>{p.nombre}</strong>
                                    <span className={styles.presetCardCount}>
                                      {p.criaturas.reduce((acc: number, c) => acc + (c.cantidad_en_preset || 0), 0)} Na'az
                                    </span>
                                  </div>
                                </div>

                                <div className={styles.presetIconsRow}>
                                  {p.criaturas.slice(0, 6).map((c, idx: number) => (
                                    <div key={idx} className={styles.presetMiniIcon}>
                                      {c.apariencia ? (
                                        <img src={c.apariencia} alt={c.nombre} />
                                      ) : (
                                        <div className={styles.presetMiniIconPlaceholder}>{c.nombre[0]}</div>
                                      )}
                                    </div>
                                  ))}
                                  {p.criaturas.length > 6 && (
                                    <div className={styles.presetMoreBadge}>+{p.criaturas.length - 6}</div>
                                  )}
                                </div>

                                <div className={styles.presetActions}>
                                  <button onClick={() => handleEditPreset(p)} className={styles.editButtonAction} style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', borderRadius: '10px' }}>Editar</button>
                                  <button onClick={() => handleEliminarPreset(p.id)} className={styles.cancelButton} style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', borderRadius: '10px', color: '#ef4444' }}>Eliminar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isPresetMode && (
                <>
                  <button
                    className={styles.createButton}
                    onClick={() => setIsPresetModalOpen(true)}
                    style={{ margin: 0, padding: '0.5rem 1rem', background: '#10b981', borderColor: '#10b981' }}
                    disabled={presetSelection.length === 0}
                  >
                    Guardar ({presetSelection.length})
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => { setIsPresetMode(false); setPresetSelection([]); setEditingPresetId(null); setPresetName(''); }}
                    style={{ margin: 0, padding: '0.5rem 1rem' }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
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
              <h3>No tienes Na'az en este semillero</h3>
              <p>Añade Na'az para empezar tu colección.</p>
              <button className={styles.createButton} onClick={handleAddCriaturas}>
                Añadir Na'az
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
                className={`${styles.immersiveCriaturaCard} ${isPresetMode ? styles.presetModeCard : ''}`}
                onClick={() => handleCriaturaClick(criatura)}
                style={{
                  border: isPresetMode && presetSelection.filter(c => c.id === criatura.id).length > 0 ? '2px solid #6366f1' : undefined,
                  boxShadow: isPresetMode && presetSelection.filter(c => c.id === criatura.id).length > 0 ? '0 0 15px rgba(99, 102, 241, 0.3)' : undefined,
                  transform: isPresetMode && presetSelection.filter(c => c.id === criatura.id).length > 0 ? 'scale(1.02)' : undefined,
                }}
              >
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.immersiveCriaturaName}>{criatura.nombre}</h3>
                  <span className={styles.immersiveBadge} style={{
                    background: isPresetMode && presetSelection.filter(c => c.id === criatura.id).length > 0 ? '#6366f1' : undefined,
                    transition: 'all 0.2s'
                  }}>
                    {isPresetMode ? (
                      `${presetSelection.filter(c => c.id === criatura.id).length} / ${criatura.cantidad}`
                    ) : (
                      `x${criatura.cantidad}`
                    )}
                  </span>
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
                <div>ALTURA: {selectedCriatura.AlturaCM || '--'} cm</div>
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
      {/* Barra de Selección de Preset */}
      {presetSelection.length > 0 && (
        <div className={styles.selectionBar}>
          {/* Fila Superior: Contador y Acciones */}
          <div className={styles.selectionRow}>
            <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem' }}>
                {presetSelection.length} / {semillero.LimiteDeCombate}
              </div>
              <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: '500' }}>Na'az en formación</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className={styles.cancelButton}
                onClick={() => { setPresetSelection([]); setIsPresetMode(false); setEditingPresetId(null); setPresetName(''); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', margin: 0 }}
              >
                Cancelar
              </button>
              <button
                className={styles.createButton}
                onClick={() => setIsPresetModalOpen(true)}
                style={{ background: '#6366f1', borderColor: '#6366f1', padding: '0.6rem 1.5rem', margin: 0, fontWeight: '700' }}
              >
                {editingPresetId ? 'Actualizar Formación' : 'Guardar Formación'}
              </button>
            </div>
          </div>

          {/* Fila Inferior: Iconos seleccionados con Wrap */}
          <div style={{
            display: 'flex',
            gap: '0.6rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxHeight: '160px',
            overflowY: 'auto',
            padding: '0.5rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '16px'
          }}>
            {presetSelection.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                onClick={() => handleRemoveFromSelection(i)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                title={`Quitar ${c.nombre}`}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                  {c.apariencia ? (
                    <img src={c.apariencia} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>{c.nombre[0]}</span>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ef4444',
                  color: 'white',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  zIndex: 2,
                  border: '2px solid #0f172a'
                }}>
                  ×
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Guardar Formación */}
      {isPresetModalOpen && (
        <div className={styles.modernModalOverlay} onClick={() => setIsPresetModalOpen(false)}>
          <div className={styles.modernModalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className={styles.modernModalHeader}>
              <h2>Guardar Formación</h2>
              <button className={styles.modernCloseButton} onClick={() => setIsPresetModalOpen(false)}>×</button>
            </div>
            <div className={styles.modernModalBody}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: '#64748b' }}>
                Estás guardando una formación con {presetSelection.length} Na'az.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#475569' }}>Nombre de la formación</label>
                <input
                  type="text"
                  className={styles.createInput}
                  placeholder="Ej: Batallón Vanguardia"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleGuardarPreset()}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className={styles.cancelButton} onClick={() => setIsPresetModalOpen(false)} style={{ padding: '0.75rem 1.5rem' }}>Cancelar</button>
                <button className={styles.createButton} onClick={handleGuardarPreset} style={{ padding: '0.75rem 1.5rem', background: '#10b981', borderColor: '#10b981' }}>Guardar Formación</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Toasts */}
      {notification && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            <span style={{ fontSize: '1.2rem' }}>{notification.type === 'success' ? '✓' : '✕'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />
    </div>
  );
}