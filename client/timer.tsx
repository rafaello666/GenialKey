// pages/lessons/timer.tsx
import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { useTimer } from '../server/my-typing-app/apps/client/hooks/useTimer';

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
