'use client'

import { AlertTriangle, Archive, Trash2, CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BatchConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  action: 'archive' | 'delete' | 'markAsRead'
  count: number
}

const actionConfig = {
  archive: {
    title: 'Arquivar feedbacks',
    description: (count: number) => `Tem certeza que deseja arquivar ${count} feedback(s)? Eles poderão ser restaurados posteriormente.`,
    icon: Archive,
    confirmText: 'Arquivar',
    confirmClass: 'bg-gray-600 hover:bg-gray-700',
  },
  delete: {
    title: 'Deletar feedbacks',
    description: (count: number) => `Tem certeza que deseja deletar ${count} feedback(s)? Esta ação não pode ser desfeita.`,
    icon: Trash2,
    confirmText: 'Deletar',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
  markAsRead: {
    title: 'Marcar como lido',
    description: (count: number) => `Marcar ${count} feedback(s) como lido(s)?`,
    icon: CheckCircle2,
    confirmText: 'Marcar como lido',
    confirmClass: 'bg-indigo-600 hover:bg-indigo-700',
  },
}

export function BatchConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  count,
}: BatchConfirmDialogProps) {
  const config = actionConfig[action]
  const Icon = config.icon

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {config.description(count)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex justify-end gap-2 mt-6">
          <AlertDialogCancel onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={config.confirmClass}
          >
            <Icon className="w-4 h-4 mr-2" />
            {config.confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
