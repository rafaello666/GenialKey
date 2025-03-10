// pages/lessons/timer.tsx
import React from 'react';
<<<<<<< HEAD
import AnimatedNumber from '../../components/AnimatedNumber';
import { useTimer } from '../../hooks/useTimer';
=======
import AnimatedNumber from './AnimatedNumber';
import { useTimer } from '../server/my-typing-app/apps/client/hooks/useTimer';
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)

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
