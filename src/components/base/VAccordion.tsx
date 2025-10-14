'use client'

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Props {
  title: string
  children?: React.ReactNode
  defaultOpen?: boolean
}

export function VAccordion({ title, children, defaultOpen = false }: Props) {
  return (
    <Accordion 
      type="single" 
      collapsible 
      className="mb-4"
      defaultValue={defaultOpen ? 'item-1' : undefined}
    >
      <AccordionItem 
        value="item-1"
        className="rounded-2xl border border-gray-200 bg-white/80 shadow transition duration-200 px-6"
      >
        <AccordionTrigger className="font-font-display text-lg text-primary font-semibold hover:no-underline">
          {title}
        </AccordionTrigger>
        <AccordionContent className="prose text-left font-font-body text-gray pt-2">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

