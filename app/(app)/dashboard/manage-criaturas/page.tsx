'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

interface HabilidadForm {
  id?: number;
  nombre: string;
  descripcion?: string;
}

interface DepredadorForm {
  id?: number;
  descripcion: string;
}

interface Criatura {
  id: number;
  nombre: string;
  clasificacion?: string;
  tipo?: string;
  danio_base?: number;
  HabilidadAtaque?: number;
  HabilidadDefensa?: number;
  PuntosVitales?: number;
  germinacion?: string;
  descripcion?: string;
  apariencia?: string;
  observaciones?: string;
  forma_ser?: string;
  habilidades: HabilidadForm[];
  depredadores: DepredadorForm[];
}

export default function ManageCriaturasPage() {
  const router = useRouter();
  const [criaturas, setCriaturas] = useState<Criatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Criatura>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [columnsPerRow, setColumnsPerRow] = useState(5);

  const filteredCriaturas = criaturas.filter((criatura) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      criatura.nombre.toLowerCase().includes(query) ||
      criatura.clasificacion?.toLowerCase().includes(query);
    const matchesTipo = tipoFilter === '' || criatura.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

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
      setError('Error al cargar criaturas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (criatura: Criatura) => {
    setEditingId(criatura.id);
    setEditForm({
      ...criatura,
      habilidades: criatura.habilidades.map((habilidad) => ({
        id: habilidad.id,
        nombre: habilidad.nombre,
        descripcion: habilidad.descripcion || ''
      })),
      depredadores: criatura.depredadores.map((depredador) => ({
        id: depredador.id,
        descripcion: depredador.descripcion || ''
      }))
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddHabilidad = () => {
    setEditForm((prev) => ({
      ...prev,
      habilidades: [
        ...(prev.habilidades || []),
        { nombre: '', descripcion: '' }
      ]
    }));
  };

  const handleHabilidadChange = (index: number, field: 'nombre' | 'descripcion', value: string) => {
    setEditForm((prev) => ({
      ...prev,
      habilidades: (prev.habilidades || []).map((habilidad, i) =>
        i === index ? { ...habilidad, [field]: value } : habilidad
      )
    }));
  };

  const handleRemoveHabilidad = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      habilidades: (prev.habilidades || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddDepredador = () => {
    setEditForm((prev) => ({
      ...prev,
      depredadores: [
        ...(prev.depredadores || []),
        { descripcion: '' }
      ]
    }));
  };

  const handleDepredadorChange = (index: number, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      depredadores: (prev.depredadores || []).map((depredador, i) =>
        i === index ? { ...depredador, descripcion: value } : depredador
      )
    }));
  };

  const handleRemoveDepredador = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      depredadores: (prev.depredadores || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.nombre?.trim()) return;

    try {
      const dataToSend: any = {
        ...editForm,
        danio_base: typeof editForm.danio_base === 'number' ? editForm.danio_base : null,
        HabilidadAtaque: typeof editForm.HabilidadAtaque === 'number' ? editForm.HabilidadAtaque : null,
        HabilidadDefensa: typeof editForm.HabilidadDefensa === 'number' ? editForm.HabilidadDefensa : null,
        PuntosVitales: typeof editForm.PuntosVitales === 'number' ? editForm.PuntosVitales : null,
        habilidades: (editForm.habilidades || [])
          .filter((habilidad) => habilidad.nombre?.trim())
          .map((habilidad) => ({
            nombre: habilidad.nombre.trim(),
            descripcion: habilidad.descripcion?.trim() || null
          })),
        depredadores: (editForm.depredadores || [])
          .map((depredador) => depredador.descripcion?.trim())
          .filter(Boolean)
      };

      const response = await fetch(`/api/criaturas/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const data = await response.json();
        setCriaturas(criaturas.map(c =>
          c.id === editingId ? data.criatura : c
        ));
        showNotification('Criatura actualizada correctamente.', 'success');
        setEditingId(null);
        setEditForm({});
      } else {
        const data = await response.json();
        showNotification(data.error || 'Error al actualizar criatura', 'error');
      }
    } catch (error) {
      console.error('Error actualizando criatura:', error);
      showNotification('Error al actualizar criatura', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    // Eliminación directa por petición del usuario
    setDeletingId(id);
    try {
      const response = await fetch(`/api/criaturas/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCriaturas(criaturas.filter(c => c.id !== id));
        showNotification('Criatura eliminada correctamente.', 'success');
      } else {
        const data = await response.json();
        showNotification(data.error || 'Error al eliminar criatura', 'error');
      }
    } catch (error) {
      console.error('Error eliminando criatura:', error);
      showNotification('Error al eliminar criatura', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = (field: keyof Criatura, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando criaturas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className={styles.createButton}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Gestionar Criaturas</h1>
          <p className={styles.subTitle} style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500' }}>Crea, edita o elimina criaturas desde aquí.</p>
        </div>
        <div className={styles.headerButtons}>
          <button className={styles.adminButton} onClick={() => router.push('/dashboard/create-criatura')}>
            Crear Nueva Criatura
          </button>
          <button className={styles.logoutButton} onClick={handleBack}>
            Volver al Dashboard
          </button>
        </div>
      </div>

      <div className={styles.semillerosSection}>
        <h2 className={styles.sectionTitle}>Criaturas en la Base de Datos</h2>
        <div className={styles.searchContainer} style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            className={styles.adminSearchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, clasificación o ID..."
          />
          <select
            className={styles.adminSearchInput}
            style={{ flex: '0 0 220px' }}
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
            className={styles.adminSearchInput}
            style={{ flex: '0 0 160px' }}
            value={columnsPerRow}
            onChange={(e) => setColumnsPerRow(Number(e.target.value))}
          >
            <option value={5}>5 por fila</option>
            <option value={8}>8 por fila</option>
          </select>
        </div>

        {filteredCriaturas.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No hay criaturas que coincidan con la búsqueda</h3>
            <p>Prueba con otro nombre o borra el filtro.</p>
          </div>
        ) : (
          <div
            className={`${styles.criaturasGrid} ${columnsPerRow === 8 ? styles.grid8 : ''}`}
            style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
          >
            {filteredCriaturas.map((criatura) => (
              <div key={criatura.id} className={`${styles.criaturaCard} ${styles.adminCard}`}>
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.criaturaName}>{criatura.nombre}</h3>
                </div>
                {criatura.apariencia && criatura.apariencia.startsWith('http') && (
                  <img
                    src={criatura.apariencia}
                    alt={criatura.nombre}
                    className={styles.criaturaCardImage}
                  />
                )}

                <div className={styles.adminDetailsStack}>
                  {columnsPerRow !== 8 && criatura.clasificacion && (
                    <p className={styles.adminDetailText} style={{ fontStyle: 'italic' }}>{criatura.clasificacion}</p>
                  )}
                  <p className={styles.adminDetailText}>ID: {criatura.id}</p>
                  {columnsPerRow !== 8 && criatura.danio_base && (
                    <p className={styles.adminDetailText}>Daño: {criatura.danio_base}</p>
                  )}
                </div>

                <div className={styles.criaturaActions}>
                  <button
                    className={styles.editButtonAction}
                    onClick={() => handleEdit(criatura)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(criatura.id)}
                    disabled={deletingId === criatura.id}
                  >
                    {deletingId === criatura.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingId !== null && (
          <div className={styles.modalOverlay} onClick={handleCancelEdit}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Editar Criatura</h2>
                <button className={styles.closeButton} onClick={handleCancelEdit}>
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={editForm.nombre || ''}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Clasificación</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={editForm.clasificacion || ''}
                      onChange={(e) => handleInputChange('clasificacion', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo</label>
                    <select
                      className={styles.input}
                      value={editForm.tipo || ''}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="Normal">Normal</option>
                      <option value="Subtipo">Subtipo</option>
                      <option value="Legendarios">Legendarios</option>
                      <option value="Venerables">Venerables</option>
                      <option value="Desterrados">Desterrados</option>
                      <option value="Prohibidos">Prohibidos</option>
                      <option value="Extintos">Extintos</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Daño Base</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editForm.danio_base || ''}
                      onChange={(e) => handleInputChange('danio_base', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Habilidad Ataque</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editForm.HabilidadAtaque || ''}
                      onChange={(e) => handleInputChange('HabilidadAtaque', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Habilidad Defensa</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editForm.HabilidadDefensa || ''}
                      onChange={(e) => handleInputChange('HabilidadDefensa', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Puntos Vitales</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editForm.PuntosVitales || ''}
                      onChange={(e) => handleInputChange('PuntosVitales', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Germinación</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.germinacion || ''}
                      onChange={(e) => handleInputChange('germinacion', e.target.value)}
                      rows={3}
                      placeholder="Proceso de nacimiento y crecimiento..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.descripcion || ''}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      rows={6}
                      placeholder="Historia, comportamiento y detalles biológicos..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Apariencia (URL de imagen)</label>
                    <input
                      type="url"
                      className={styles.input}
                      value={editForm.apariencia || ''}
                      onChange={(e) => handleInputChange('apariencia', e.target.value)}
                      placeholder="https://res.cloudinary.com/.../imagen.png"
                    />
                    <small className={styles.helperText}>
                      Utiliza la URL de la imagen de Cloudinary.
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Observaciones</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.observaciones || ''}
                      onChange={(e) => handleInputChange('observaciones', e.target.value)}
                      rows={3}
                      placeholder="Notas adicionales para el administrador..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Forma de Ser</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.forma_ser || ''}
                      onChange={(e) => handleInputChange('forma_ser', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className={styles.formSection}>
                    <h2 className={styles.sectionSubtitle}>Habilidades</h2>
                    {(editForm.habilidades || []).map((habilidad, index) => (
                      <div key={index} className={styles.formSection} style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px', background: '#f8fafc', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre de habilidad</label>
                            <input
                              type="text"
                              className={styles.input}
                              value={habilidad.nombre || ''}
                              onChange={(e) => handleHabilidadChange(index, 'nombre', e.target.value)}
                              placeholder="Ej: Combate"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Descripción de la habilidad</label>
                            <textarea
                              className={styles.textarea}
                              value={habilidad.descripcion || ''}
                              onChange={(e) => handleHabilidadChange(index, 'descripcion', e.target.value)}
                              rows={4}
                              style={{ minHeight: '120px' }}
                              placeholder="Describe detalladamente el efecto de esta habilidad..."
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => handleRemoveHabilidad(index)}
                            style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                          >
                            Eliminar habilidad
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleAddHabilidad}
                    >
                      Añadir habilidad
                    </button>
                  </div>

                  <div className={styles.formSection}>
                    <h2 className={styles.sectionSubtitle}>Depredadores</h2>
                    {(editForm.depredadores || []).map((depredador, index) => (
                      <div key={index} className={styles.dynamicGroup}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Depredador</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={depredador.descripcion || ''}
                            onChange={(e) => handleDepredadorChange(index, e.target.value)}
                            placeholder="Ej: Enemigo volador"
                          />
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveDepredador(index)}
                        >
                          Eliminar depredador
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleAddDepredador}
                    >
                      Añadir depredador
                    </button>
                  </div>
                </form>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button
                  className={styles.editButton}
                  onClick={handleSaveEdit}
                  disabled={!editForm.nombre?.trim()}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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