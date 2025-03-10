// src/components/Scoreboard.tsx
import React from 'react';

interface Score {
  username: string;
  wpm: number;        // słowa na minutę
  accuracy: number;   // dokładność
  date: string;
}

interface ScoreboardProps {
  scores: Score[];
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores }) => {
  return (
    <div className="scoreboard-container">
      <h2>Wyniki</h2>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>Użytkownik</th>
            <th>Słowa/min</th>
            <th>Dokładność (%)</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, idx) => (
            <tr key={idx}>
              <td>{score.username}</td>
              <td>{score.wpm}</td>
              <td>{score.accuracy}</td>
              <td>{score.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
