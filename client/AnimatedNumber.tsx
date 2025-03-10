import { motion } from 'framer-motion';
import React from 'react';

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {value}
    </motion.div>
  );
};

export default AnimatedNumber;
