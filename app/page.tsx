'use client';

import { useState } from 'react';
import { FeedbackDetail } from '@/components/feedback';
import { Feedback } from '@/types';

// Demo feedback data
const demoFeedback: Feedback = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  project_id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'suggestion',
  nps_score: null,
  title: 'Add dark mode to the widget',
  content: 'It would be great if the feedback widget had a dark mode option. Many users prefer dark interfaces, especially at night.',
  screenshot_url: null,
  user_email: 'user@example.com',
  user_id: 'user_123',
  page_url: 'https://example.com/dashboard',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  status: 'new',
  internal_notes: '',
  response_sent: false,
  response_content: null,
  created_at: '2025-02-20T20:00:00Z',
  updated_at: '2025-02-20T20:00:00Z',
};

export default function DemoPage() {
  const [showDetail, setShowDetail] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(demoFeedback);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 
            className="text-3xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            TinyFeedback - ST-15 Demo
          </h1>
          <p style={{ color: '#888888' }}>
            Internal Notes Feature Implementation
          </p>
        </div>

        <div 
          className="p-6 space-y-4"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
            Demo Feedback Card
          </h2>
          
          <div className="space-y-2">
            <p style={{ color: '#ffffff' }}>
              <strong style={{ color: '#888888' }}>Title:</strong> {feedback.title}
            </p>
            <p style={{ color: '#ffffff' }}>
              <strong style={{ color: '#888888' }}>Type:</strong> {feedback.type}
            </p>
            <p style={{ color: '#ffffff' }}>
              <strong style={{ color: '#888888' }}>Status:</strong> {feedback.status}
            </p>
            <p style={{ color: '#ffffff' }}>
              <strong style={{ color: '#888888' }}>Internal Notes:</strong>{' '}
              {feedback.internal_notes 
                ? `${feedback.internal_notes.substring(0, 50)}...` 
                : 'No notes yet'}
            </p>
          </div>

          <button
            onClick={() => setShowDetail(true)}
            className="px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: '#00ff88',
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00ffaa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00ff88';
            }}
          >
            Open Feedback Detail
          </button>
        </div>

        <div 
          className="p-4 text-sm"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222',
            color: '#888888'
          }}
        >
          <h3 className="mb-2" style={{ color: '#ffffff' }}>Implementation Status:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>✅ Database migration (internal_notes field)</li>
            <li>✅ TypeScript types updated</li>
            <li>✅ API endpoint (PATCH /api/feedbacks/[id])</li>
            <li>✅ FeedbackDetail component with textarea</li>
            <li>✅ Cyber-neon styling (sharp corners, neon green)</li>
            <li>✅ Save functionality with status feedback</li>
          </ul>
        </div>
      </div>

      {showDetail && (
        <FeedbackDetail
          feedback={feedback}
          onClose={() => setShowDetail(false)}
          onUpdate={(updated) => setFeedback(updated)}
        />
      )}
    </div>
  );
}
