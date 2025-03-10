import React from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import styles from '../styles/SummaryScreen.module.css';

interface SummaryProps {
  // Możesz tu dodać dowolne props, np. wyniki testu, liczbę słów/min
  wpm: number;
  accuracy: number;
}
export const getServerSideProps: GetServerSideProps = async () => {
    // Tu np. fetch z backendu NestJS:
    // const res = await fetch('https://twoja-domena.pl/api/typing-results/last');
    // const data = await res.json();
    // W przykładzie wpiszmy wartości na sztywno
    const data = { wpm: 85, accuracy: 94 };
const SummaryScreen: React.FC<SummaryProps> = ({ wpm, accuracy }) => {
    return (
        <div className={styles.summaryScreen}>
          <h1>Podsumowanie ćwiczenia</h1>
          <p>Twoja prędkość pisania: <strong>{wpm} WPM</strong></p>
          <p>Twoja dokładność: <strong>{accuracy}%</strong></p>
    
          <div className={styles.actions}>
            <Link href="/typing-results">
              <button className={styles.primaryButton}>Zapisz wynik</button>
            </Link>
            <Link href="/ranking">
              <button className={styles.secondaryButton}>Tabela wyników</button>
            </Link>
            <Link href="/courses">
              <button className={styles.secondaryButton}>Wybierz kolejne ćwiczenie</button>
            </Link>
          </div>
        </div>
      );
    };
  const userWpm = wpm || 0;
  const userAccuracy = accuracy || 0;
  return {
    props: {
      wpm: data.wpm,
      accuracy: data.accuracy,
    },
  };
};

  return (
    <div className={styles.summaryScreen}>
      <h1>Podsumowanie ćwiczenia</h1>
      <p>Twoja prędkość pisania: <strong>{userWpm} WPM</strong></p>
      <p>Twoja dokładność: <strong>{userAccuracy}%</strong></p>

      <div className={styles.actions}>
        <Link href="/typing-results">
          <button className={styles.primaryButton}>Zapisz wynik</button>
        </Link>

        <Link href="/ranking">
          <button className={styles.secondaryButton}>Tabela wyników</button>
        </Link>

        <Link href="/courses">
          <button className={styles.secondaryButton}>Wybierz kolejne ćwiczenie</button>
        </Link>
      </div>
    </div>
  );
};

export default SummaryScreen;
