// src/components/SettingsModal.tsx
import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [difficulty, setDifficulty] = useState<string>('medium');
  
  if (!isOpen) return null; // nie renderuj nic, jeśli modal ma być ukryty

  const handleSave = () => {
    // np. wysyłasz difficulty do globalnego stanu lub wykonujesz zapytanie
    onClose(); // zamknij modal po zapisaniu
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Zapobiegamy zamykaniu modala po kliknięciu w 'okno' */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Ustawienia</h3>

        <label htmlFor="difficulty">Poziom trudności:</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Łatwy</option>
          <option value="medium">Średni</option>
          <option value="hard">Trudny</option>
        </select>

        <div className="modal-buttons">
          <button onClick={handleSave}>Zapisz</button>
          <button onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  );
};
