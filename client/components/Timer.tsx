import React, { useEffect, useState } from 'react';

interface TimerProps {
  initialSeconds: number;
  onTimerEnd?: () => void; 
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimerEnd }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          if (onTimerEnd) onTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [onTimerEnd]);

  return (
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
      Pozostały czas: {seconds}s
    </div>
  );
};

export default Timer;
