import Link from 'next/link';
import styles from './login_sucessful.module.css';

export default function LoginSuccessfulPage() {
  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>Has iniciado sesión</h1>
        <p className={styles.message}>Bienvenido a Mi semillero Na&apos;az</p>
        <Link href="/dashboard" className={styles.button}>
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}