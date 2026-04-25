import { cn } from '@/lib/utils'

export interface ChatMessageData {
  id: string
  order_id: string
  sender_id: string | null
  message: string
  type: 'text' | 'system' | 'auto_delivery' | 'image' | string
  is_filtered: boolean
  created_at: string
}

interface ChatMessageProps {
  message: ChatMessageData
  /** id do usuário logado, para alinhar bolha à direita */
  currentUserId: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  // Mensagem do sistema → centralizada
  if (message.type === 'system' || message.sender_id === null) {
    return (
      <div className="my-3 flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.message}
        </span>
      </div>
    )
  }

  // Auto-delivery → caixa especial
  if (message.type === 'auto_delivery') {
    return (
      <div className="my-3 flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <div className="mb-1 font-semibold text-emerald-700 dark:text-emerald-400">
            🔐 Entrega automática
          </div>
          <div className="whitespace-pre-wrap break-words font-mono text-xs">
            {message.message}
          </div>
          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    )
  }

  const isMine = message.sender_id === currentUserId

  return (
    <div className={cn('my-1 flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          isMine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
          message.is_filtered && 'border border-amber-500/50',
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.message}</div>
        <div
          className={cn(
            'mt-1 text-[10px] opacity-70',
            isMine ? 'text-right' : 'text-left',
          )}
        >
          {message.is_filtered && '⚠ filtrada · '}
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  )
}
