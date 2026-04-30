import Link from 'next/link';
import styles from './register.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <form className={styles.form}>
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
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.input}
              placeholder="Ingresa tu contraseña"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Repetir contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={styles.input}
              placeholder="Repite tu contraseña"
            />
          </div>
          <button
            type="submit"
            className={styles.submitButton}
          >
            Registrarse
          </button>
        </form>
        <div className={styles.linkContainer}>
          <span>¿Ya estás registrado? </span>
          <Link href="/login" className={styles.loginLink}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
