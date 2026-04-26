// src/renderer/modules/analytics/AnalyticsPage.tsx
// Jeśli masz już własną implementację StatCards/charts — zintegruj HistoryPage jako zakładkę
import { useState } from 'react'
import { HistoryPage } from './HistoryPage'

type AnalyticsTab = 'stats' | 'history'

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'stats', label: 'Statystyki' },
  { id: 'history', label: 'Historia' },
]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('stats')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
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
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zawartość */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'history' && <HistoryPage />}
      </div>
    </div>
  )
}

// Placeholder — zastąp swoją istniejącą implementacją StatCards, wykresów itp.
function StatsTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Tu wklej swoje obecne StatCards i wykresy */}
      <div style={{ color: '#4a5568', fontSize: 13 }}>
        Przenieś tu swoje obecne StatCards i wykresy z AnalyticsPage.
      </div>
    </div>
  )
}
