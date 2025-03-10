import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../hooks/useTimer';

interface AnimatedTimerProps {
  initialSeconds: number;
  onTimerEnd?: () => void; // callback, np. koniec ćwiczenia
}

const AnimatedTimer: React.FC<AnimatedTimerProps> = ({ initialSeconds, onTimerEnd }) => {
  const { seconds, isRunning, start, pause, resume, restart } = useTimer(initialSeconds);

  // Kiedy licznik dojdzie do 0, wywołaj callback, jeśli jest podany
  useEffect(() => {
    if (seconds === 0 && onTimerEnd) {
      onTimerEnd();
    }
  }, [seconds, onTimerEnd]);

  return (
    <div style={styles.container}>
      {/* Sekcja wyświetlania czasu z animacją */}
      <AnimatePresence mode="popLayout">
        {/* Klucz zależny od aktualnej wartości seconds, by Framer Motion animował zmianę */}
        <motion.div
          key={seconds}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={styles.timerValue}
        >
          {seconds}
        </motion.div>
      </AnimatePresence>

      {/* Panel przycisków */}
      <div style={styles.buttons}>
        {!isRunning && seconds === initialSeconds && (
          <button onClick={start}>Start</button>
        )}
        {isRunning && <button onClick={pause}>Pause</button>}
        {!isRunning && seconds > 0 && seconds < initialSeconds && (
          <button onClick={resume}>Resume</button>
        )}
        <button onClick={restart}>Restart</button>
      </div>
    </div>
  );
};

export default AnimatedTimer;

// Proste style inline – można oczywiście przenieść do .module.css
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  timerValue: {
    fontSize: '4rem',
    fontWeight: 'bold',
    textAlign: 'center' as const,
  },
  buttons: {
    display: 'flex',
    gap: '0.5rem',
  },
};
