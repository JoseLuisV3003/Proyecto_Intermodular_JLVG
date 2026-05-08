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

  const handleAddCriatura = (criatura: Criatura) => {
    if (!semillero) return;
    
    // Check global limit
    if (selectedCriaturas.length >= semillero.LimiteDeCombate) {
      alert(`No puedes sacar más de ${semillero.LimiteDeCombate} criaturas al mismo tiempo.`);
      return;
    }
    
    // Check specific quantity limit
    const countSelectedOfThisType = selectedCriaturas.filter(c => c.id === criatura.id).length;
    if (countSelectedOfThisType >= criatura.cantidad) {
      alert(`Solo tienes ${criatura.cantidad} de ${criatura.nombre} en este semillero.`);
      return;
    }
    
    setSelectedCriaturas([...selectedCriaturas, criatura]);
  };

  const handleRemoveCriatura = (indexToRemove: number) => {
    setSelectedCriaturas(selectedCriaturas.filter((_, index) => index !== indexToRemove));
  };

  const handleLimpiarArena = () => {
    if (confirm('¿Estás seguro de querer retirar todas las criaturas?')) {
      setSelectedCriaturas([]);
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {selectedCriaturas.length > 0 && (
              <button 
                className={styles.cancelButton} 
                onClick={handleLimpiarArena}
              >
                Retirar Todas
              </button>
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>⚔️</div>
              <p style={{ fontSize: '1.2rem', margin: 0 }}>
                La arena está vacía.<br/>¡Selecciona criaturas del selector para enviarlas al combate!
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
                  const isDisabled = isMaxedOutType || (isGlobalLimitReached && countSelected === 0);
                  
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />

      {/* Modal de Detalles de Criatura */}
      {modalCriatura && (
        <div className={styles.modalOverlay} onClick={() => setModalCriatura(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
            <div className={styles.modalHeader} style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span> {modalCriatura.nombre}
              </h2>
              <button className={styles.closeButton} onClick={() => setModalCriatura(null)} style={{ fontSize: '1.75rem', lineHeight: 1 }}>×</button>
            </div>
            <div className={styles.modalBody} style={{ padding: '2rem 1.5rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Daño Base */}
              {modalCriatura.danio_base !== undefined && modalCriatura.danio_base !== null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                  <strong style={{ color: '#991b1b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚔️ Daño Base</strong> 
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
                <strong style={{ color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>✨ Habilidades</strong>
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
                <strong style={{ color: '#111827', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>🐺 Depredadores</strong>
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
    </div>
  );
}
