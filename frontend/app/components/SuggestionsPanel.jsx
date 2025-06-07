"use client";
import styles from './SuggestionsPanel.module.css'; // External CSS module

export default function SuggestionsPanel({ suggestions, onSelect, onShuffle, canTakeAction }) {
  const panelTitle = canTakeAction ? "It's your turn! Choose or type:" : "Waiting for friend's reply...";
  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>{panelTitle}</h4>
        {canTakeAction && hasSuggestions && (
          <button onClick={onShuffle} className={styles.shuffleButton} title="Get new suggestions">
            Shuffle 🔄
          </button>
        )}
      </div>
      <div className={styles.list}>
        {hasSuggestions ? (
          suggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item)}
              disabled={!canTakeAction}
              className={styles.suggestionButton}
            >
              {item}
            </button>
          ))
        ) : (
          <p className={styles.noSuggestions}>
            {canTakeAction ? "Loading suggestions or type your message..." : "Suggestions will appear here..."}
          </p>
        )}
      </div>
    </div>
  );
}
