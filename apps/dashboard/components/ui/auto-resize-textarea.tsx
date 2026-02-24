'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface AutoResizeTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  maxLength?: number
  error?: string
  label?: string
  required?: boolean
}

export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxRows = 10,
  maxLength,
  error,
  label,
  required,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(minRows)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate rows based on scrollHeight
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
    const padding = parseInt(getComputedStyle(textarea).paddingTop) + parseInt(getComputedStyle(textarea).paddingBottom)
    const contentHeight = textarea.scrollHeight - padding
    const newRows = Math.max(minRows, Math.min(maxRows, Math.ceil(contentHeight / lineHeight)))
    
    setRows(newRows)
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value, minRows, maxRows])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }
    
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 border rounded-md resize-none transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'text-sm leading-relaxed',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 hover:border-gray-400'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'textarea-error' : undefined}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {error && (
        <p id="textarea-error" className="text-sm text-red-500" role="alert">{error}</p>
      )}
    </div>
  )
}
