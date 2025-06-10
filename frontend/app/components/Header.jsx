"use client";
import styles from './Header.module.css';

export default function Header({ category, onChangeCategory }) {
  const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : "None";
  return (
    <header className={styles.header}>
      <div className={styles.categoryDisplay}>
        Topic: <span>{displayCategory}</span>
      </div>
      <button onClick={onChangeCategory} className={styles.changeButton}>
        Change
      </button>
    </header>
  );
}