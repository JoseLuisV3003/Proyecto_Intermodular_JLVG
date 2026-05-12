'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

export default function CreateCriaturaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    clasificacion: '',
    tipo: 'Normal',
    danio_base: '',
    HabilidadAtaque: '',
    HabilidadDefensa: '',
    PuntosVitales: '',
    AlturaCM: '',
    germinacion: '',
    descripcion: '',
    apariencia: '',
    observaciones: '',
    forma_ser: ''
  });
  const [habilidades, setHabilidades] = useState<{ nombre: string; descripcion: string }[]>([]);
  const [depredadores, setDepredadores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddHabilidad = () => {
    setHabilidades(prev => [...prev, { nombre: '', descripcion: '' }]);
  };

  const handleHabilidadChange = (index: number, field: 'nombre' | 'descripcion', value: string) => {
    setHabilidades(prev => prev.map((habilidad, i) =>
      i === index ? { ...habilidad, [field]: value } : habilidad
    ));
  };

  const handleRemoveHabilidad = (index: number) => {
    setHabilidades(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDepredador = () => {
    setDepredadores(prev => [...prev, '']);
  };

  const handleDepredadorChange = (index: number, value: string) => {
    setDepredadores(prev => prev.map((depredador, i) =>
      i === index ? value : depredador
    ));
  };

  const handleRemoveDepredador = (index: number) => {
    setDepredadores(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        danio_base: formData.danio_base ? parseInt(formData.danio_base) : null,
        HabilidadAtaque: formData.HabilidadAtaque ? parseInt(formData.HabilidadAtaque) : null,
        HabilidadDefensa: formData.HabilidadDefensa ? parseInt(formData.HabilidadDefensa) : null,
        PuntosVitales: formData.PuntosVitales ? parseInt(formData.PuntosVitales) : null,
        AlturaCM: formData.AlturaCM ? parseInt(formData.AlturaCM) : null,
        habilidades: habilidades
          .filter(habilidad => habilidad.nombre.trim())
          .map(habilidad => ({
            nombre: habilidad.nombre.trim(),
            descripcion: habilidad.descripcion.trim() || null
          })),
        depredadores: depredadores
          .map(dep => dep.trim())
          .filter(Boolean)
      };

      const response = await fetch('/api/criaturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        router.push('/dashboard/manage-criaturas');
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear la criatura');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/manage-criaturas');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Crear Nueva Criatura</h1>
          <p className={styles.subTitle} style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500' }}>
            Introduce los detalles de la nueva criatura para añadirla al catálogo.
          </p>
        </div>
        <div className={styles.headerButtons}>
          <button className={styles.logoutButton} onClick={handleBack}>
            Volver al Panel de Administrador
          </button>
        </div>
      </div>

      <div className={styles.modalContent} style={{ margin: '0 auto 3rem', position: 'relative', maxHeight: 'none' }}>
        <div className={styles.modalHeader}>
          <h2>Datos de la Criatura</h2>
        </div>
        <div className={styles.modalBody} style={{ maxHeight: 'none', overflowY: 'visible' }}>
          <form onSubmit={handleSubmit} className={styles.form} id="create-criatura-form">
            
            {/* 1. Nombre */}
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.label}>Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                className={styles.input}
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* 2. Clasificación */}
            <div className={styles.formGroup}>
              <label htmlFor="clasificacion" className={styles.label}>Clasificación</label>
              <input
                type="text"
                id="clasificacion"
                name="clasificacion"
                className={styles.input}
                value={formData.clasificacion}
                onChange={handleChange}
              />
            </div>

            {/* 3. Altura */}
            <div className={styles.formGroup}>
              <label htmlFor="AlturaCM" className={styles.label}>Altura (cm)</label>
              <input
                type="number"
                id="AlturaCM"
                name="AlturaCM"
                className={styles.input}
                value={formData.AlturaCM}
                onChange={handleChange}
              />
            </div>

            {/* 4. Habilidades */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionSubtitle}>Habilidades</h2>
              {habilidades.map((habilidad, index) => (
                <div key={index} className={styles.formSection} style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px', background: '#f8fafc', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre de habilidad</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={habilidad.nombre}
                        onChange={(e) => handleHabilidadChange(index, 'nombre', e.target.value)}
                        placeholder="Ej: Combate"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción de la habilidad</label>
                      <textarea
                        className={styles.textarea}
                        value={habilidad.descripcion}
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

            {/* 5. Apariencia */}
            <div className={styles.formGroup}>
              <label htmlFor="apariencia" className={styles.label}>Apariencia (URL de imagen)</label>
              <input
                type="url"
                id="apariencia"
                name="apariencia"
                className={styles.input}
                placeholder="https://res.cloudinary.com/.../imagen.png"
                value={formData.apariencia}
                onChange={handleChange}
              />
              <small className={styles.helperText}>
                Utiliza la URL de la imagen de Cloudinary.
              </small>
            </div>

            {/* 6. Descripción */}
            <div className={styles.formGroup}>
              <label htmlFor="descripcion" className={styles.label}>Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                className={styles.textarea}
                value={formData.descripcion}
                onChange={handleChange}
                rows={6}
                placeholder="Historia, comportamiento y detalles biológicos..."
              />
            </div>

            {/* 7. Germinación */}
            <div className={styles.formGroup}>
              <label htmlFor="germinacion" className={styles.label}>Germinación</label>
              <textarea
                id="germinacion"
                name="germinacion"
                className={styles.textarea}
                value={formData.germinacion}
                onChange={handleChange}
                rows={3}
                placeholder="Proceso de nacimiento y crecimiento..."
              />
            </div>

            {/* 8. Depredadores */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionSubtitle}>Depredadores</h2>
              {depredadores.map((depredador, index) => (
                <div key={index} className={styles.dynamicGroup}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Depredador</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={depredador}
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

            {/* 9. Observaciones */}
            <div className={styles.formGroup}>
              <label htmlFor="observaciones" className={styles.label}>Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                className={styles.textarea}
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                placeholder="Notas adicionales para el administrador..."
              />
            </div>

            {/* 10. Forma de ser */}
            <div className={styles.formGroup}>
              <label htmlFor="forma_ser" className={styles.label}>Forma de Ser</label>
              <textarea
                id="forma_ser"
                name="forma_ser"
                className={styles.textarea}
                value={formData.forma_ser}
                onChange={handleChange}
                rows={2}
              />
            </div>

            {/* Estadísticas de Combate (Restantes) */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionSubtitle}>Estadísticas de Combate</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="tipo" className={styles.label}>Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    className={styles.input}
                    value={formData.tipo}
                    onChange={handleChange}
                  >
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
                  <label htmlFor="danio_base" className={styles.label}>Daño Base</label>
                  <input
                    type="number"
                    id="danio_base"
                    name="danio_base"
                    className={styles.input}
                    value={formData.danio_base}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="HabilidadAtaque" className={styles.label}>Habilidad Ataque</label>
                  <input
                    type="number"
                    id="HabilidadAtaque"
                    name="HabilidadAtaque"
                    className={styles.input}
                    value={formData.HabilidadAtaque}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="HabilidadDefensa" className={styles.label}>Habilidad Defensa</label>
                  <input
                    type="number"
                    id="HabilidadDefensa"
                    name="HabilidadDefensa"
                    className={styles.input}
                    value={formData.HabilidadDefensa}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="PuntosVitales" className={styles.label}>Puntos Vitales</label>
                  <input
                    type="number"
                    id="PuntosVitales"
                    name="PuntosVitales"
                    className={styles.input}
                    value={formData.PuntosVitales}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {error && <div className={styles.error} style={{ marginTop: '1rem' }}>{error}</div>}
          </form>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={handleBack} type="button">
            Cancelar
          </button>
          <button
            form="create-criatura-form"
            type="submit"
            className={styles.editButton}
            disabled={loading || !formData.nombre.trim()}
          >
            {loading ? 'Creando...' : 'Crear Criatura'}
          </button>
        </div>
      </div>
    </div>
  );
}