// np. ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 - 100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  );
};
