'use client'

import React from 'react'
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Icon } from '@iconify/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

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
        className="rounded-2xl border border-gray-200 bg-white/80 shadow transition duration-200 px-6 data-[state=open]:border-[var(--color-primary)]"
      >
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger
            className={cn(
              "group flex flex-1 items-center justify-between py-6 text-lg font-semibold transition-all hover:no-underline text-left",
              "text-[var(--color-primary)]"
            )}
          >
            {title}
            <div className="shrink-0 text-[var(--color-primary)]">
              <Icon
                icon="lucide:plus"
                className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:hidden block"
              />
              <Icon
                icon="lucide:minus"
                className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:block hidden"
              />
            </div>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        <AccordionContent className="prose text-left font-[var(--font-body)] text-[var(--color-content-secondary)] pt-2 pb-6">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
