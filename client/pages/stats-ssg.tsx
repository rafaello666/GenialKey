// pages/stats-ssg.tsx
import React from 'react';
import { GetStaticProps } from 'next';
import axios from 'axios';

interface StatsData {
  userId: number;
  wpm: number;
  accuracy: number;
  date: string;
}

interface StatsSSGPageProps {
  stats: StatsData[];
}

const StatsSSGPage: React.FC<StatsSSGPageProps> = ({ stats }) => {
  return (
    <div style={{ margin: '2rem' }}>
      <h1>Statystyki (SSG)</h1>
      <p>Dane pobrane podczas builda (Static Site Generation).</p>
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

export default StatsSSGPage;

export const getStaticProps: GetStaticProps = async () => {
  try {
    const response = await axios.get<StatsData[]>(
      'https://szczepanekkinga.org/api/stats'
    );

    return {
      props: {
        stats: response.data,
      },

      
    };
  } catch (error) {
    console.error('Błąd SSG:', error);
    return {
      props: {
        stats: [],
      },
     
    };
  }
};
