"use client";
import { useRouter } from 'next/navigation';
import { v4 as uuidV4 } from 'uuid';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const createNewRoom = () => {
    const roomId = uuidV4().slice(0, 8); // Thoda chhota room ID
    router.push(`/${roomId}`);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Auto-Chat</h1>
        <p className={styles.subtitle}>Spark meaningful conversations, effortlessly.</p>
        <button onClick={createNewRoom} className={styles.createButton}>
          Start a New Chat
        </button>
      </div>
    </main>
  );
}