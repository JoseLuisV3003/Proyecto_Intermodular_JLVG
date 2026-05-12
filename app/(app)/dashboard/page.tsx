'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface Semillero {
  id: number;
  nombre: string;
  color?: string;
  LimiteDeCombate?: number;
  LimiteMaximo?: number;
  usuario_correo: string;
}

interface User {
  correo: string;
  usuario: string;
  rol: string;
}

const COLOR_OPTIONS = [
  { name: 'Verde', image: 'verde.svg' },
  { name: 'Azul', image: 'azul.svg' },
  { name: 'Rosa Intenso', image: 'rosa-intenso.svg' },
  { name: 'Roja', image: 'roja.svg' },
  { name: 'Amarilla', image: 'amarilla.svg' },
  { name: 'Rosa Suave', image: 'rosa-suave.svg' },
  { name: 'Verde Oscuro', image: 'verde-oscuro.svg' },
  { name: 'Azul Oscuro', image: 'azul-oscuro.svg' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoLimite, setNuevoLimite] = useState(5);
  const [nuevoLimiteMaximo, setNuevoLimiteMaximo] = useState(20);
  const [nuevoColor, setNuevoColor] = useState('Verde');
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [editandoColor, setEditandoColor] = useState('');
  const [editandoLimiteMaximo, setEditandoLimiteMaximo] = useState(20);
  const [loading, setLoading] = useState(true);
  const [confirmandoBorradoId, setConfirmandoBorradoId] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
          LimiteMaximo: nuevoLimiteMaximo,
          color: nuevoColor
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSemilleros([...semilleros, data.semillero]);
        setNuevoNombre('');
        setNuevoLimite(5);
        setNuevoLimiteMaximo(20);
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
    setEditandoLimiteMaximo(semillero.LimiteMaximo || 20);
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
          color: editandoColor,
          LimiteMaximo: editandoLimiteMaximo
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
        setEditandoLimiteMaximo(20);
      }
    } catch (error) {
      console.error('Error editando semillero:', error);
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoNombre('');
    setEditandoColor('');
    setEditandoLimiteMaximo(20);
  };

  const handleDeleteSemillero = (id: number) => {
    setConfirmandoBorradoId(id);
  };

  const confirmarEliminacion = async (id: number) => {
    try {
      const response = await fetch(`/api/semilleros/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSemilleros(semilleros.filter((semillero) => semillero.id !== id));
        showNotification('Semillero eliminado correctamente.', 'success');
        setConfirmandoBorradoId(null);
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

  const cancelarEliminacion = () => {
    setConfirmandoBorradoId(null);
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("¿ESTÁS COMPLETAMENTE SEGURO? Esta acción es IRREVERSIBLE. Se borrarán todos tus semilleros, formaciones y datos de usuario permanentemente.");

    if (!confirmed) return;

    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Cuenta eliminada correctamente. Adiós...', 'success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showNotification('Error al eliminar la cuenta.', 'error');
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      showNotification('Error de conexión.', 'error');
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
          <button
            className={styles.settingsButton}
            onClick={() => setIsSettingsModalOpen(true)}
            title="Ajustes de Usuario"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
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

        {semilleros.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No tienes semilleros aún</h3>
            <p>Crea tu primer semillero usando el botón de arriba.</p>
          </div>
        ) : (
          <div className={styles.semillerosGrid}>
            {semilleros.map((semillero) => (
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
                      <img src="/icons/pluma.svg" alt="Editar" className={styles.iconButtonImg} />
                    </button>
                    <div
                      className={styles.iconButton}
                      onClick={(e) => { e.stopPropagation(); handleDeleteSemillero(semillero.id); }}
                      title="Borrar"
                      style={{ position: 'relative' }}
                      role="button"
                      tabIndex={0}
                    >
                      <img src="/icons/delete.svg" alt="Borrar" className={styles.iconButtonImg} />

                      {confirmandoBorradoId === semillero.id && (
                        <div className={styles.deleteConfirmDropdown} onClick={(e) => e.stopPropagation()}>
                          <p className={styles.deleteConfirmTitle}>¿Eliminar semillero?</p>
                          <div className={styles.deleteConfirmButtons}>
                            <button
                              className={styles.confirmDeleteBtn}
                              onClick={() => confirmarEliminacion(semillero.id)}
                            >
                              Si, estoy seguro
                            </button>
                            <button
                              className={styles.cancelDeleteBtn}
                              onClick={cancelarEliminacion}
                            >
                              Mejor no...
                            </button>
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

              {editandoId === null ? (
                <>
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
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Capacidad Máxima de Na'az</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={nuevoLimiteMaximo}
                      onChange={(e) => setNuevoLimiteMaximo(parseInt(e.target.value) || 20)}
                      min="1"
                    />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Capacidad Máxima de Na'az</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={editandoLimiteMaximo}
                    onChange={(e) => setEditandoLimiteMaximo(parseInt(e.target.value) || 20)}
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

      {/* Modal de Ajustes de Usuario */}
      {isSettingsModalOpen && (
        <div className={styles.modernModalOverlay} onClick={() => setIsSettingsModalOpen(false)}>
          <div className={styles.modernModalContent} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modernModalHeader}>
              <h2>Ajustes de Usuario</h2>
              <button className={styles.modernCloseButton} onClick={() => setIsSettingsModalOpen(false)}>×</button>
            </div>
            <div className={styles.modernModalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Información de la cuenta</h3>
                  <p style={{ margin: 0, color: '#64748b' }}><strong>Usuario:</strong> {user?.usuario}</p>
                  <p style={{ margin: 0, color: '#64748b' }}><strong>Correo:</strong> {user?.correo}</p>
                </div>


                <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />

                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Zona de Peligro</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Al eliminar tu cuenta, se perderán todos tus semilleros y Na'az de forma permanente.
                  </p>
                  <button
                    className={styles.confirmDeleteBtn}
                    style={{ width: '100%', padding: '0.8rem' }}
                    onClick={handleDeleteAccount}
                  >
                    Eliminar mi cuenta definitivamente
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setIsSettingsModalOpen(false)}>
                Cerrar
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

