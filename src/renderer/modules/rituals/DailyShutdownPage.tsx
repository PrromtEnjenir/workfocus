// src/renderer/modules/rituals/DailyShutdownPage.tsx
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { TaskHistoryEntry, RitualLog } from '@/shared/types/global.types'

export function DailyShutdownPage() {
  const { activeArea } = useSharedStore(useShallow((s) => ({ activeArea: s.activeArea })))

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayStart = `${today}T00:00:00.000Z`

  const [wins, setWins] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingLog, setExistingLog] = useState<RitualLog | null>(null)
  const [todayDone, setTodayDone] = useState<TaskHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    // Sprawdź czy shutdown już był dziś
    api.rituals.getLog(`shutdown-${today}`).then((log) => {
      if (log) {
        setExistingLog(log)
        setSaved(true)
        const parsedWins = log.wins ? (JSON.parse(log.wins) as string[]) : ['']
        setWins(parsedWins.length > 0 ? parsedWins : [''])
        setNotes(log.notes ?? '')
      }
    }).catch(console.error)

    // Taski ukończone dziś
    api.history.getAll(activeArea, { completedAfter: todayStart })
      .then(setTodayDone)
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [activeArea, today, todayStart])

  function handleWinChange(idx: number, value: string) {
    setWins((prev) => prev.map((w, i) => (i === idx ? value : w)))
  }

  function addWin() {
    if (wins.length < 5) setWins((prev) => [...prev, ''])
  }

  function removeWin(idx: number) {
    if (wins.length === 1) {
      setWins([''])
    } else {
      setWins((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const filteredWins = wins.filter((w) => w.trim())
      await api.rituals.save({
        type: 'daily_shutdown',
        date: `shutdown-${today}`,
        wins: filteredWins,
        notes: notes.trim() || undefined,
      })
      setSaved(true)
      setExistingLog({
        id: '',
        type: 'daily_shutdown',
        date: `shutdown-${today}`,
        wins: JSON.stringify(filteredWins),
        notes,
        completedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[DailyShutdown] błąd zapisu:', err)
    } finally {
      setSaving(false)
    }
  }

  const todayFormatted = format(new Date(), 'EEEE, d MMMM', { locale: pl })

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Nagłówek */}
      <div>
        <div style={{ fontSize: 11, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Daily Shutdown
        </div>
        <h1 style={{ margin: 0, fontSize: 20, color: '#e2e8f0', fontWeight: 700, textTransform: 'capitalize' }}>
          {todayFormatted}
        </h1>
        {saved && existingLog && (
          <div style={{ fontSize: 11, color: '#48bb78', marginTop: 4 }}>
            ✓ Zamknięty o {format(parseISO(existingLog.completedAt), 'HH:mm')}
          </div>
        )}
      </div>

      {/* Co dziś zrobiłem */}
      <Section title={`Ukończone dziś (${todayDone.length})`}>
        {loadingHistory ? (
          <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>
        ) : todayDone.length === 0 ? (
          <div style={{ color: '#4a5568', fontSize: 13, fontStyle: 'italic' }}>Brak ukończonych zadań dziś.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {todayDone.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1e2433' }}>
                <span style={{ color: '#48bb78', fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 13, color: '#a0aec0' }}>{t.title}</span>
                {t.actualMinutes && (
                  <span style={{ fontSize: 11, color: '#4a5568', marginLeft: 'auto' }}>{t.actualMinutes} min</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Winy dnia */}
      <Section title="Wins dnia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {wins.map((win, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <input
                value={win}
                onChange={(e) => handleWinChange(idx, e.target.value)}
                disabled={saved}
                placeholder={`Win #${idx + 1}...`}
                style={{
                  flex: 1,
                  background: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: 6,
                  color: '#e2e8f0',
                  fontSize: 13,
                  padding: '8px 12px',
                  outline: 'none',
                  opacity: saved ? 0.7 : 1,
                }}
              />
              {!saved && (
                <button
                  onClick={() => removeWin(idx)}
                  style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 16, padding: '0 6px' }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {!saved && wins.length < 5 && (
            <button
              onClick={addWin}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                color: '#4a5568',
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              + dodaj win
            </button>
          )}
        </div>
      </Section>

      {/* Notatka */}
      <Section title="Co na jutro / Notatka">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saved}
          placeholder="Co zostaje na jutro? Jakieś ważne obserwacje z dnia?"
          rows={4}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#1a1f2e',
            border: '1px solid #2d3748',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 13,
            padding: '10px 14px',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.6,
            fontFamily: 'inherit',
            opacity: saved ? 0.7 : 1,
          }}
        />
      </Section>

      {/* Przycisk */}
      {!saved ? (
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            padding: '12px 0',
            background: '#4f7ef7',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Zapisuję...' : '🔒 Zamykam dzień'}
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#48bb78', fontSize: 14, fontWeight: 600 }}>
          ✓ Dzień zamknięty. Dobra robota.
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
