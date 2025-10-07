import React from 'react'

interface TransparentInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  autoFocus?: boolean
  multiline?: boolean
  rows?: number
}

export default function TransparentInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  style = {},
  autoFocus = false,
  multiline = false,
  rows = 1
}: TransparentInputProps) {
  const baseStyle: React.CSSProperties = {
    background: 'transparent',
    border: '2px dashed #93c5fd', // border-blue-300
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    ...style
  }

  const focusStyle: React.CSSProperties = {
    borderColor: '#3b82f6', // border-blue-500
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={rows}
        className={className}
        style={baseStyle}
        onFocus={(e) => {
          Object.assign(e.target.style, focusStyle)
        }}
        onBlur={(e) => {
          Object.assign(e.target.style, baseStyle)
        }}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      style={baseStyle}
      onFocus={(e) => {
        Object.assign(e.target.style, focusStyle)
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, baseStyle)
      }}
    />
  )
}
