// src/renderer/modules/settings/SettingsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { api } from '@/bridge/api'
import { useSharedStore } from '@/store/shared.slice'
import { useSettingsStore } from '@/store/settings.slice'
import type { TagModel, AppSettings, Area } from '@/shared/types/global.types'

type SettingsTab = 'tags' | 'pomodoro' | 'appearance' | 'rituals'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'tags', label: 'Tagi' },
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'appearance', label: 'Wygląd' },
  { id: 'rituals', label: 'Rytuały' },
]

const TAG_COLORS = [
  '#4f7ef7', '#48bb78', '#ed8936', '#e53e3e',
  '#9f7aea', '#38b2ac', '#f6e05e', '#ed64a6',
  '#667eea', '#81e6d9',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('tags')

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar z zakładkami */}
      <div style={{ width: 160, borderRight: '1px solid #1e2433', padding: '16px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 12px', fontSize: 10, color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Ustawienia
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 16px',
              textAlign: 'left',
              background: activeTab === tab.id ? 'rgba(79,126,247,0.12)' : 'transparent',
              borderLeft: activeTab === tab.id ? '3px solid #4f7ef7' : '3px solid transparent',
              border: 'none',
              color: activeTab === tab.id ? '#7aa9ff' : '#718096',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zawartość zakładki */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {activeTab === 'tags' && <TagsSettings />}
        {activeTab === 'pomodoro' && <PomodoroSettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'rituals' && <RitualsSettings />}
      </div>
    </div>
  )
}

// ===== TAGI =====

function TagsSettings() {
  const { activeArea } = useSharedStore(useShallow((s) => ({ activeArea: s.activeArea })))
  const [tags, setTags] = useState<TagModel[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [area, setArea] = useState<Area>(activeArea)
  const [saving, setSaving] = useState(false)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.tags.getAll(activeArea)
      setTags(data)
    } finally {
      setLoading(false)
    }
  }, [activeArea])

  useEffect(() => {
    void fetchTags()
  }, [fetchTags])

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.tags.create({ name: newName.trim(), color: newColor, area })
      setNewName('')
      setNewColor(TAG_COLORS[0])
      setCreating(false)
      await fetchTags()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await api.tags.delete(id)
    setTags((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
      <SectionHeader title="Tagi" subtitle={`Tagi dla obszaru: ${activeArea === 'work' ? 'Praca' : 'Osobiste'}`} />

      {loading ? (
        <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tags.length === 0 && (
            <div style={{ color: '#4a5568', fontSize: 13, padding: '12px 0' }}>Brak tagów. Dodaj pierwszy.</div>
          )}
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#1a1f2e',
                borderRadius: 8,
                border: '1px solid #2d3748',
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>{tag.name}</span>
              <button
                onClick={() => void handleDelete(tag.id)}
                style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}
                title="Usuń tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!creating ? (
        <button onClick={() => setCreating(true)} style={addBtnStyle}>
          + Dodaj tag
        </button>
      ) : (
        <div style={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
            placeholder="Nazwa tagu"
            style={inputStyle}
          />

          {/* Wybór koloru */}
          <div>
            <div style={labelStyle}>Kolor</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: newColor === c ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    outline: newColor === c ? '2px solid #4f7ef7' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Area */}
          <div>
            <div style={labelStyle}>Obszar</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['work', 'personal'] as Area[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  style={{
                    ...toggleBtnBase,
                    borderColor: area === a ? '#4f7ef7' : '#2d3748',
                    background: area === a ? 'rgba(79,126,247,0.15)' : '#0f1117',
                    color: area === a ? '#7aa9ff' : '#718096',
                  }}
                >
                  {a === 'work' ? 'Praca' : 'Osobiste'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void handleCreate()} disabled={saving || !newName.trim()} style={primaryBtnStyle}>
              {saving ? 'Zapisuję...' : 'Zapisz'}
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} style={cancelBtnStyle}>
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== POMODORO =====

function PomodoroSettings() {
  const { settings, updateSetting } = useSettingsStore(
    useShallow((s) => ({ settings: s.settings, updateSetting: s.updateSetting }))
  )

  if (!settings) return <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>

  async function handleChange<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSetting(key, value)
    await api.settings.set(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
      <SectionHeader title="Pomodoro" subtitle="Długości interwałów" />

      <NumberField
        label="Czas pracy (min)"
        value={settings.pomodoroMinutes}
        min={5} max={120}
        onChange={(v) => void handleChange('pomodoroMinutes', v)}
      />
      <NumberField
        label="Krótka przerwa (min)"
        value={settings.shortBreakMinutes}
        min={1} max={30}
        onChange={(v) => void handleChange('shortBreakMinutes', v)}
      />
      <NumberField
        label="Długa przerwa (min)"
        value={settings.longBreakMinutes}
        min={5} max={60}
        onChange={(v) => void handleChange('longBreakMinutes', v)}
      />
      <NumberField
        label="Długa przerwa co N sesji"
        value={settings.longBreakAfter}
        min={2} max={10}
        onChange={(v) => void handleChange('longBreakAfter', v)}
      />
    </div>
  )
}

// ===== WYGLĄD =====

function AppearanceSettings() {
  const { settings, updateSetting } = useSettingsStore(
    useShallow((s) => ({ settings: s.settings, updateSetting: s.updateSetting }))
  )

  if (!settings) return <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>

  async function handleChange<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSetting(key, value)
    await api.settings.set(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
      <SectionHeader title="Wygląd" subtitle="Motyw i język" />

      <ToggleGroup
        label="Motyw"
        value={settings.theme}
        options={[
          { value: 'dark', label: 'Ciemny' },
          { value: 'light', label: 'Jasny' },
          { value: 'system', label: 'System' },
        ]}
        onChange={(v) => void handleChange('theme', v as AppSettings['theme'])}
      />

      <ToggleGroup
        label="Język"
        value={settings.language}
        options={[
          { value: 'pl', label: 'Polski' },
          { value: 'en', label: 'English' },
        ]}
        onChange={(v) => void handleChange('language', v as AppSettings['language'])}
      />
    </div>
  )
}

// ===== RYTUAŁY =====

function RitualsSettings() {
  const { settings, updateSetting } = useSettingsStore(
    useShallow((s) => ({ settings: s.settings, updateSetting: s.updateSetting }))
  )

  if (!settings) return <div style={{ color: '#4a5568', fontSize: 13 }}>Ładowanie...</div>

  async function handleChange<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSetting(key, value)
    await api.settings.set(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
      <SectionHeader title="Rytuały" subtitle="Godziny przypomnień" />

      <TimeField
        label="Daily Planning (rano)"
        value={settings.dailyPlanningTime}
        onChange={(v) => void handleChange('dailyPlanningTime', v)}
      />
      <TimeField
        label="Daily Shutdown (wieczór)"
        value={settings.dailyShutdownTime}
        onChange={(v) => void handleChange('dailyShutdownTime', v)}
      />

      <ToggleGroup
        label="Weekly Review — dzień"
        value={settings.weeklyReviewDay}
        options={[
          { value: 'friday', label: 'Piątek' },
          { value: 'saturday', label: 'Sobota' },
          { value: 'sunday', label: 'Niedziela' },
        ]}
        onChange={(v) => void handleChange('weeklyReviewDay', v as AppSettings['weeklyReviewDay'])}
      />
    </div>
  )
}

// ===== KOMPONENTY POMOCNICZE =====

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ margin: 0, fontSize: 15, color: '#e2e8f0', fontWeight: 600 }}>{title}</h2>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4a5568' }}>{subtitle}</p>}
    </div>
  )
}

