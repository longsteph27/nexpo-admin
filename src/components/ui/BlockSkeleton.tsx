import React from 'react'
import { motion } from 'framer-motion'
import SkeletonLoader from './SkeletonLoader'

interface BlockSkeletonProps {
  type?: 'hero' | 'columns' | 'gallery' | 'steps'
}

export default function BlockSkeleton({ type = 'hero' }: BlockSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="grid gap-6 md:grid-cols-3 p-8">
            <div className="md:col-span-2 space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="md:col-span-1">
              <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        )
      
      case 'columns':
        return (
          <div className="grid gap-6 md:grid-cols-3 p-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <SkeletonLoader lines={3} />
              </div>
            ))}
          </div>
        )
      
      case 'gallery':
        return (
          <div className="grid gap-4 md:grid-cols-3 p-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )
      
      case 'steps':
        return (
          <div className="space-y-8 p-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <SkeletonLoader lines={2} />
                </div>
              </div>
            ))}
          </div>
        )
      
      default:
        return (
          <div className="p-8">
            <SkeletonLoader lines={4} />
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200"
    >
      {renderSkeleton()}
    </motion.div>
  )
}
