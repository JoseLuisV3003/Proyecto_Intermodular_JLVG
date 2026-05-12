'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './register.module.css';
import { validatePassword, validateEmail } from '../../lib/validation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.isValid) {
      setError(emailValidation.message || 'Correo electrónico inválido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'La contraseña no cumple los requisitos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: email.trim(),
          usuario: username.trim(),
          password,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear el usuario');
        setLoading(false);
        // Borrar campos automáticamente en caso de error
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      showNotification('¡Cuenta creada con éxito! Redirigiendo...', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Error al conectar con el servidor');
      setLoading(false);
      console.error('Error registro:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img
            src="https://res.cloudinary.com/dxdij0mxf/image/upload/v1778231980/image-removebg-preview_lomu1g.png"
            alt="Logo Mi Semillero Na'az"
            className={styles.logoImage}
          />
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Nombre de usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.input}
              placeholder="Ingresa tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.input}
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={`${styles.input} ${styles.passwordInput}`}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Repetir contraseña
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className={`${styles.input} ${styles.passwordInput}`}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <div className={styles.linkContainer}>
          <span>¿Ya estás registrado? </span>
          <Link href="/login" className={styles.loginLink}>
            Inicia sesión
          </Link>
        </div>
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
