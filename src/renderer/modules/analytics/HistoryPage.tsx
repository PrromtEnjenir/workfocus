// src/renderer/modules/analytics/HistoryPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { format, parseISO, subDays } from 'date-fns'
import { pl } from 'date-fns/locale'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import type { TaskHistoryEntry, FrictionReason } from '@/shared/types/global.types'

const FRICTION_LABELS: Record<FrictionReason, string> = {
  waiting: 'Czekanie',
  missing_info: 'Brak info',
  technical: 'Techniczny',
  reprioritized: 'Przeprio',
  none: '—',
}

const PERIOD_OPTIONS = [
  { label: '7 dni', days: 7 },
  { label: '30 dni', days: 30 },
  { label: '90 dni', days: 90 },
  { label: 'Wszystko', days: 0 },
]

export function HistoryPage() {
  const { activeArea } = useSharedStore(
    useShallow((s) => ({ activeArea: s.activeArea }))
  )

  const [items, setItems] = useState<TaskHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(30)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<TaskHistoryEntry | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const filters = selectedDays > 0
        ? { completedAfter: subDays(new Date(), selectedDays).toISOString() }
        : undefined
      const data = await api.history.getAll(activeArea, filters)
      setItems(data)
    } catch (err) {
      console.error('[HistoryPage] błąd fetchowania:', err)
    } finally {
      setLoading(false)
    }
  }, [activeArea, selectedDays])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Lista */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e2433', minWidth: 0 }}>
        {/* Filtry */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2433', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj..."
            style={{
              flex: 1,
              minWidth: 120,
              background: '#1a1f2e',
              border: '1px solid #2d3748',
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 12,
              padding: '6px 10px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: selectedDays === opt.days ? '#4f7ef7' : '#2d3748',
                  background: selectedDays === opt.days ? 'rgba(79,126,247,0.15)' : '#1a1f2e',
                  color: selectedDays === opt.days ? '#7aa9ff' : '#718096',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Licznik */}
        <div style={{ padding: '6px 16px', fontSize: 11, color: '#4a5568', borderBottom: '1px solid #1e2433' }}>
          {loading ? 'Ładowanie...' : `${filtered.length} zadań`}
        </div>

        {/* Lista zadań */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#4a5568', fontSize: 13 }}>
              Brak wyników
            </div>
          )}
          {filtered.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
            />
          ))}
        </div>
      </div>

      {/* Detail */}
      {selectedItem && (
        <HistoryDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

// ---

interface HistoryRowProps {
  item: TaskHistoryEntry
  selected: boolean
  onClick: () => void
}

function HistoryRow({ item, selected, onClick }: HistoryRowProps) {
  const completedAt = item.completedAt
    ? format(parseISO(item.completedAt), 'd MMM yyyy', { locale: pl })
    : '—'

  const efficiency =
    item.estimatedMinutes && item.actualMinutes
      ? Math.round((item.estimatedMinutes / item.actualMinutes) * 100)
      : null

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid #1a1f2e',
        cursor: 'pointer',
        background: selected ? 'rgba(79,126,247,0.08)' : 'transparent',
        borderLeft: selected ? '3px solid #4f7ef7' : '3px solid transparent',
        transition: 'background 0.1s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>
          {completedAt}
          {item.frictionReason && item.frictionReason !== 'none' && (
            <span style={{ marginLeft: 8, color: '#ed8936' }}>
              ⚠ {FRICTION_LABELS[item.frictionReason]}
            </span>
          )}
        </div>
      </div>
      {efficiency !== null && (
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: efficiency >= 80 ? '#68d391' : efficiency >= 50 ? '#ed8936' : '#fc8181',
          minWidth: 36,
          textAlign: 'right',
        }}>
          {efficiency}%
        </div>
      )}
    </div>
  )
}

// ---

interface HistoryDetailProps {
  item: TaskHistoryEntry
  onClose: () => void
}

function HistoryDetail({ item, onClose }: HistoryDetailProps) {
  const completedAt = item.completedAt
    ? format(parseISO(item.completedAt), 'd MMMM yyyy, HH:mm', { locale: pl })
    : '—'

  const efficiency =
    item.estimatedMinutes && item.actualMinutes
      ? Math.round((item.estimatedMinutes / item.actualMinutes) * 100)
      : null

  return (
    <div style={{ width: 300, flexShrink: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
          {item.title}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <DetailRow label="Ukończono" value={completedAt} />

      {item.estimatedMinutes && (
        <DetailRow label="Szacowany czas" value={`${item.estimatedMinutes} min`} />
      )}
      {item.actualMinutes && (
        <DetailRow label="Realny czas" value={`${item.actualMinutes} min`} />
      )}
      {efficiency !== null && (
        <DetailRow
          label="Efektywność"
          value={`${efficiency}%`}
          valueColor={efficiency >= 80 ? '#68d391' : efficiency >= 50 ? '#ed8936' : '#fc8181'}
        />
      )}
      {item.frictionReason && item.frictionReason !== 'none' && (
        <DetailRow label="Powód tarcia" value={FRICTION_LABELS[item.frictionReason]} valueColor="#ed8936" />
      )}
      {item.priorityAccurate !== null && item.priorityAccurate !== undefined && (
        <DetailRow
          label="Priorytet trafny"
          value={item.priorityAccurate ? 'Tak' : 'Nie'}
          valueColor={item.priorityAccurate ? '#68d391' : '#fc8181'}
        />
      )}
      {item.postMortem && (
        <div>
          <div style={{ fontSize: 10, color: '#4a5568', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Post-mortem
          </div>
          <div style={{ fontSize: 12, color: '#a0aec0', lineHeight: 1.6, background: '#1a1f2e', padding: 10, borderRadius: 6 }}>
            {item.postMortem}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 12, color: valueColor ?? '#a0aec0', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
