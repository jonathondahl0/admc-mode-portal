import { useState, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp, Code2, Type, X, PenTool } from 'lucide-react'
import { EmailDraft, SmtpConfig } from '../types/email'
import toast from 'react-hot-toast'
import Editor from 'react-simple-wysiwyg'

interface Props {
  config: SmtpConfig
  functionUrl: string
  onSent: (draft: EmailDraft, messageId: string) => void
}

const EMPTY_DRAFT: EmailDraft = {
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  body: '',
  isHtml: false,
}

export default function ComposePane({ config, functionUrl, onSent }: Props) {
  const [draft, setDraft] = useState<EmailDraft>(EMPTY_DRAFT)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [sending, setSending] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!sending && draft.to && draft.subject) {
          const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
          handleSend(syntheticEvent)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [draft, sending])

  const set = (key: keyof EmailDraft, value: string | boolean) =>
    setDraft(d => ({ ...d, [key]: value }))

  const parseEmails = (str: string) =>
    str.split(',').map(s => s.trim()).filter(Boolean)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.to) return
    setSending(true)

    const fromAddress = config.fromEmail
      ? `${config.fromName} <${config.fromEmail}>`
      : config.username

    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            secure: config.secure,
          },
          from: fromAddress,
          to: parseEmails(draft.to),
          cc: parseEmails(draft.cc),
          bcc: parseEmails(draft.bcc),
          subject: draft.subject,
          body: draft.body,
          isHtml: draft.isHtml,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Email sent successfully!')
      onSent(draft, data.messageId)
      setDraft(EMPTY_DRAFT)
      setShowCcBcc(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email'
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  const handleClear = () => {
    setDraft(EMPTY_DRAFT)
    setShowCcBcc(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background shrink-0">
        <span className="text-sm font-semibold text-foreground">Compose</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex bg-secondary p-1 rounded-lg mr-2 border border-border">
            <button
              type="button"
              onClick={() => set('isHtml', false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all ${
                !draft.isHtml
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Type size={13} />
              Plain Text
            </button>
            <button
              type="button"
              onClick={() => set('isHtml', true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all ${
                draft.isHtml
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PenTool size={13} />
              Rich Text
            </button>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
            title="Clear draft (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
        {/* Fields */}
        <div className="border-b border-border">
          {/* From */}
          <div className="flex items-center px-4 py-2.5 border-b border-border/60">
            <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">From</span>
            <span className="text-sm text-foreground truncate">
              {config.fromName
                ? `${config.fromName} <${config.fromEmail || config.username}>`
                : config.username}
            </span>
          </div>

          {/* To */}
          <div className="flex items-center px-4 py-2.5 border-b border-border/60">
            <label className="text-xs font-medium text-muted-foreground w-10 shrink-0" htmlFor="to">To</label>
            <input
              id="to"
              type="text"
              value={draft.to}
              onChange={e => set('to', e.target.value)}
              placeholder="recipient@example.com, another@example.com"
              className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
            />
            <button
              type="button"
              onClick={() => setShowCcBcc(v => !v)}
              className="ml-2 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-1"
            >
              Cc/Bcc {showCcBcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* CC / BCC */}
          {showCcBcc && (
            <>
              <div className="flex items-center px-4 py-2.5 border-b border-border/60">
                <label className="text-xs font-medium text-muted-foreground w-10 shrink-0" htmlFor="cc">Cc</label>
                <input
                  id="cc"
                  type="text"
                  value={draft.cc}
                  onChange={e => set('cc', e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center px-4 py-2.5 border-b border-border/60">
                <label className="text-xs font-medium text-muted-foreground w-10 shrink-0" htmlFor="bcc">Bcc</label>
                <input
                  id="bcc"
                  type="text"
                  value={draft.bcc}
                  onChange={e => set('bcc', e.target.value)}
                  placeholder="bcc@example.com"
                  className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div className="flex items-center px-4 py-2.5">
            <label className="text-xs font-medium text-muted-foreground w-10 shrink-0" htmlFor="subject">Subj</label>
            <input
              id="subject"
              type="text"
              value={draft.subject}
              onChange={e => set('subject', e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm font-medium bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative group">
          {draft.isHtml ? (
            <div className="flex-1 overflow-y-auto w-full h-full email-editor-container bg-background">
              <Editor
                value={draft.body}
                onChange={e => set('body', e.target.value)}
                placeholder="Write your rich HTML email here…"
                containerProps={{ 
                  style: { 
                    height: '100%', 
                    border: 'none', 
                    borderRadius: 0, 
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  } 
                }}
              />
            </div>
          ) : (
            <textarea
              value={draft.body}
              onChange={e => set('body', e.target.value)}
              placeholder="Write your message here…"
              className="flex-1 p-4 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed transition-colors group-hover:bg-secondary/10"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {draft.body.length > 0 ? `${draft.body.length} chars` : 'No content'}
            </span>
            <span className="hidden sm:inline text-xs font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-muted-foreground">
              Cmd+Enter
            </span>
          </div>
          <button
            type="submit"
            disabled={sending || !draft.to || !draft.subject}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={14} />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
