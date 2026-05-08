'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

export default function CreateCriaturaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    clasificacion: '',
    tipo: '',
    danio_base: '',
    HabilidadAtaque: '',
    HabilidadDefensa: '',
    PuntosVitales: '',
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
        router.push('/dashboard');
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
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Crear Nueva Criatura</h1>
        <button className={styles.logoutButton} onClick={handleBack}>
          Volver al Dashboard
        </button>
      </div>

      <div className={styles.createForm}>
        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.formGroup}>
            <label htmlFor="tipo" className={styles.label}>Tipo</label>
            <select
              id="tipo"
              name="tipo"
              className={styles.input}
              value={formData.tipo}
              onChange={handleChange}
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

          <div className={styles.formGroup}>
            <label htmlFor="germinacion" className={styles.label}>Germinación</label>
            <textarea
              id="germinacion"
              name="germinacion"
              className={styles.textarea}
              value={formData.germinacion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descripcion" className={styles.label}>Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={styles.textarea}
              value={formData.descripcion}
              onChange={handleChange}
              rows={4}
            />
          </div>

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
              Pega aquí la URL de Cloudinary de la criatura.
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="observaciones" className={styles.label}>Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              className={styles.textarea}
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="forma_ser" className={styles.label}>Forma de Ser</label>
            <textarea
              id="forma_ser"
              name="forma_ser"
              className={styles.textarea}
              value={formData.forma_ser}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionSubtitle}>Habilidades</h2>
            {habilidades.map((habilidad, index) => (
              <div key={index} className={styles.dynamicGroup}>
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
                  <label className={styles.label}>Descripción</label>
                  <textarea
                    className={styles.textarea}
                    value={habilidad.descripcion}
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

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.createButton}
            disabled={loading || !formData.nombre.trim()}
          >
            {loading ? 'Creando...' : 'Crear Criatura'}
          </button>
        </form>
      </div>
    </div>
  );
}