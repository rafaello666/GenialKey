import { useState, useEffect, useCallback, useRef } from 'react';

type UseTimerReturn = {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
};

export function useTimer(initialSeconds: number): UseTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rozpocznij odliczanie (ustawia isRunning = true, jeśli nie trwa)
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  // Wstrzymaj odliczanie (setIsRunning = false)
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Wznów odliczanie (jeśli jest zatrzymane)
  const resume = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  // Zrestartuj do wartości początkowej
  const restart = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  // Główna pętla timera
  useEffect(() => {
    // Jeżeli timer jest uruchomiony, to co 1s dekrementujemy
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            // Gdy czas dobiega końca, zatrzymaj odliczanie
            clearInterval(intervalRef.current as NodeJS.Timeout);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Sprzątanie po odmontowaniu lub zmianie
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    resume,
    restart,
  };
}
