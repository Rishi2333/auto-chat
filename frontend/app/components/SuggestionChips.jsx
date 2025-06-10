"use client";
import styles from './SuggestionChips.module.css';

export default function SuggestionChips({ suggestions, onSelect, onShuffle, canTakeAction }) {
  if (!canTakeAction || !suggestions || suggestions.length === 0) {
    return null; // Agar turn nahi hai ya suggestions nahi hain, toh kuch mat dikhao
  }

  return (
    <div className={styles.chipsContainer}>
      {/* Shuffle Button Chip */}
      <button onClick={onShuffle} className={styles.shuffleChip} disabled={!canTakeAction}>
        New Ideas 🔄
      </button>
      
      {/* Suggestion Chips */}
      {suggestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item)}
          disabled={!canTakeAction}
          className={styles.chip}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
