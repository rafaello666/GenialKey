import React from 'react';
import { useRouter } from 'next/router';
import Timer from '../../components/Timer';

const LessonsPage: React.FC = () => {
  const router = useRouter();

  const handleTimerEnd = () => {
    
    router.push('/summary');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Lekcja 1</h1>
      <p>Rozpocznij ćwiczenie pisania. Masz 60 sekund.</p>

      <Timer initialSeconds={60} onTimerEnd={handleTimerEnd} />
          </div>
  );
};

export default LessonsPage;
