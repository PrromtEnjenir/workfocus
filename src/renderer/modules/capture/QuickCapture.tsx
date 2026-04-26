// src/renderer/modules/capture/QuickCapture.tsx
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { api, broadcast } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { TaskType, Area } from '@/shared/types/global.types'

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Zadanie' },
  { value: 'email', label: 'Email' },
  { value: 'waiting_for', label: 'Czekam na' },
]

export default function QuickCapture() {
  const { activeArea } = useSharedStore()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('task')
  const [area, setArea] = useState<Area>(activeArea)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fokus od razu na pole tytułu
    inputRef.current?.focus()
  }, [])

  async function handleSubmit() {
    const trimmed = title.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    try {
      await api.tasks.create({ title: trimmed, type, area })
      broadcast.captureTaskCreated() // powiadamia główne okno + zamyka to
    } catch (err) {
      console.error('[QuickCapture] błąd tworzenia taska:', err)
      setError('Nie udało się zapisać.')
      setSaving(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
    if (e.key === 'Escape') {
      broadcast.closeCaptureWindow()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f1117',
        color: '#e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
        userSelect: 'none',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Titlebar drag area */}
      <div
        style={{
          height: 32,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 12,
          background: '#0a0d14',
          borderBottom: '1px solid #1e2433',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Quick Capture
        </span>
        <button
          onClick={() => broadcast.closeCaptureWindow()}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: '#4a5568',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: '0 4px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          title="Zamknij (Esc)"
        >
          ×
        </button>
      </div>

      {/* Formularz */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          gap: 12,
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        {/* Pole tytułu */}
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Co trzeba zrobić..."
          disabled={saving}
          style={{
            background: '#1a1f2e',
            border: '1px solid #2d3748',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 15,
            padding: '10px 14px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#4f7ef7')}
          onBlur={(e) => (e.target.style.borderColor = '#2d3748')}
        />

        {/* Typ + Area w jednym rzędzie */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Typ */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#4a5568', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Typ
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {TASK_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: type === t.value ? '#4f7ef7' : '#2d3748',
                    background: type === t.value ? 'rgba(79,126,247,0.15)' : '#1a1f2e',
                    color: type === t.value ? '#7aa9ff' : '#718096',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div style={{ minWidth: 110 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#4a5568', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Obszar
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['work', 'personal'] as Area[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: area === a ? '#48bb78' : '#2d3748',
                    background: area === a ? 'rgba(72,187,120,0.12)' : '#1a1f2e',
                    color: area === a ? '#68d391' : '#718096',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {a === 'work' ? 'Praca' : 'Osobiste'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#fc8181', fontSize: 12 }}>{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={() => void handleSubmit()}
          disabled={saving || !title.trim()}
          style={{
            marginTop: 'auto',
            padding: '10px 0',
            background: saving || !title.trim() ? '#2d3748' : '#4f7ef7',
            border: 'none',
            borderRadius: 8,
            color: saving || !title.trim() ? '#4a5568' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Zapisuję...' : 'Dodaj zadanie ↵'}
        </button>

        <div style={{ textAlign: 'center', color: '#2d3748', fontSize: 10 }}>
          Enter — zapisz · Esc — zamknij
        </div>
      </div>
    </div>
  )
}
