'use client';

import { MessageSquare, Bug, Star, Calendar, Mail, ExternalLink } from 'lucide-react';
import { Feedback } from '@/types';
import { statusConfig } from './StatusDropdown';

interface FeedbackCardProps {
  feedback: Feedback;
  onClick?: () => void;
}

const typeConfig = {
  nps: {
    icon: Star,
    label: 'NPS',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.1)',
  },
  suggestion: {
    icon: MessageSquare,
    label: 'Sugestão',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
  },
  bug: {
    icon: Bug,
    label: 'Bug',
    color: '#ff4444',
    bgColor: 'rgba(255, 68, 68, 0.1)',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

function getNpsColor(score: number): string {
  if (score >= 9) return '#00ff88';
  if (score >= 7) return '#ffd700';
  return '#ff4444';
}

export function FeedbackCard({ feedback, onClick }: FeedbackCardProps) {
  const type = typeConfig[feedback.type];
  const TypeIcon = type.icon;
  const status = statusConfig[feedback.status] || {
    label: feedback.status,
    color: '#888888',
    bgColor: 'rgba(136, 136, 136, 0.15)',
  };

  const contentPreview = feedback.content.length > 150 
    ? feedback.content.slice(0, 150) + '...'
    : feedback.content;

  return (
    <div
      onClick={onClick}
      className="p-5 transition-all cursor-pointer"
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.backgroundColor = '#111111';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222222';
        e.currentTarget.style.backgroundColor = '#0a0a0a';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Type Icon */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: type.bgColor,
              color: type.color,
              border: `1px solid ${type.color}`,
            }}
          >
            <TypeIcon size={16} />
            {type.label}
          </div>

          {/* Status Badge */}
          <div
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: status.bgColor,
              color: status.color,
              border: `1px solid ${status.color}`,
            }}
          >
            {status.label}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#666666' }}>
          <Calendar size={14} />
          {formatDate(feedback.created_at)}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {feedback.title && (
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#ffffff' }}>
            {feedback.title}
          </h3>
        )}
        <p style={{ color: '#aaaaaa', lineHeight: 1.6 }}>
          {contentPreview}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-4">
          {/* User Email */}
          {feedback.user_email && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#888888' }}>
              <Mail size={14} />
              <span className="truncate max-w-[200px]">{feedback.user_email}</span>
            </div>
          )}

          {/* Page URL */}
          {feedback.page_url && (
            <a
              href={feedback.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm hover:underline"
              style={{ color: '#00ff88' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              Ver página
            </a>
          )}
        </div>

        {/* NPS Score */}
        {feedback.nps_score !== null && (
          <div
            className="flex items-center gap-2 px-4 py-2 font-bold text-lg"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: getNpsColor(feedback.nps_score),
              border: `2px solid ${getNpsColor(feedback.nps_score)}`,
            }}
          >
            NPS: {feedback.nps_score}/10
          </div>
        )}
      </div>
    </div>
  );
}
