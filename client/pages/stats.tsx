import React from 'react';
import StatsChart from '../components/StatsChart';

const StatsPage: React.FC = () => {
  // Przykładowe dane – w realnym scenariuszu pobierzesz z backendu (NestJS)
  const labels = ['Lekcja 1', 'Lekcja 2', 'Lekcja 3', 'Lekcja 4'];
  const data = [42, 48, 51, 60];

  return (
    <div style={{ width: '80%', margin: '0 auto', marginTop: '2rem' }}>
      <h1>Statystyki WPM</h1>
      <p>Przegląd historycznych wyników (słów na minutę):</p>
      <StatsChart labels={labels} data={data} />
    </div>
  );
};

export default StatsPage;
