import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StatsChartProps {
  labels: string[]; // np. ["Lekcja 1", "Lekcja 2", "Lekcja 3", ...]
  data: number[];   // np. [40, 45, 50, 55]
}

const StatsChart: React.FC<StatsChartProps> = ({ labels, data }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'WPM (Słowa na minutę)',
        data,
        backgroundColor: '#2a71d0',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historia prędkości pisania',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default StatsChart;
