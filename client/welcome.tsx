import React from 'react';
import Link from 'next/link';
import styles from '../styles/WelcomeScreen.module.css';

const WelcomeScreen: React.FC = () => {
  return (
    <div className={styles.welcomeScreen}>
      <h1>Witaj w Aplikacji Szybkiego Pisania</h1>
      <p>
        Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
        Wybierz ćwiczenie, aby przejść do praktyki.
      </p>

      <div className={styles.actions}>
        {/* Przejście np. do listy dostępnych kursów (lekcji) */}
        <Link href="/courses">
          <button className={styles.primaryButton}>Wybierz ćwiczenie</button>
        </Link>

        {/* Przykładowy przycisk startu bezpośrednio */}
        <Link href="/lessons">
          <button className={styles.secondaryButton}>Rozpocznij naukę</button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomeScreen;
