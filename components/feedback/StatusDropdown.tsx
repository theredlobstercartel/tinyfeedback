'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type FeedbackStatus = 'new' | 'in_analysis' | 'implemented';

interface StatusOption {
  value: FeedbackStatus;
  label: string;
  color: string;
  bgColor: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'new',
    label: 'Novo',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.15)',
  },
  {
    value: 'in_analysis',
    label: 'Em Análise',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.15)',
  },
  {
    value: 'implemented',
    label: 'Implementado',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.15)',
  },
];

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: FeedbackStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, onStatusChange, disabled = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];

  const handleSelect = (status: FeedbackStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: currentOption.bgColor,
          color: currentOption.color,
          border: `1px solid ${currentOption.color}`,
        }}
      >
        {currentOption.label}
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[140px] z-50"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #333333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left"
              style={{
                color: option.color,
                backgroundColor: option.value === currentStatus ? option.bgColor : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (option.value !== currentStatus) {
                  e.currentTarget.style.backgroundColor = option.bgColor;
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== currentStatus) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.label}
              {option.value === currentStatus && (
                <Check size={14} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: {
    label: 'Novo',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.15)',
  },
  in_analysis: {
    label: 'Em Análise',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.15)',
  },
  implemented: {
    label: 'Implementado',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.15)',
  },
  // Legacy statuses for backward compatibility
  read: {
    label: 'Lido',
    color: '#888888',
    bgColor: 'rgba(136, 136, 136, 0.15)',
  },
  responded: {
    label: 'Respondido',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.15)',
  },
  archived: {
    label: 'Arquivado',
    color: '#666666',
    bgColor: 'rgba(102, 102, 102, 0.15)',
  },
};
