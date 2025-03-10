import React from 'react';
import Link from 'next/link';
import styles from '../styles/WelcomeScreen.module.css';
<<<<<<< HEAD
<<<<<<< HEAD
import { motion } from 'framer-motion';

const WelcomeScreen: React.FC = () => {
    <motion.div
    className={styles.welcomeScreen}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    <motion.h1
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Witaj w Aplikacji Szybkiego Pisania
    </motion.h1>
    <motion.p
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
    </motion.p>

    <motion.div
      className={styles.actions}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Link href="/courses">
        <button className={styles.primaryButton}>Wybierz ćwiczenie</button>
      </Link>
      <Link href="/lessons">
        <button className={styles.secondaryButton}>Rozpocznij naukę</button>
      </Link>
    </motion.div>
  </motion.div>


    return (
=======

const WelcomeScreen: React.FC = () => {
  return (
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
=======

const WelcomeScreen: React.FC = () => {
  return (
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
    <div className={styles.welcomeScreen}>
      <h1>Witaj w Aplikacji Szybkiego Pisania</h1>
      <p>
        Rozpocznij swoją przygodę z szybszym pisaniem na klawiaturze!
        Wybierz ćwiczenie, aby przejść do praktyki.
<<<<<<< HEAD
<<<<<<< HEAD
      </p>          
      </div>
      );
};

export default WelcomeScreen
=======
=======
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
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
<<<<<<< HEAD
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
=======
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
