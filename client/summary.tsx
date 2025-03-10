import React from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import styles from '../styles/SummaryScreen.module.css';

interface SummaryProps {
  // Możesz tu dodać dowolne props, np. wyniki testu, liczbę słów/min
  wpm: number;
  accuracy: number;
}

export const getServerSideProps: GetServerSideProps = async () => 

const data = { wpm: 85, accuracy: 94 };

    return {
      props: {
        wpm: data.wpm,
        accuracy: data.accuracy,
      },
    };
  };
  

const SummaryScreen: React.FC<SummaryProps> = ({ wpm, accuracy }) => {


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
