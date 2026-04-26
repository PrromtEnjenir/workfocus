// src/renderer/modules/rituals/DailyPlanningPage.tsx
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { format, subDays, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { EnergyLevel, TaskHistoryEntry, RitualLog } from '@/shared/types/global.types'

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; emoji: string; color: string }[] = [
  { value: 'high', label: 'Wysoka', emoji: '⚡', color: '#68d391' },
  { value: 'medium', label: 'Średnia', emoji: '🔆', color: '#ed8936' },
  { value: 'low', label: 'Niska', emoji: '🔋', color: '#fc8181' },
]

export function DailyPlanningPage() {
  const { activeArea } = useSharedStore(useShallow((s) => ({ activeArea: s.activeArea })))

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingLog, setExistingLog] = useState<RitualLog | null>(null)

  // Wczorajsze ukończone taski
  const [yesterdayDone, setYesterdayDone] = useState<TaskHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    // Sprawdź czy dzisiejszy planning już był
    api.rituals.getLog(today).then((log) => {
      if (log) {
        setExistingLog(log)
        setEnergy((log.energyLevel as EnergyLevel) ?? null)
        setNotes(log.notes ?? '')
        setSaved(true)
      }
    }).catch(console.error)

    // Historia z wczoraj
    const afterTs = `${yesterday}T00:00:00.000Z`
    const beforeTs = `${today}T00:00:00.000Z`
    api.history.getAll(activeArea, { completedAfter: afterTs, completedBefore: beforeTs })
      .then(setYesterdayDone)
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [activeArea, today, yesterday])

  async function handleSave() {
    if (!energy) return
    setSaving(true)
    try {
      await api.rituals.save({
        type: 'daily_plan',
        date: today,
        energyLevel: energy,
        notes: notes.trim() || undefined,
      })
      setSaved(true)
      setExistingLog({ id: '', type: 'daily_plan', date: today, energyLevel: energy, notes, completedAt: new Date().toISOString() })
    } catch (err) {
      console.error('[DailyPlanning] błąd zapisu:', err)
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
          Daily Planning
        </div>
        <h1 style={{ margin: 0, fontSize: 20, color: '#e2e8f0', fontWeight: 700, textTransform: 'capitalize' }}>
          {todayFormatted}
        </h1>
        {saved && existingLog && (
          <div style={{ fontSize: 11, color: '#48bb78', marginTop: 4 }}>
            ✓ Wypełniony o {format(parseISO(existingLog.completedAt), 'HH:mm')}
          </div>
        )}
      </div>

      {/* Wczoraj */}
      <Section title="Wczoraj zamknąłem">
        {loadingHistory ? (
          <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>
        ) : yesterdayDone.length === 0 ? (
          <div style={{ color: '#4a5568', fontSize: 13, fontStyle: 'italic' }}>Brak ukończonych zadań wczoraj.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {yesterdayDone.map((t) => (
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

      {/* Energia */}
      <Section title="Poziom energii dziś">
        <div style={{ display: 'flex', gap: 10 }}>
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => !saved && setEnergy(opt.value)}
              disabled={saved}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: energy === opt.value ? opt.color : '#2d3748',
                background: energy === opt.value ? `${opt.color}18` : '#1a1f2e',
                color: energy === opt.value ? opt.color : '#4a5568',
                cursor: saved ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20 }}>{opt.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 500 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Notatki */}
      <Section title="Plan na dziś / Priorytety">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saved}
          placeholder="Co musi się dziś wydarzyć? Jakie są top 3 priorytety?"
          rows={5}
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
          disabled={saving || !energy}
          style={{
            padding: '12px 0',
            background: energy ? '#4f7ef7' : '#2d3748',
            border: 'none',
            borderRadius: 8,
            color: energy ? '#fff' : '#4a5568',
            fontSize: 14,
            fontWeight: 600,
            cursor: energy ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Zapisuję...' : '✓ Zaczynam dzień'}
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#48bb78', fontSize: 14, fontWeight: 600 }}>
          ✓ Dzień zaplanowany. Do roboty.
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
