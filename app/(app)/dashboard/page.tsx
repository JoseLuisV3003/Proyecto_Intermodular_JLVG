'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface Semillero {
  id: number;
  nombre: string;
  color?: string;
  usuario_correo: string;
}

interface User {
  correo: string;
  usuario: string;
  rol: string;
}

const COLOR_OPTIONS = [
  { name: 'Verde', image: 'verde.png' },
  { name: 'Azul', image: 'azul.png' },
  { name: 'Rosa Intenso', image: 'rosa-intenso.png' },
  { name: 'Roja', image: 'roja.png' },
  { name: 'Amarilla', image: 'amarilla.png' },
  { name: 'Rosa Suave', image: 'rosa-suave.png' },
  { name: 'Verde Oscuro', image: 'verde-oscuro.png' },
  { name: 'Azul Oscuro', image: 'azul-oscuro.png' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoLimite, setNuevoLimite] = useState(5);
  const [nuevoColor, setNuevoColor] = useState('Verde');
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [editandoColor, setEditandoColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    cargarSemilleros();
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const cargarSemilleros = async () => {
    try {
      const response = await fetch('/api/semilleros');
      if (response.ok) {
        const data = await response.json();
        setSemilleros(data.semilleros);
      }
    } catch (error) {
      console.error('Error cargando semilleros:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearSemillero = async () => {
    if (!nuevoNombre.trim()) return;

    try {
      const response = await fetch('/api/semilleros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nuevoNombre,
          LimiteDeCombate: nuevoLimite,
          color: nuevoColor
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSemilleros([...semilleros, data.semillero]);
        setNuevoNombre('');
        setNuevoLimite(5);
        setNuevoColor('Verde');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creando semillero:', error);
    }
  };

  const iniciarEdicion = (semillero: Semillero) => {
    setEditandoId(semillero.id);
    setEditandoNombre(semillero.nombre);
    setEditandoColor(semillero.color || 'Verde');
  };

  const guardarEdicion = async () => {
    if (editandoId === null || !editandoNombre.trim()) return;

    try {
      const response = await fetch(`/api/semilleros/${editandoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editandoNombre,
          color: editandoColor
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSemilleros(semilleros.map(s =>
          s.id === editandoId ? data.semillero : s
        ));
        setEditandoId(null);
        setEditandoNombre('');
        setEditandoColor('');
      }
    } catch (error) {
      console.error('Error editando semillero:', error);
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoNombre('');
    setEditandoColor('');
  };

  const handleDeleteSemillero = async (id: number) => {
    // Eliminación directa por petición del usuario
    try {
      const response = await fetch(`/api/semilleros/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSemilleros(semilleros.filter((semillero) => semillero.id !== id));
        showNotification('Semillero eliminado correctamente.', 'success');
        if (editandoId === id) {
          setEditandoId(null);
          setEditandoNombre('');
          setEditandoColor('');
        }
      } else {
        showNotification('Error al eliminar el semillero.', 'error');
      }
    } catch (error) {
      console.error('Error borrando semillero:', error);
      showNotification('Error de conexión.', 'error');
    }
  };

  const getColorImage = (colorName: string | undefined) => {
    const option = COLOR_OPTIONS.find(o => o.name === colorName);
    return option ? `/semilleros/${option.image}` : '/semilleros/verde.png';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src="https://res.cloudinary.com/dxdij0mxf/image/upload/v1778231980/image-removebg-preview_lomu1g.png"
          alt="Logo Mi Semillero Na'az"
          className={styles.headerLogo}
        />
        <div className={styles.headerButtons}>
          {user?.rol === 'administrador' && (
            <button className={styles.adminButton} onClick={() => router.push('/dashboard/manage-criaturas')}>
              Gestionar Na'az
            </button>
          )}
          <button className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className={styles.semillerosSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gestión de Semilleros</h2>
          <button
            className={styles.nuevoSemilleroButton}
            onClick={() => setIsModalOpen(true)}
          >
            NUEVO SEMILLERO
          </button>
        </div>

        <div className={styles.semillerosGrid}>
          {semilleros.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No tienes semilleros aún</h3>
              <p>Crea tu primer semillero usando el botón de arriba.</p>
            </div>
          ) : (
            semilleros.map((semillero) => (
              <div key={semillero.id} className={styles.semilleroCard}>
                <div className={styles.semilleroIconContainer} onClick={() => router.push(`/dashboard/${semillero.id}`)}>
                  <img
                    src={getColorImage(semillero.color)}
                    alt={semillero.nombre}
                    className={styles.semilleroIcon}
                  />
                </div>
                <div className={styles.semilleroCardInfo}>
                  <div className={styles.semilleroCardName}>{semillero.nombre}</div>
                  <div className={styles.semilleroCardActions}>
                    <button
                      className={styles.iconButton}
                      onClick={(e) => { e.stopPropagation(); iniciarEdicion(semillero); }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={(e) => { e.stopPropagation(); handleDeleteSemillero(semillero.id); }}
                      title="Borrar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para Crear/Editar Semillero */}
      {(isModalOpen || editandoId !== null) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentSmall}>
            <div className={styles.modalHeader}>
              <h2>{editandoId !== null ? 'Editar Semillero' : 'Nuevo Semillero'}</h2>
              <button
                className={styles.closeButton}
                onClick={() => { setIsModalOpen(false); cancelarEdicion(); }}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Semillero</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editandoId !== null ? editandoNombre : nuevoNombre}
                  onChange={(e) => editandoId !== null ? setEditandoNombre(e.target.value) : setNuevoNombre(e.target.value)}
                  placeholder="Ej: Mi Granero"
                />
              </div>

              {editandoId === null && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Límite de Combate</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={nuevoLimite}
                    onChange={(e) => setNuevoLimite(parseInt(e.target.value) || 5)}
                    min="1"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Selecciona un Color</label>
                <div className={styles.colorSelector}>
                  {COLOR_OPTIONS.map((option) => (
                    <div
                      key={option.name}
                      className={`${styles.colorOption} ${(editandoId !== null ? editandoColor : nuevoColor) === option.name ? styles.colorOptionSelected : ''
                        }`}
                      onClick={() => editandoId !== null ? setEditandoColor(option.name) : setNuevoColor(option.name)}
                      title={option.name}
                    >
                      <img src={`/semilleros/${option.image}`} alt={option.name} />
                      <span>{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => { setIsModalOpen(false); cancelarEdicion(); }}
              >
                Cancelar
              </button>
              <button
                className={styles.createButton}
                onClick={editandoId !== null ? guardarEdicion : crearSemillero}
                disabled={editandoId !== null ? !editandoNombre.trim() : !nuevoNombre.trim()}
              >
                {editandoId !== null ? 'Guardar Cambios' : 'Crear Semillero'}
              </button>
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

