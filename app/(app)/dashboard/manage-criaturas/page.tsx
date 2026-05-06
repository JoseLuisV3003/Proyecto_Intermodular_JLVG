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
  danio_base?: number;
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCriaturas = criaturas.filter((criatura) =>
    criatura.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        setEditingId(null);
        setEditForm({});
      } else {
        const data = await response.json();
        alert(data.error || 'Error al actualizar criatura');
      }
    } catch (error) {
      console.error('Error actualizando criatura:', error);
      alert('Error al actualizar criatura');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta criatura? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/criaturas/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCriaturas(criaturas.filter(c => c.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar criatura');
      }
    } catch (error) {
      console.error('Error eliminando criatura:', error);
      alert('Error al eliminar criatura');
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
          <h1>Gestionar Criaturas</h1>
          <p className={styles.subTitle}>Crea, edita o elimina criaturas desde aquí.</p>
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
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar criaturas por nombre..."
          />
        </div>

        {filteredCriaturas.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No hay criaturas que coincidan con la búsqueda</h3>
            <p>Prueba con otro nombre o borra el filtro.</p>
          </div>
        ) : (
          <div className={styles.criaturasGrid}>
            {filteredCriaturas.map((criatura) => (
              <div key={criatura.id} className={styles.criaturaCard}>
                {criatura.apariencia && criatura.apariencia.startsWith('http') && (
                  <img
                    src={criatura.apariencia}
                    alt={criatura.nombre}
                    className={styles.criaturaCardImage}
                  />
                )}
                <div className={styles.criaturaHeader}>
                  <h3 className={styles.criaturaName}>{criatura.nombre}</h3>
                  <div className={styles.criaturaMeta}>
                    ID: {criatura.id}
                    {criatura.clasificacion && (
                      <span className={styles.clasificacionBadge}>
                        {criatura.clasificacion}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.criaturaDetails}>
                  {criatura.descripcion && (
                    <p className={styles.criaturaDesc}>{criatura.descripcion}</p>
                  )}

                  <div className={styles.criaturaStats}>
                    {criatura.danio_base && (
                      <span>Daño: {criatura.danio_base}</span>
                    )}
                  </div>
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
                    <label className={styles.label}>Daño Base</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={editForm.danio_base || ''}
                      onChange={(e) => handleInputChange('danio_base', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Germinación</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.germinacion || ''}
                      onChange={(e) => handleInputChange('germinacion', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      className={styles.textarea}
                      value={editForm.descripcion || ''}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      rows={3}
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
                      rows={2}
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
                      <div key={index} className={styles.dynamicGroup}>
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
                          <label className={styles.label}>Descripción</label>
                          <textarea
                            className={styles.textarea}
                            value={habilidad.descripcion || ''}
                            onChange={(e) => handleHabilidadChange(index, 'descripcion', e.target.value)}
                            rows={2}
                            placeholder="Descripción de la habilidad"
                          />
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveHabilidad(index)}
                        >
                          Eliminar habilidad
                        </button>
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
    </div>
  );
}