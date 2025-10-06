'use client'

import React, { useState } from 'react'
import VIcon from '@/components/base/VIcon'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  title: string
  children?: React.ReactNode
}

const MotionDiv = motion.div

export function VAccordion({ title, children }: Props) {
  const [open, setOpen] = useState(false)

  const handleToggle = () => {
    setOpen(!open)
  }

  return (
    <div className="mb-4">
      <div
        className={`rounded-2xl border border-gray-200 bg-white/80 shadow transition duration-200`}
      >
        <div className="relative px-6 py-4">
          <dt>
            <button
              className="flex w-full items-center justify-between text-left font-[var(--font-display)] text-lg text-[var(--color-primary)] font-semibold focus:outline-none"
              onClick={handleToggle}
            >
              <span>{title}</span>
              <span className="flex items-center">
                <VIcon
                  icon={open ? 'heroicons:minus' : 'heroicons:plus'}
                  className="h-7 w-7 rounded-full text-[var(--color-primary)] bg-[var(--color-primary)]/10 transition"
                />
              </span>
            </button>
          </dt>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                style={{ overflow: 'hidden' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="prose text-left font-[var(--font-body)] text-[var(--color-gray)] mt-2">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
