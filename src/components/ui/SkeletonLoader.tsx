import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
}

export default function SkeletonLoader({ className = '', lines = 1 }: SkeletonLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 rounded"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  )
}
