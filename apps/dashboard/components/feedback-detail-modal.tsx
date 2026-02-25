'use client'

import { useEffect } from 'react'
import { X, Mail, User, Monitor, Clock, Globe, Smartphone, MailOpen, Archive, RotateCcw, CheckCircle2, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FeedbackItem, FeedbackStatus } from '@/types/dashboard-feedback'

interface FeedbackDetailModalProps {
  feedback: FeedbackItem | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (status: FeedbackStatus) => void
  onMarkAsRead?: (id: string) => void
}

const statusConfig: Record<FeedbackStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Novo', variant: 'default' },
  read: { label: 'Lido', variant: 'secondary' },
  analyzing: { label: 'Em análise', variant: 'warning' },
  implemented: { label: 'Implementado', variant: 'success' },
  archived: { label: 'Arquivado', variant: 'secondary' },
}

const typeLabels = {
  nps: 'NPS',
  suggestion: 'Sugestão',
  bug: 'Bug',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function parseUserAgent(userAgent?: string): { browser?: string; os?: string; device?: string } {
  if (!userAgent) return {}
  
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
    userAgent.includes('Firefox') ? 'Firefox' :
    userAgent.includes('Safari') ? 'Safari' :
    userAgent.includes('Edge') ? 'Edge' : 'Navegador'

  const os = userAgent.includes('Windows') ? 'Windows' :
    userAgent.includes('Mac') ? 'macOS' :
    userAgent.includes('Linux') ? 'Linux' :
    userAgent.includes('Android') ? 'Android' :
    userAgent.includes('iOS') ? 'iOS' : 'Sistema Operacional'

  const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'

  return { browser, os, device }
}

export function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
  onStatusChange,
  onMarkAsRead,
}: FeedbackDetailModalProps) {
  // Auto mark as read when opening details
  useEffect(() => {
    if (isOpen && feedback && feedback.status === 'new' && onMarkAsRead) {
      onMarkAsRead(feedback.id)
    }
  }, [isOpen, feedback, onMarkAsRead])

  if (!isOpen || !feedback) return null

  const ua = parseUserAgent(feedback.technical_context?.userAgent)
  const isArchived = feedback.status === 'archived'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Badge variant={statusConfig[feedback.status].variant}>
              {statusConfig[feedback.status].label}
            </Badge>
            <span className="text-sm text-gray-500">{typeLabels[feedback.type]}</span>
            {feedback.status === 'new' && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Novo" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Informações do Usuário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium text-gray-900">{feedback.user_name || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{feedback.user_email || 'Anônimo'}</p>
                  </div>
                </div>
              </div>
              
              {feedback.anonymous_id && (
                <p className="text-xs text-gray-500 mt-2">
                  ID Anônimo: {feedback.anonymous_id}
                </p>
              )}
            </div>

            {/* Feedback Content */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Conteúdo do Feedback</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {feedback.type === 'nps' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nota NPS</p>
                      <p className="text-3xl font-bold text-gray-900">{feedback.content.score}/10</p>
                    </div>
                    {feedback.content.comment && (
                      <div>
                        <p className="text-sm text-gray-500">Comentário</p>
                        <p className="text-gray-900 mt-1">{feedback.content.comment}</p>
                      </div>
                    )}
                  </div>
                )}

                {feedback.type === 'suggestion' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Título</p>
                      <p className="font-medium text-gray-900">{feedback.content.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Descrição</p>
                      <p className="text-gray-900 mt-1">{feedback.content.description}</p>
                    </div>
                    
                    {feedback.content.category && (
                      <div>
                        <p className="text-sm text-gray-500">Categoria</p>
                        <Badge variant="outline">{feedback.content.category}</Badge>
                      </div>
                    )}
                  </div>
                )}

                {feedback.type === 'bug' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Descrição</p>
                      <p className="text-gray-900 mt-1">{feedback.content.description}</p>
                    </div>
                    
                    {feedback.priority && (
                      <div>
                        <p className="text-sm text-gray-500">Prioridade</p>
                        <Badge variant={
                          feedback.priority === 'high' ? 'destructive' :
                          feedback.priority === 'medium' ? 'warning' : 'secondary'
                        }>
                          {feedback.priority === 'high' ? 'Alta' :
                           feedback.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Technical Context */}
            {feedback.technical_context && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Contexto Técnico</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-500">URL</p>
                        <p className="font-medium text-gray-900 text-sm truncate" title={feedback.technical_context.url}>
                          {feedback.technical_context.url || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dispositivo</p>
                        <p className="font-medium text-gray-900">{ua.device || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Navegador</p>
                        <p className="font-medium text-gray-900">{ua.browser || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Enviado em</p>
                        <p className="font-medium text-gray-900">{formatDate(feedback.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {feedback.technical_context.viewport && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Viewport</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {feedback.technical_context.viewport.width} x {feedback.technical_context.viewport.height}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            ID: {feedback.id}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {!isArchived && feedback.status !== 'read' && (
              <button
                onClick={() => onStatusChange('read')}
                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <MailOpen className="w-4 h-4" />
                Marcar como lido
              </button>
            )}
            
            {!isArchived && feedback.status !== 'analyzing' && (
              <button
                onClick={() => onStatusChange('analyzing')}
                className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Em análise
              </button>
            )}
            
            {!isArchived && feedback.status !== 'implemented' && (
              <button
                onClick={() => onStatusChange('implemented')}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Implementado
              </button>
            )}
            
            {!isArchived ? (
              <button
                onClick={() => onStatusChange('archived')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Arquivar
              </button>
            ) : (
              <>
                <button
                  onClick={() => onStatusChange('new')}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
