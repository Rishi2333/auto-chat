"use client";
import { useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css'; // CSS Module import

export default function ChatWindow({ messages }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.messageContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${msg.type === 'sent' ? styles.sent : styles.received}`}>
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}