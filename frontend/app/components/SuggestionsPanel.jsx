"use client";
import styles from './SuggestionsPanel.module.css';

export default function SuggestionsPanel({ 
    suggestions, 
    onSelect, 
    onShuffle, 
    isMyTurn, // Kya mera turn hai?
    isFriendsTurn, // Kya dost ka turn hai?
}) {

  const hasSuggestions = suggestions && suggestions.length > 0;
  if (!hasSuggestions) return null; // Agar suggestions nahi hain toh kuch mat dikhao

  if (isMyTurn) {
    // Agar mera turn hai, toh clickable, right-aligned buttons dikhao
    return (
      <div className={`${styles.panel} ${styles.myTurn}`}>
        <div className={styles.list}>
          <button onClick={onShuffle} className={styles.shuffleChip}>Shuffle 🔄</button>
          {suggestions.map((item, index) => (
            <button key={index} onClick={() => onSelect(item)} className={styles.chip}>
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isFriendsTurn) {
    // Agar dost ka turn hai, toh non-clickable, left-aligned chips dikhao
    return (
      <div className={`${styles.panel} ${styles.friendsTurn}`}>
        <div className={styles.list}>
          {suggestions.map((item, index) => (
            <div key={index} className={styles.chip}>
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Agar kisi ka turn nahi (initial state), toh suggestions ko center mein dikhao
  // Yeh starter questions ke liye hai
  return (
    <div className={styles.panel}>
        <div className={styles.list} style={{ justifyContent: 'center' }}>
            {suggestions.map((item, index) => (
                <button key={index} onClick={() => onSelect(item)} className={`${styles.chip} ${styles.myTurn}`}>
                {item}
                </button>
            ))}
        </div>
    </div>
  );
}
