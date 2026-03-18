import { useState } from 'react'
import { Settings, Eye, EyeOff, Plug, PlugZap, ChevronDown } from 'lucide-react'
import { SmtpConfig } from '../types/email'

interface Props {
  config: SmtpConfig | null
  onSave: (config: SmtpConfig) => void
  onDisconnect: () => void
  isConnected: boolean
}

const PRESETS = [
  { label: 'Gmail (TLS)', host: 'smtp.gmail.com', port: 587, secure: false },
  { label: 'Gmail (SSL)', host: 'smtp.gmail.com', port: 465, secure: true },
  { label: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587, secure: false },
  { label: 'Yahoo Mail', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  { label: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
  { label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
  { label: 'Resend', host: 'smtp.resend.com', port: 587, secure: false },
  { label: 'AWS SES (US East)', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: false },
  { label: 'Zoho Mail', host: 'smtp.zoho.com', port: 587, secure: false },
  { label: 'Custom', host: '', port: 587, secure: false },
]

export default function SmtpSettings({ config, onSave, onDisconnect, isConnected }: Props) {
  const [form, setForm] = useState<SmtpConfig>(config ?? {
    host: '',
    port: 587,
    username: '',
    password: '',
    secure: false,
    fromName: '',
    fromEmail: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPresets, setShowPresets] = useState(false)

  const set = (key: keyof SmtpConfig, value: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setForm(f => ({ ...f, host: preset.host, port: preset.port, secure: preset.secure }))
    setShowPresets(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-sidebar">
        <Settings size={16} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">SMTP Settings</span>
        {isConnected && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Connected
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preset picker */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Quick Setup</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-lg bg-background hover:bg-secondary transition-colors"
            >
              <span className="text-muted-foreground">Select provider preset…</span>
              <ChevronDown size={14} />
            </button>
            {showPresets && (
              <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* SMTP Host & Port */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">SMTP Host</label>
            <input
              type="text"
              value={form.host}
              onChange={e => set('host', e.target.value)}
              placeholder="smtp.example.com"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Port</label>
            <input
              type="number"
              value={form.port}
              onChange={e => set('port', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              required
            />
          </div>
        </div>

        {/* Security */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Encryption</label>
          <div className="flex gap-2">
            {[
              { label: 'STARTTLS (587)', value: false },
              { label: 'SSL/TLS (465)', value: true },
            ].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => set('secure', opt.value)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  form.secure === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Username / Email</label>
          <input
            type="text"
            value={form.username}
            onChange={e => set('username', e.target.value)}
            placeholder="you@yourdomain.com"
            autoComplete="username"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Password / App Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="w-full px-3 py-2 pr-10 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            For Gmail, use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline">App Password</a>.
          </p>
        </div>

        <div className="border-t border-border" />

        {/* From Name & Email */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name</label>
          <input
            type="text"
            value={form.fromName}
            onChange={e => set('fromName', e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">From Email</label>
          <input
            type="email"
            value={form.fromEmail}
            onChange={e => set('fromEmail', e.target.value)}
            placeholder="you@yourdomain.com"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>

        <div className="pt-2 space-y-2 pb-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
          >
            <PlugZap size={15} />
            Save & Connect
          </button>
          {isConnected && (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-all active:scale-[0.98]"
            >
              <Plug size={15} />
              Disconnect
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
