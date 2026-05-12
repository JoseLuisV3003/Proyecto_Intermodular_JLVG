'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../dashboard.module.css';

interface Criatura {
  id: number;
  nombre: string;
  apariencia?: string;
  clasificacion?: string;
  cantidad: number;
  danio_base?: number;
  HabilidadAtaque?: number;
  HabilidadDefensa?: number;
  PuntosVitales?: number;
  habilidades?: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
  depredadores?: Array<{
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

export default function CombatePage() {
  const params = useParams();
  const router = useRouter();
  const [semillero, setSemillero] = useState<Semillero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lista plana de criaturas seleccionadas (puede haber duplicados si cantidad > 1)
  const [selectedCriaturas, setSelectedCriaturas] = useState<Criatura[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);
  const [modalCriatura, setModalCriatura] = useState<Criatura | null>(null);

  // Presets state
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (params.id) {
      cargarSemillero();
      cargarPresets();
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

  const handleAddCriatura = (criatura: Criatura) => {
    if (!semillero) return;

    // Check global limit
    if (selectedCriaturas.length >= semillero.LimiteDeCombate) {
      return;
    }

    // Check specific quantity limit
    const countSelectedOfThisType = selectedCriaturas.filter(c => c.id === criatura.id).length;
    if (countSelectedOfThisType >= criatura.cantidad) {
      return;
    }

    setSelectedCriaturas([...selectedCriaturas, criatura]);
  };

  const handleRemoveCriatura = (indexToRemove: number) => {
    setSelectedCriaturas(selectedCriaturas.filter((_, index) => index !== indexToRemove));
  };

  const handleLimpiarArena = () => {
    setSelectedCriaturas([]);
    showNotification('Arena despejada correctamente.', 'success');
  };

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

  const handleGuardarPreset = async () => {
    if (!presetName.trim()) {
      showNotification('Por favor, introduce un nombre para la formación.', 'error');
      return;
    }

    if (selectedCriaturas.length === 0) {
      showNotification('Selecciona al menos una criatura para guardar una formación.', 'error');
      return;
    }

    // Agrupamos por ID para el guardado
    const criaturasAgrupadas: { [key: number]: number } = {};
    selectedCriaturas.forEach(c => {
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
      const response = await fetch(`/api/semilleros/${params.id}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setPresetName('');
        setIsPresetModalOpen(false);
        cargarPresets();
      } else {
        showNotification('Error al guardar la formación.', 'error');
      }
    } catch (error) {
      console.error('Error guardando preset:', error);
      showNotification('Error al guardar la formación.', 'error');
    }
  };

  const handleCargarPreset = (preset: Preset) => {
    if (!semillero) return;

    // Validar si el preset cabe en el límite actual
    const totalCriaturas = preset.criaturas.reduce((acc: number, c) => acc + (c.cantidad_en_preset || 0), 0);
    if (totalCriaturas > semillero.LimiteDeCombate) {
      showNotification(`Esta formación tiene ${totalCriaturas} criaturas, pero el límite actual es ${semillero.LimiteDeCombate}.`, 'error');
      return;
    }

    // Convertir de formato preset a lista plana
    const nuevasCriaturas: Criatura[] = [];
    preset.criaturas.forEach((c) => {
      for (let i = 0; i < c.cantidad_en_preset; i++) {
        nuevasCriaturas.push(c);
      }
    });

    setSelectedCriaturas(nuevasCriaturas);
    setIsPresetsDropdownOpen(false);
    showNotification('Formación cargada correctamente.', 'success');
  };

  const handleEliminarPreset = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Formación eliminada.', 'success');
        cargarPresets();
      }
    } catch (error) {
      console.error('Error eliminando preset:', error);
      showNotification('Error al eliminar formación.', 'error');
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Preparando la arena de combate...</div></div>;
  }

  if (error || !semillero) {
    return <div className={styles.container}><div className={styles.error}><h2>Error</h2><p>{error}</p><button className={styles.createButton} onClick={() => router.push('/dashboard')}>Volver</button></div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 className={styles.headerTitle}>Arena: {semillero.nombre}</h1>
          <div style={{ fontSize: '1rem', color: '#6b7280', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontWeight: '600' }}>Fuerzas desplegadas: </span>
            <span style={{ color: selectedCriaturas.length === semillero.LimiteDeCombate ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {selectedCriaturas.length} / {semillero.LimiteDeCombate}
            </span>
          </div>
        </div>
        <button className={styles.logoutButton} onClick={() => router.push(`/dashboard/${semillero.id}`)}>
          ← Volver al Semillero
        </button>
      </div>

      <div className={styles.semillerosSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Zona de Combate</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Botón de Presets */}
            <div style={{ position: 'relative' }}>
              <button
                className={styles.editButtonAction}
                onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                style={{ background: '#6366f1' }}
              >
                Formaciones {presets.length > 0 && `(${presets.length})`} ▾
              </button>
              {isPresetsDropdownOpen && (
                <div className={styles.modernModalOverlay} onClick={() => setIsPresetsDropdownOpen(false)}>
                  <div className={styles.modernModalContent} onClick={e => e.stopPropagation()}>
                    <div className={styles.modernModalHeader}>
                      <h2>Cargar Formación</h2>
                      <button className={styles.modernCloseButton} onClick={() => setIsPresetsDropdownOpen(false)}>×</button>
                    </div>

                    <div className={styles.modernModalBody}>
                      <p style={{ color: '#475569', marginBottom: '2rem' }}>Selecciona una formación guardada para desplegarla en la arena.</p>

                      {presets.length === 0 ? (
                        <div className={styles.modernEmptyState}>

                          <h3 className={styles.modernEmptyStateTitle}>No hay formaciones guardadas</h3>
                          <p className={styles.modernEmptyStateText}>Tus formaciones aparecerán aquí.</p>
                        </div>
                      ) : (
                        <div className={styles.presetsGrid}>
                          {presets.map(p => (
                            <div
                              key={p.id}
                              className={styles.modernPresetCard}
                            >
                              <div className={styles.presetCardHeader}>
                                <div className={styles.presetCardInfo}>
                                  <strong className={styles.presetCardName}>{p.nombre}</strong>
                                  <span className={styles.presetCardCount}>
                                    {p.criaturas.reduce((acc: number, c: any) => acc + (c.cantidad_en_preset || 0), 0)} Na'az
                                  </span>
                                </div>
                              </div>

                              <div className={styles.presetIconsRow}>
                                {p.criaturas.slice(0, 6).map((c: any, idx: number) => (
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

                              <div className={styles.presetActions} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                                <button
                                  onClick={() => handleCargarPreset(p)}
                                  className={styles.viewButton}
                                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', borderRadius: '10px' }}
                                >
                                  Cargar
                                </button>
                                <button
                                  onClick={(e) => handleEliminarPreset(e, p.id)}
                                  className={styles.cancelButton}
                                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', borderRadius: '10px', color: '#ef4444' }}
                                >
                                  Eliminar
                                </button>
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

            {selectedCriaturas.length > 0 && (
              <>
                <button
                  className={styles.editButton}
                  onClick={() => setIsPresetModalOpen(true)}
                  style={{ background: '#8b5cf6' }}
                >
                  Guardar Formación
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={handleLimpiarArena}
                >
                  Retirar Todas
                </button>
              </>
            )}
            <button
              className={styles.createButton}
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            >
              {isSelectorOpen ? 'Ocultar Selector' : 'Cambiar Criaturas en Combate'}
            </button>
          </div>
        </div>

        {/* Zona de Combate */}
        <div
          style={{
            minHeight: '250px',
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '2rem',
            border: selectedCriaturas.length === semillero.LimiteDeCombate ? '2px solid #ef4444' : '2px dashed #e5e7eb',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2rem',
            transition: 'all 0.3s ease'
          }}
        >
          {selectedCriaturas.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: '1.2rem', margin: 0 }}>
                La arena está vacía.<br />¡Selecciona criaturas del selector para enviarlas al combate!
              </p>
            </div>
          ) : (
            selectedCriaturas.map((criatura, index) => (
              <div
                key={`${criatura.id}-${index}`}
                className={styles.criaturaCard}
                style={{
                  width: '180px',
                  cursor: 'pointer',
                  position: 'relative',
                  border: '2px solid #ef4444',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={() => setModalCriatura(criatura)}
                title="Haz clic para ver detalles"
              >
                <div
                  onClick={(e) => { e.stopPropagation(); handleRemoveCriatura(index); }}
                  title="Retirar criatura"
                  style={{
                    position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white',
                    borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 10
                  }}>
                  ×
                </div>
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.criaturaName} style={{ fontSize: '1rem', textAlign: 'center', width: '100%' }}>{criatura.nombre}</h3>
                </div>
                {criatura.apariencia && criatura.apariencia.startsWith('http') ? (
                  <img
                    src={criatura.apariencia}
                    alt={criatura.nombre}
                    className={styles.criaturaCardImage}
                    style={{ height: '120px', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    Sin imagen
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {isSelectorOpen && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Refuerzos Disponibles
            </h3>

            {semillero.criaturas.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No hay criaturas en este semillero.</p>
            ) : (
              <div
                className={styles.criaturasGrid}
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}
              >
                {semillero.criaturas.map((criatura) => {
                  const countSelected = selectedCriaturas.filter(c => c.id === criatura.id).length;
                  const isMaxedOutType = countSelected >= criatura.cantidad;
                  const isGlobalLimitReached = selectedCriaturas.length >= semillero.LimiteDeCombate;
                  const isDisabled = isMaxedOutType || isGlobalLimitReached;

                  return (
                    <div
                      key={criatura.id}
                      className={styles.criaturaCard}
                      onClick={() => !isDisabled && handleAddCriatura(criatura)}
                      style={{
                        opacity: isDisabled ? 0.5 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        border: countSelected > 0 ? '2px solid #10b981' : '1px solid #e5e7eb',
                        transform: 'none',
                        margin: 0
                      }}
                    >
                      <div className={styles.criaturaHeader} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid #e5e7eb' }}>
                        <h3 className={styles.criaturaName} style={{ fontSize: '0.9rem', margin: 0 }}>{criatura.nombre}</h3>
                        <span className={styles.cantidadBadge} style={{
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.4rem',
                          background: isMaxedOutType ? '#ef4444' : '#10b981',
                          color: 'white'
                        }}>
                          {countSelected} / {criatura.cantidad}
                        </span>
                      </div>
                      {criatura.apariencia && criatura.apariencia.startsWith('http') ? (
                        <img
                          src={criatura.apariencia}
                          alt={criatura.nombre}
                          className={styles.criaturaCardImage}
                          style={{ height: '100px', padding: '0.5rem', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.8rem' }}>
                          Sin imagen
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>



      {/* Modal para Guardar Preset */}
      {isPresetModalOpen && (
        <div className={styles.modernModalOverlay} onClick={() => setIsPresetModalOpen(false)}>
          <div className={styles.modernModalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className={styles.modernModalHeader}>
              <h2>Guardar Formación</h2>
              <button className={styles.modernCloseButton} onClick={() => setIsPresetModalOpen(false)}>×</button>
            </div>
            <div className={styles.modernModalBody}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: '#64748b' }}>
                Esto guardará las {selectedCriaturas.length} criaturas actuales como una formación reutilizable.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#475569' }}>Nombre de la formación</label>
                <input
                  type="text"
                  className={styles.createInput}
                  placeholder="Ej: Batallón de Vanguardia"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]/g, '').slice(0, 25))}
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

      {/* Modal de Detalles de Criatura */}
      {modalCriatura && (
        <div className={styles.modernModalOverlay} onClick={() => setModalCriatura(null)}>
          <div className={styles.modernModalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modernModalHeader} style={{ background: '#f8fafc' }}>
              <h2>{modalCriatura.nombre}</h2>
              <button className={styles.modernCloseButton} onClick={() => setModalCriatura(null)}>×</button>
            </div>
            <div className={styles.modernModalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* Daño Base */}
              {modalCriatura.danio_base !== undefined && modalCriatura.danio_base !== null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                  <strong style={{ color: '#991b1b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Daño Base</strong>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{modalCriatura.danio_base}</span>
                </div>
              )}

              {/* Estadísticas Nuevas */}
              {(modalCriatura.HabilidadAtaque != null || modalCriatura.HabilidadDefensa != null || modalCriatura.PuntosVitales != null) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  {modalCriatura.HabilidadAtaque != null && (
                    <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fde68a', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600', marginBottom: '0.25rem' }}>Habilidad Ataque</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d97706' }}>{modalCriatura.HabilidadAtaque}</div>
                    </div>
                  )}
                  {modalCriatura.HabilidadDefensa != null && (
                    <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600', marginBottom: '0.25rem' }}>Habilidad Defensa</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>{modalCriatura.HabilidadDefensa}</div>
                    </div>
                  )}
                  {modalCriatura.PuntosVitales != null && (
                    <div style={{ background: '#fdf4ff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fbcfe8', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#86198f', fontWeight: '600', marginBottom: '0.25rem' }}>Puntos Vitales</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d946ef' }}>{modalCriatura.PuntosVitales}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Habilidades */}
              <div>
                <strong style={{ color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>Habilidades</strong>
                {modalCriatura.habilidades && modalCriatura.habilidades.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {modalCriatura.habilidades.map(h => (
                      <div key={h.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontWeight: '600', color: '#0ea5e9', marginBottom: '0.35rem', fontSize: '1.05rem' }}>{h.nombre}</div>
                        {h.descripcion ? (
                          <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.5' }}>{h.descripcion}</div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin descripción disponible.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>Ninguna habilidad registrada</div>
                )}
              </div>

              {/* Depredadores */}
              <div>
                <strong style={{ color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>Depredadores</strong>
                {modalCriatura.depredadores && modalCriatura.depredadores.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {modalCriatura.depredadores.map(d => (
                      <li key={d.id} style={{ lineHeight: '1.5', fontSize: '0.95rem' }}>{d.descripcion || 'Desconocido'}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: '#94a3b8', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>No tiene depredadores conocidos</div>
                )}
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
    </div>
  );
}
