'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface AddSectionButtonProps {
  isVisible: boolean;
  position: 'top' | 'bottom';
  onClick: (e: React.MouseEvent) => void;
}

export default function AddSectionButton({ 
  isVisible, 
  position, 
  onClick 
}: AddSectionButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClick}
          className="cursor-pointer"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

