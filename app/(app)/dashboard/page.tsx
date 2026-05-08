'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface Semillero {
  id: number;
  nombre: string;
  usuario_correo: string;
}

interface User {
  correo: string;
  usuario: string;
  rol: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoLimite, setNuevoLimite] = useState(5);
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      router.push('/login');
    }
  };
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [loading, setLoading] = useState(true);

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
        body: JSON.stringify({ nombre: nuevoNombre, LimiteDeCombate: nuevoLimite }),
      });

      if (response.ok) {
        const data = await response.json();
        setSemilleros([...semilleros, data.semillero]);
        setNuevoNombre('');
        setNuevoLimite(5);
      }
    } catch (error) {
      console.error('Error creando semillero:', error);
    }
  };

  const iniciarEdicion = (semillero: Semillero) => {
    setEditandoId(semillero.id);
    setEditandoNombre(semillero.nombre);
  };

  const guardarEdicion = async () => {
    if (editandoId === null || !editandoNombre.trim()) return;

    try {
      const response = await fetch(`/api/semilleros/${editandoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: editandoNombre }),
      });

      if (response.ok) {
        const data = await response.json();
        setSemilleros(semilleros.map(s =>
          s.id === editandoId ? data.semillero : s
        ));
        setEditandoId(null);
        setEditandoNombre('');
      }
    } catch (error) {
      console.error('Error editando semillero:', error);
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoNombre('');
  };

  const handleDeleteSemillero = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres borrar este semillero? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/semilleros/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSemilleros(semilleros.filter((semillero) => semillero.id !== id));
        if (editandoId === id) {
          setEditandoId(null);
          setEditandoNombre('');
        }
      } else {
        console.error('Error borrando semillero');
      }
    } catch (error) {
      console.error('Error borrando semillero:', error);
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
              Gestionar Criaturas
            </button>
          )}
          <button className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className={styles.semillerosSection}>
        <h2 className={styles.sectionTitle}>Gestión de Semilleros</h2>

        <div className={styles.createForm}>
          <input
            type="text"
            className={styles.createInput}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre del nuevo semillero"
          />
          <input
            type="number"
            className={styles.createInput}
            value={nuevoLimite}
            onChange={(e) => setNuevoLimite(parseInt(e.target.value) || 5)}
            placeholder="Límite de combate"
            min="1"
            style={{ width: '150px' }}
            title="Límite de combate"
          />
          <button
            className={styles.createButton}
            onClick={crearSemillero}
            disabled={!nuevoNombre.trim()}
          >
            Crear Semillero
          </button>
        </div>

        <div className={styles.semillerosList}>
          {semilleros.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No tienes semilleros aún</h3>
              <p>Crea tu primer semillero usando el formulario de arriba.</p>
            </div>
          ) : (
            semilleros.map((semillero) => (
              <div key={semillero.id} className={styles.semilleroItem}>
                {editandoId === semillero.id ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      className={styles.editInput}
                      value={editandoNombre}
                      onChange={(e) => setEditandoNombre(e.target.value)}
                      autoFocus
                    />
                    <button
                      className={styles.editButton}
                      onClick={guardarEdicion}
                    >
                      Guardar
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={cancelarEdicion}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.semilleroInfo}>
                      <div className={styles.semilleroName}>{semillero.nombre}</div>
                      <div className={styles.semilleroMeta}>ID: {semillero.id}</div>
                    </div>
                    <div className={styles.semilleroActions}>
                      <button
                        className={styles.editButtonAction}
                        onClick={() => iniciarEdicion(semillero)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.viewButton}
                        onClick={() => router.push(`/dashboard/${semillero.id}`)}
                      >
                        Ver Criaturas
                      </button>
                      <button
                        className={styles.deleteButtonAction}
                        onClick={() => handleDeleteSemillero(semillero.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
