import React from 'react'
import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
}

export default function SkeletonLoader({ className = '', lines = 1 }: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-4" />
      ))}
    </div>
  )
}

