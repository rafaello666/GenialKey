// pages/lessons/timer.tsx
import React from 'react';
import AnimatedNumber from '../../components/AnimatedNumber';
import { useTimer } from '../../hooks/useTimer';

const TimerPage: React.FC = () => {
  const { seconds, start } = useTimer(60);

  return (
    <div>
      <button onClick={start}>Start Timer</button>
      <AnimatedNumber value={seconds} />
    </div>
  );
};

export default TimerPage;
