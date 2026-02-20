'use client';

import { useState, useCallback } from 'react';
import { Feedback } from '@/types';
import { Save, X, FileText } from 'lucide-react';

interface FeedbackDetailProps {
  feedback: Feedback;
  onClose: () => void;
  onUpdate?: (updatedFeedback: Feedback) => void;
}

export function FeedbackDetail({ feedback, onClose, onUpdate }: FeedbackDetailProps) {
  const [internalNotes, setInternalNotes] = useState(feedback.internal_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveNotes = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internal_notes: internalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notes');
      }

      const { data } = await response.json();
      setSaveStatus('success');
      onUpdate?.(data);

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }, [feedback.id, internalNotes, onUpdate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#00d4ff';
      case 'in_progress':
        return '#ffaa00';
      case 'resolved':
        return '#00ff88';
      default:
        return '#888888';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return '#ff4444';
      case 'suggestion':
        return '#00d4ff';
      case 'nps':
        return '#00ff88';
      default:
        return '#888888';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #222222',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: '#222222' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-1 text-xs font-mono uppercase"
              style={{
                backgroundColor: `${getTypeColor(feedback.type)}20`,
                color: getTypeColor(feedback.type),
                border: `1px solid ${getTypeColor(feedback.type)}`,
              }}
            >
              {feedback.type}
            </span>
            <span
              className="px-2 py-1 text-xs font-mono uppercase"
              style={{
                backgroundColor: `${getStatusColor(feedback.status)}20`,
                color: getStatusColor(feedback.status),
                border: `1px solid ${getStatusColor(feedback.status)}`,
              }}
            >
              {feedback.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors hover:bg-white/5"
            style={{ color: '#888888' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Title */}
          {feedback.title && (
            <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
              {feedback.title}
            </h2>
          )}

          {/* Main Content */}
          <div className="space-y-2">
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Feedback Content
            </p>
            <div
              className="p-4 text-sm"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {feedback.content}
            </div>
          </div>

          {/* NPS Score */}
          {feedback.nps_score !== null && (
            <div className="space-y-2">
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                NPS Score
              </p>
              <div
                className="inline-flex items-center justify-center w-12 h-12 text-xl font-bold"
                style={{
                  backgroundColor: feedback.nps_score >= 7 ? '#00ff8820' : '#ff444420',
                  border: `1px solid ${feedback.nps_score >= 7 ? '#00ff88' : '#ff4444'}`,
                  color: feedback.nps_score >= 7 ? '#00ff88' : '#ff4444',
                }}
              >
                {feedback.nps_score}
              </div>
            </div>
          )}

          {/* Internal Notes Section */}
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#222222' }}>
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: '#00ff88' }} />
              <h3 style={{ color: '#ffffff', fontWeight: 500 }}>
                Internal Notes
              </h3>
              <span
                className="px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: '#00ff8820',
                  color: '#00ff88',
                  border: '1px solid #00ff88',
                }}
              >
                PRIVATE
              </span>
            </div>

            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add private notes about this feedback..."
              className="w-full p-3 text-sm resize-none focus:outline-none transition-colors"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
                minHeight: '120px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#222222';
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span style={{ color: '#00ff88', fontSize: '0.875rem' }}>
                    Saved successfully!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span style={{ color: '#ff4444', fontSize: '0.875rem' }}>
                    Error: {errorMessage}
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSaving ? '#00ff8840' : '#00ff88',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#00ffaa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#00ff88';
                  }
                }}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div 
            className="pt-4 border-t text-xs space-y-1"
            style={{ borderColor: '#222222', color: '#888888' }}
          >
            <p>ID: {feedback.id}</p>
            <p>Created: {new Date(feedback.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(feedback.updated_at).toLocaleString()}</p>
            {feedback.user_email && <p>From: {feedback.user_email}</p>}
            {feedback.page_url && <p>Page: {feedback.page_url}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
