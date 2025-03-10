// pages/stats-ssr.tsx
import React from 'react';
import { GetServerSideProps } from 'next';
import axios from 'axios';

interface StatsData {
  userId: number;
  wpm: number;
  accuracy: number;
  date: string;
}

interface StatsSSRPageProps {
  stats: StatsData[];
}

const StatsSSRPage: React.FC<StatsSSRPageProps> = ({ stats }) => {
  return (
    <div style={{ margin: '2rem' }}>
      <h1>Statystyki (SSR)</h1>
      <p>Dane renderowane po stronie serwera przy każdym żądaniu.</p>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>UserID</th>
            <th>WPM</th>
            <th>Accuracy</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((item, index) => (
            <tr key={index}>
              <td>{item.userId}</td>
              <td>{item.wpm}</td>
              <td>{item.accuracy}%</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatsSSRPage;
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    
    const response = await axios.get<StatsData[]>(
      'https://szczepanekkinga.org/api/stats'
    );

    return {
      props: {
        stats: response.data, // przekazujemy do komponentu
      },
    };
  } catch (error) {
    console.error('Błąd SSR:', error);

    // Możesz np. zwrócić pustą tablicę lub przekierować do strony błędu
    return {
      props: {
        stats: [],
      },
    };
  };
};
