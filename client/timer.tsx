// pages/lessons/timer.tsx
import React from 'react';
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import AnimatedNumber from '../../components/AnimatedNumber';
import { useTimer } from '../../hooks/useTimer';
=======
import AnimatedNumber from './AnimatedNumber';
import { useTimer } from '../server/my-typing-app/apps/client/hooks/useTimer';
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
=======
import AnimatedNumber from './AnimatedNumber';
import { useTimer } from '../server/my-typing-app/apps/client/hooks/useTimer';
>>>>>>> 5185817 (feat: add new components and pages for timer, three.js integration, and welcome screen)
=======
import AnimatedNumber from './AnimatedNumber';
import { useTimer } from '../server/my-typing-app/apps/client/hooks/useTimer';
>>>>>>> 51858176c37d86a5a1b3637f910f85a822ad44a9

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
