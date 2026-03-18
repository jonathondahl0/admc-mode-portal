import { format } from 'date-fns'
import { ArrowLeft, CheckCircle2, Code2, FileText } from 'lucide-react'
import { SentEmail } from '../types/email'
import { useState } from 'react'

interface Props {
  email: SentEmail
  onBack: () => void
}

export default function EmailDetail({ email, onBack }: Props) {
  const [showSource, setShowSource] = useState(false)

  const plainBody = email.isHtml
    ? email.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : email.body

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0 z-10">
        <button
          onClick={onBack}
          className="md:hidden flex items-center justify-center p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium hidden sm:inline-block">Sent Successfully</span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium sm:hidden">Sent</span>
          {email.isHtml && (
            <button
              onClick={() => setShowSource(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                showSource
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              {showSource ? <FileText size={12} /> : <Code2 size={12} />}
              {showSource ? 'Preview' : 'Source'}
            </button>
          )}
        </div>
      </div>

      {/* Email meta */}
      <div className="px-6 py-4 border-b border-border space-y-1.5 shrink-0 bg-secondary/20">
        <h2 className="text-lg font-bold text-foreground">
          {email.subject || '(No subject)'}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><span className="font-medium text-foreground/70">From:</span> {email.from}</span>
          <span><span className="font-medium text-foreground/70">To:</span> {email.to.join(', ')}</span>
          {email.cc && email.cc.length > 0 && (
            <span><span className="font-medium text-foreground/70">Cc:</span> {email.cc.join(', ')}</span>
          )}
          {email.bcc && email.bcc.length > 0 && (
            <span><span className="font-medium text-foreground/70">Bcc:</span> {email.bcc.join(', ')}</span>
          )}
          <span><span className="font-medium text-foreground/70">Sent:</span> {format(email.sentAt, 'PPpp')}</span>
        </div>
        {email.messageId && (
          <p className="text-xs text-muted-foreground/60 font-mono truncate">ID: {email.messageId}</p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {email.isHtml && !showSource ? (
          <iframe
            srcDoc={email.body}
            title="Email preview"
            className="w-full h-full min-h-[400px] border-0 bg-white rounded-lg"
            sandbox="allow-same-origin"
          />
        ) : (
          <pre className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground ${
            showSource ? 'font-mono text-xs' : ''
          }`}>
            {showSource ? email.body : plainBody}
          </pre>
        )}
      </div>
    </div>
  )
}
