import React from 'react';
import { useRouter } from 'next/router';
import AnimatedTimer from '../../components/AnimatedTimer';

const AnimatedTimerPage: React.FC = () => {
  const router = useRouter();

  // Funkcja, która zostanie wywołana po osiągnięciu 0s
  const handleTimerEnd = () => {
    alert('Czas minął! Przechodzimy do podsumowania...');
    router.push('/summary'); 
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Lekcja - z animowanym Timerem</h1>
      <p>Masz 20 sekund na wykonanie ćwiczenia!</p>

      <AnimatedTimer initialSeconds={20} onTimerEnd={handleTimerEnd} />
    </div>
  );
};

export default AnimatedTimerPage;
