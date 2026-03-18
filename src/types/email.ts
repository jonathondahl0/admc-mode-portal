export interface SmtpConfig {
  host: string
  port: number
  username: string
  password: string
  secure: boolean // true = SSL/TLS (port 465), false = STARTTLS (port 587)
  fromName: string
  fromEmail: string
}

export interface EmailDraft {
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  isHtml: boolean
}

export interface SentEmail {
  id: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHtml: boolean
  sentAt: Date
  messageId?: string
}

export type ConnectionStatus = 'disconnected' | 'connected' | 'sending' | 'error'
