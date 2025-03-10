import React from 'react';
import dotenv from 'dotenv';
dotenv.config();
export default function HomePage() {
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
