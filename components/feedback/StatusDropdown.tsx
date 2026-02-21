'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type WorkflowStatus = 'new' | 'in_analysis' | 'implemented';

interface StatusOption {
  value: WorkflowStatus;
  label: string;
  color: string;
  bgColor: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'new',
    label: 'Novo',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.1)',
  },
  {
    value: 'in_analysis',
    label: 'Em Análise',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
  },
  {
    value: 'implemented',
    label: 'Implementado',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
  },
];

interface StatusDropdownProps {
  currentStatus: WorkflowStatus;
  onStatusChange: (status: WorkflowStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, onStatusChange, disabled = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (status: WorkflowStatus) => {
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
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.filter = 'brightness(1.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        <span>{currentOption.label}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 min-w-[160px]"
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
                backgroundColor: option.value === currentStatus ? option.bgColor : 'transparent',
                color: option.color,
              }}
              onMouseEnter={(e) => {
                if (option.value !== currentStatus) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== currentStatus) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{option.label}</span>
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

export function getStatusLabel(status: WorkflowStatus): string {
  const option = statusOptions.find(opt => opt.value === status);
  return option?.label || status;
}

export function getStatusColor(status: WorkflowStatus): string {
  const option = statusOptions.find(opt => opt.value === status);
  return option?.color || '#888888';
}

export function getStatusBgColor(status: WorkflowStatus): string {
  const option = statusOptions.find(opt => opt.value === status);
  return option?.bgColor || 'rgba(136, 136, 136, 0.1)';
}
