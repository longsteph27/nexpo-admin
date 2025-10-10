import React from 'react'

interface LabelProps {
  label: string
  name: string
}

export const VLabel: React.FC<LabelProps> = ({ label, name }) => {
  return (
    <label
      htmlFor={name}
      className='mb-1 block text-sm font-medium text-content-primary dark:text-gray-200'
    >
      {label}
    </label>
  )
}
