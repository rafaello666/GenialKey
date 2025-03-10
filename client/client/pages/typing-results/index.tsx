import React, { useState } from 'react';
import { submitTypingResult } from '../../services/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default function TypingResultsPage() {
  const [lessonId, setLessonId] = useState<number>(1);
  const [wpm, setWpm] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitTypingResult(lessonId, wpm);
      alert('Wynik zapisany!');
    } catch (error) {
      console.error('Błąd zapisu wyniku:', error);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Rejestracja wyników pisania</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Lesson ID:</label>
          <input
            type="number"
            value={lessonId}
            onChange={(e) => setLessonId(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label>Słowa na minutę (WPM):</label>
          <input
            type="number"
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            required
          />
        </div>
        <button type="submit">Zapisz wynik</button>
      </form>
    </div>
  );
}

export function HomePage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Witaj w aplikacji do nauki szybkiego pisania!</h1>
      <p>
        Przejdź do zakładki <a href="/courses">Courses</a>, aby zobaczyć listę
        kursów.
      </p>
    </div>
  );
}
