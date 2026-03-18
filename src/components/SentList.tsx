import { formatDistanceToNow } from 'date-fns'
import { Mail, MailOpen } from 'lucide-react'
import { SentEmail } from '../types/email'

interface Props {
  emails: SentEmail[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function SentList({ emails, selectedId, onSelect }: Props) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Mail size={36} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No sent emails yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Emails you send will appear here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto w-full h-full">
      {emails.map((email, i) => (
        <button
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={`text-left px-4 py-3 border-b border-border/60 transition-all duration-200 hover:bg-secondary/60 animate-in slide-in-from-left-4 fade-in ${
            selectedId === email.id ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              {selectedId === email.id
                ? <MailOpen size={14} className="text-primary" />
                : <Mail size={14} className="text-muted-foreground" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-medium text-foreground truncate">
                  To: {email.to.join(', ')}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(email.sentAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {email.subject || '(No subject)'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {email.isHtml
                  ? email.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                  : email.body}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
