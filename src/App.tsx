import { useState, useEffect } from 'react'
import { Mail, Send, Settings, Moon, Sun, PlugZap, AlertCircle, Menu, X } from 'lucide-react'
import SmtpSettings from './components/SmtpSettings'
import ComposePane from './components/ComposePane'
import SentList from './components/SentList'
import EmailDetail from './components/EmailDetail'
import { SmtpConfig, SentEmail, EmailDraft } from './types/email'

const FUNCTION_URL = 'https://w5jhd8tw--smtp-send.functions.blink.new'

type View = 'settings' | 'compose' | 'sent'

export default function App() {
  const [dark, setDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<View>('settings')
  
  // Load initial state from localStorage
  const [config, setConfig] = useState<SmtpConfig | null>(() => {
    try {
      const saved = localStorage.getItem('mailbox_config')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  
  const [sentEmails, setSentEmails] = useState<SentEmail[]>(() => {
    try {
      const saved = localStorage.getItem('mailbox_sent')
      if (!saved) return []
      const parsed = JSON.parse(saved)
      return parsed.map((e: any) => ({
        ...e,
        sentAt: new Date(e.sentAt)
      }))
    } catch {
      return []
    }
  })

  const [selectedSentId, setSelectedSentId] = useState<string | null>(null)

  // Persist to localStorage when changed
  useEffect(() => {
    if (config) {
      localStorage.setItem('mailbox_config', JSON.stringify(config))
    } else {
      localStorage.removeItem('mailbox_config')
    }
  }, [config])

  useEffect(() => {
    localStorage.setItem('mailbox_sent', JSON.stringify(sentEmails))
  }, [sentEmails])

  const handleConnect = (cfg: SmtpConfig) => {
    setConfig(cfg)
    setView('compose')
    setSidebarOpen(false)
  }

  const handleDisconnect = () => {
    setConfig(null)
    setView('settings')
    setSidebarOpen(false)
  }

  const handleSent = (draft: EmailDraft, messageId: string) => {
    const newEmail: SentEmail = {
      id: `sent_${Date.now()}`,
      from: config
        ? config.fromName
          ? `${config.fromName} <${config.fromEmail || config.username}>`
          : config.username
        : '',
      to: draft.to.split(',').map(s => s.trim()).filter(Boolean),
      cc: draft.cc ? draft.cc.split(',').map(s => s.trim()).filter(Boolean) : [],
      bcc: draft.bcc ? draft.bcc.split(',').map(s => s.trim()).filter(Boolean) : [],
      subject: draft.subject,
      body: draft.body,
      isHtml: draft.isHtml,
      sentAt: new Date(),
      messageId,
    }
    setSentEmails(prev => [newEmail, ...prev])
  }

  const selectedEmail = sentEmails.find(e => e.id === selectedSentId) ?? null

  const toggleDark = () => {
    setDark(d => {
      if (!d) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return !d
    })
  }

  const navItems: { id: View; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'compose',
      label: 'Compose',
      icon: <Send size={16} />,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: <Mail size={16} />,
      badge: (sentEmails || []).length || undefined,
    },
    {
      id: 'settings',
      label: 'SMTP Settings',
      icon: <Settings size={16} />,
    },
  ]

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background text-foreground overflow-hidden select-none">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-sidebar shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Mail size={15} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground">MailBox</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 md:w-56 h-[100dvh] md:h-screen flex flex-col 
        bg-sidebar border-r border-sidebar-border shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo (Desktop) */}
        <div className="hidden md:flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Mail size={15} className="text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-foreground">MailBox</span>
            <p className="text-xs text-muted-foreground leading-none">SMTP Client</p>
          </div>
        </div>

        {/* Connection status */}
        <div className="px-3 py-2 border-b border-sidebar-border shrink-0">
          {config ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">
                  {config.host}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-500/70 truncate">
                  {config.fromEmail || config.username}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary border border-border">
              <AlertCircle size={13} className="text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">Not connected</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id !== 'settings' && !config) {
                  setView('settings')
                  return
                }
                setView(item.id)
                setSidebarOpen(false)
                if (item.id !== 'sent') setSelectedSentId(null)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                view === item.id
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              } ${item.id !== 'settings' && !config ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  view === item.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary/15 text-primary'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border flex items-center justify-between shrink-0">
          {config ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <PlugZap size={13} />
              Disconnect
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">No account</span>
          )}
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'settings' && (
          <div className="w-full max-w-sm mx-auto flex flex-col overflow-hidden border-r border-border">
            <SmtpSettings
              config={config}
              onSave={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={!!config}
            />
          </div>
        )}

        {view === 'compose' && config && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ComposePane
              config={config}
              functionUrl={FUNCTION_URL}
              onSent={handleSent}
            />
          </div>
        )}

        {view === 'sent' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Email list */}
            <div className={`
              ${selectedEmail ? 'hidden md:flex' : 'flex'} 
              w-full md:w-80 border-r border-border flex-col overflow-hidden shrink-0
              bg-background
            `}>
              <div className="h-12 flex items-center px-4 border-b border-border bg-secondary/30 shrink-0">
                <span className="text-sm font-semibold text-foreground">Sent</span>
                <span className="ml-2 text-xs text-muted-foreground">{sentEmails.length} messages</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SentList
                  emails={sentEmails}
                  selectedId={selectedSentId}
                  onSelect={setSelectedSentId}
                />
              </div>
            </div>

            {/* Detail pane */}
            <div className={`
              ${!selectedEmail ? 'hidden md:flex' : 'flex'} 
              flex-1 flex-col overflow-hidden bg-background
            `}>
              {selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  onBack={() => setSelectedSentId(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden md:flex">
                  <Mail size={48} className="text-muted-foreground/30 mb-4" />
                  <p className="text-base font-semibold text-muted-foreground">Select an email to view</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Click on a message from the list to read it
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
