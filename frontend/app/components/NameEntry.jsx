"use client";
import { useState } from 'react';
import styles from './NameEntry.module.css';


export default function NameEntry({ onNameSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Welcome to Auto-Chat!</h1>
        <p className={styles.subtitle}>Please enter your name to join the chat.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Your Name"
          maxLength={15}
          required
        />
        <button type="submit" className={styles.button}>
          Join Chat
        </button>
      </form>
    </div>
  );
}
