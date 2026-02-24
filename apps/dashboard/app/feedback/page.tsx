'use client'

import { useSearchParams } from 'next/navigation'
import { FeedbackForm } from '../../components/feedback-form'
import { Suspense } from 'react'

function FeedbackPageContent() {
  const searchParams = useSearchParams()
  const apiKey = searchParams.get('key') || process.env.NEXT_PUBLIC_DEMO_API_KEY || ''
  const type = searchParams.get('type') as 'nps' | 'suggestion' | 'bug' | undefined

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h1 className="text-xl font-semibold text-white">
            Envie seu Feedback
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Sua opinião é muito importante para nós
          </p>
        </div>

        <FeedbackForm 
          apiKey={apiKey}
          type={type}
          className="p-6"
          onSuccess={() => {
            console.log('Feedback enviado com sucesso!')
          }}
          onError={(error) => {
            console.error('Erro ao enviar feedback:', error)
          }}
        />
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <FeedbackPageContent />
    </Suspense>
  )
}
