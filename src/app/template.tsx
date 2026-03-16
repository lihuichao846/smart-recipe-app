'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ 
        ease: "easeOut",
        duration: 0.4 
      }}
      className="min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
}
