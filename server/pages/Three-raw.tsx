// pages/three-raw.tsx
import React from 'react';
import dynamic from 'next/dynamic';

// Importujemy komponent z wyłączonym SSR
const ThreeScene = dynamic(() => import('../components/ThreeScene'), {
  ssr: false,
});

const ThreeRawPage: React.FC = () => {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Three.js „raw” w Next.js</h1>
      <ThreeScene />
    </div>
  );
};

export default ThreeRawPage;
