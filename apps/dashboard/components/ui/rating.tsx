'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  error?: string
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  error,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação">
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            className={cn(
              'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm',
              'hover:scale-110 active:scale-95'
            )}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                (hoverValue ? star <= hoverValue : star <= value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      )}
    </div>
  )
}

interface NPSRatingProps {
  value: number
  onChange: (value: number) => void
  error?: string
}

export function NPSRating({ value, onChange, error }: NPSRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const getLabel = (score: number): string => {
    if (score <= 6) return 'Detrator'
    if (score <= 8) return 'Neutro'
    return 'Promotor'
  }

  const getColorClass = (score: number): string => {
    if (score <= 6) return 'bg-red-500 hover:bg-red-600'
    if (score <= 8) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-green-500 hover:bg-green-600'
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2" role="radiogroup" aria-label="NPS Score">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} - ${getLabel(score)}`}
            className={cn(
              'w-8 h-10 sm:w-10 sm:h-12 rounded-md font-semibold text-white text-sm sm:text-base',
              'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
              'hover:scale-105 active:scale-95',
              value === score
                ? getColorClass(score)
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
              hoverValue === score && value !== score && 'ring-2 ring-offset-1 ring-gray-400'
            )}
            onMouseEnter={() => setHoverValue(score)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>Não recomendaria</span>
        <span>Recomendaria muito</span>
      </div>
      {value >= 0 && (
        <p className={cn(
          'text-center text-sm font-medium',
          value <= 6 ? 'text-red-500' : value <= 8 ? 'text-yellow-600' : 'text-green-600'
        )}>
          {getLabel(value)}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">{error}</p>
      )}
    </div>
  )
}
