// src/renderer/modules/rituals/RitualsPage.tsx
import { useState } from 'react'
import { DailyPlanningPage } from './DailyPlanningPage'
import { DailyShutdownPage } from './DailyShutdownPage'
import { WeeklyReviewPage } from './WeeklyReviewPage'

type RitualTab = 'planning' | 'shutdown' | 'weekly'

const TABS: { id: RitualTab; label: string; icon: string; hint: string }[] = [
  { id: 'planning', label: 'Daily Planning', icon: '🌅', hint: 'Rano' },
  { id: 'shutdown', label: 'Daily Shutdown', icon: '🌙', hint: 'Wieczór' },
  { id: 'weekly', label: 'Weekly Review', icon: '📋', hint: 'Piątek' },
]

export default function RitualsPage() {
  // Domyślna zakładka zależy od pory dnia
  const defaultTab = (): RitualTab => {
    const hour = new Date().getHours()
    if (hour < 12) return 'planning'
    if (hour < 18) return 'shutdown'
    return 'shutdown'
  }

  const [activeTab, setActiveTab] = useState<RitualTab>(defaultTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #1e2433',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4f7ef7' : '2px solid transparent',
              color: activeTab === tab.id ? '#7aa9ff' : '#718096',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{ fontSize: 10, color: '#4a5568', marginLeft: 2 }}>{tab.hint}</span>
          </button>
        ))}
      </div>

      {/* Zawartość */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'planning' && <DailyPlanningPage />}
        {activeTab === 'shutdown' && <DailyShutdownPage />}
        {activeTab === 'weekly' && <WeeklyReviewPage />}
      </div>
    </div>
  )
}
