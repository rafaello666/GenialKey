// pages/three-r3f.tsx
import React from 'react';
import dynamic from 'next/dynamic';

const MyR3FScene = dynamic(() => import('../components/MyR3FScene'), {
  ssr: false,
});

const ThreeR3FPage: React.FC = () => {
  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React-Three-Fiber w Next.js</h1>
      <MyR3FScene />
    </div>
  );
};

export default ThreeR3FPage;
