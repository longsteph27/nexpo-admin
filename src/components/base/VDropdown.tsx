import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button-base'
import { Icon } from '@iconify/react'

interface DropdownProps {
  buttonLabel?: string
  variant?: 'default' | 'primary' | 'outline' | 'danger'
  menuItems?: Array<{
    label: string
    action: () => void
  }>
}

export const Dropdown: React.FC<DropdownProps> = ({
  buttonLabel = 'Actions',
  variant = 'primary',
  menuItems = [{ label: 'Action', action: () => {} }],
}) => {
  const variantMap = {
    primary: 'default',
    default: 'default',
    outline: 'outline',
    danger: 'destructive',
  } as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variantMap[variant]}>
          <span>{buttonLabel}</span>
          <Icon
            icon='heroicons:chevron-down'
            className='ml-2 h-5 w-5'
            aria-hidden='true'
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {menuItems.map((item, itemIdx) => (
          <DropdownMenuItem
            key={itemIdx}
            onClick={item.action}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

