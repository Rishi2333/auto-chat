"use client";
import styles from './StatusScreen.module.css'; // CSS Module import

export default function StatusScreen({ title, message, showHomeButton = false }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {showHomeButton && (
        <button className={styles.button} onClick={() => window.location.href = '/'}>
          Go to Homepage
        </button>
      )}
    </div>
  );
}
