"use client";
import styles from './CategorySelector.module.css'; // CSS Module import

export default function CategorySelector({ onSelectCategory }) {
  const categories = ["Romantic", "Food", "Gardening", "Singing", "General"];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Choose a Topic to Start</h3>
      <div className={styles.grid}>
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => onSelectCategory(cat.toLowerCase())} 
            className={styles.categoryButton}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
