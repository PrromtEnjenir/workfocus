// src/renderer/modules/rituals/WeeklyReviewPage.tsx
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { format, parseISO, subDays, startOfWeek } from 'date-fns'
import { pl } from 'date-fns/locale'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { TaskHistoryEntry, RitualLog, WeeklyThroughput } from '@/shared/types/global.types'

export function WeeklyReviewPage() {
  const { activeArea } = useSharedStore(useShallow((s) => ({ activeArea: s.activeArea })))

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekKey = `weekly-${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}`

  // Dane tygodnia
  const [weekDone, setWeekDone] = useState<TaskHistoryEntry[]>([])
  const [throughput, setThroughput] = useState<WeeklyThroughput[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Formularz
  const [wins, setWins] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [nextWeekPriorities, setNextWeekPriorities] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingLog, setExistingLog] = useState<RitualLog | null>(null)

  useEffect(() => {
    // Sprawdź czy ten tygodniowy review już był
    api.rituals.getLog(weekKey).then((log) => {
      if (log) {
        setExistingLog(log)
        setSaved(true)
        const parsedWins = log.wins ? (JSON.parse(log.wins) as string[]) : ['']
        setWins(parsedWins.length > 0 ? parsedWins : [''])
        setNotes(log.notes ?? '')
        // nextWeekPriorities schowany w notes po separatorze
        const parts = (log.notes ?? '').split('\n---\n')
        if (parts.length === 2) {
          setNotes(parts[0])
          setNextWeekPriorities(parts[1])
        }
      }
    }).catch(console.error)

    // Taski z tego tygodnia
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    api.history.getAll(activeArea, {
      completedAfter: weekStart.toISOString(),
    }).then(setWeekDone).catch(console.error)

    // Throughput ostatnie 4 tygodnie
    api.stats.getWeeklyThroughput(4, activeArea)
      .then(setThroughput)
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }, [activeArea, weekKey])

  function handleWinChange(idx: number, value: string) {
    setWins((prev) => prev.map((w, i) => (i === idx ? value : w)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const filteredWins = wins.filter((w) => w.trim())
      const fullNotes = nextWeekPriorities.trim()
        ? `${notes.trim()}\n---\n${nextWeekPriorities.trim()}`
        : notes.trim()

      await api.rituals.save({
        type: 'weekly_review',
        date: weekKey,
        wins: filteredWins,
        notes: fullNotes || undefined,
      })
      setSaved(true)
      setExistingLog({
        id: '',
        type: 'weekly_review',
        date: weekKey,
        wins: JSON.stringify(filteredWins),
        notes: fullNotes,
        completedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[WeeklyReview] błąd zapisu:', err)
    } finally {
      setSaving(false)
    }
  }

  // Oblicz throughput bieżącego tygodnia
  const thisWeekCount = weekDone.length
  const prevWeekCount = throughput.length >= 2 ? throughput[throughput.length - 2]?.count ?? 0 : null
  const trend = prevWeekCount !== null
    ? thisWeekCount > prevWeekCount ? 'up' : thisWeekCount < prevWeekCount ? 'down' : 'same'
    : null

  const weekLabel = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "'Tydzień' d MMM", { locale: pl })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Nagłówek */}
      <div>
        <div style={{ fontSize: 11, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Weekly Review
        </div>
        <h1 style={{ margin: 0, fontSize: 20, color: '#e2e8f0', fontWeight: 700 }}>
          {weekLabel}
        </h1>
        {saved && existingLog && (
          <div style={{ fontSize: 11, color: '#48bb78', marginTop: 4 }}>
            ✓ Zapisany {format(parseISO(existingLog.completedAt), 'd MMM, HH:mm', { locale: pl })}
          </div>
        )}
      </div>

      {/* Statystyki tygodnia */}
      <Section title="Throughput tygodnia">
        {loadingStats ? (
          <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <StatBadge
              value={String(thisWeekCount)}
              label="ukończone w tym tygodniu"
              color={trend === 'up' ? '#68d391' : trend === 'down' ? '#fc8181' : '#7aa9ff'}
            />
            {prevWeekCount !== null && (
              <StatBadge
                value={String(prevWeekCount)}
                label="poprzedni tydzień"
                color="#4a5568"
              />
            )}
            {trend && (
              <StatBadge
                value={trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                label={trend === 'up' ? 'Lepiej' : trend === 'down' ? 'Gorzej' : 'Bez zmian'}
                color={trend === 'up' ? '#68d391' : trend === 'down' ? '#fc8181' : '#718096'}
              />
            )}
          </div>
        )}
      </Section>

      {/* Lista ukończonych */}
      <Section title={`Co zrobiłem (${thisWeekCount})`}>
        {weekDone.length === 0 ? (
          <div style={{ color: '#4a5568', fontSize: 13, fontStyle: 'italic' }}>Brak ukończonych zadań w tym tygodniu.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
            {weekDone.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #1a1f2e' }}>
                <span style={{ color: '#48bb78', fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: '#a0aec0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </span>
                <span style={{ fontSize: 11, color: '#2d3748', flexShrink: 0 }}>
                  {format(parseISO(t.completedAt), 'EEE', { locale: pl })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Wins */}
      <Section title="Największe wins tygodnia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {wins.map((win, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#4a5568', padding: '8px 0', flexShrink: 0 }}>🏆</span>
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
              {!saved && wins.length > 1 && (
                <button
                  onClick={() => setWins((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 16, padding: '0 6px' }}
                >×</button>
              )}
            </div>
          ))}
          {!saved && wins.length < 5 && (
            <button
              onClick={() => setWins((prev) => [...prev, ''])}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#4a5568', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
            >
              + dodaj win
            </button>
          )}
        </div>
      </Section>

      {/* Priorytety na przyszły tydzień */}
      <Section title="Priorytety na przyszły tydzień">
        <textarea
          value={nextWeekPriorities}
          onChange={(e) => setNextWeekPriorities(e.target.value)}
          disabled={saved}
          placeholder="Co musi się wydarzyć w przyszłym tygodniu? Top 3-5 rzeczy."
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

      {/* Retrospektywa */}
      <Section title="Retrospektywa / Obserwacje">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saved}
          placeholder="Co poszło dobrze? Co można było zrobić lepiej? Wzorce które widzę?"
          rows={3}
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
          {saving ? 'Zapisuję...' : '📋 Zamykam tydzień'}
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#48bb78', fontSize: 14, fontWeight: 600 }}>
          ✓ Tydzień zamknięty.
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

function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: '#1a1f2e',
      border: '1px solid #2d3748',
      borderRadius: 8,
      padding: '10px 16px',
      textAlign: 'center',
      minWidth: 80,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#4a5568', marginTop: 2, lineHeight: 1.4 }}>{label}</div>
    </div>
  )
}