function NumberField({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{ ...toggleBtnBase, width: 32, height: 32, justifyContent: 'center', display: 'flex', alignItems: 'center' }}
        >−</button>
        <span style={{ minWidth: 36, textAlign: 'center', fontSize: 15, color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{ ...toggleBtnBase, width: 32, height: 32, justifyContent: 'center', display: 'flex', alignItems: 'center' }}
        >+</button>
        <span style={{ fontSize: 11, color: '#4a5568' }}>({min}–{max})</span>
      </div>
    </div>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          width: 120,
          colorScheme: 'dark',
        }}
      />
    </div>
  )
}

function ToggleGroup({
  label, value, options, onChange,
}: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              ...toggleBtnBase,
              borderColor: value === opt.value ? '#4f7ef7' : '#2d3748',
              background: value === opt.value ? 'rgba(79,126,247,0.15)' : '#1a1f2e',
              color: value === opt.value ? '#7aa9ff' : '#718096',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Style stałe

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#4a5568',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  background: '#0f1117',
  border: '1px solid #2d3748',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 13,
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const toggleBtnBase: React.CSSProperties = {
  padding: '7px 14px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid #2d3748',
  background: '#1a1f2e',
  color: '#718096',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const addBtnStyle: React.CSSProperties = {
  padding: '9px 0',
  background: 'transparent',
  border: '1px dashed #2d3748',
  borderRadius: 8,
  color: '#4a5568',
  fontSize: 13,
  cursor: 'pointer',
  width: '100%',
  transition: 'all 0.15s',
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '9px 0',
  background: '#4f7ef7',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  background: '#1a1f2e',
  border: '1px solid #2d3748',
  borderRadius: 6,
  color: '#718096',
  fontSize: 13,
  cursor: 'pointer',
}
