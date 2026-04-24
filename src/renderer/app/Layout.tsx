import { Suspense, useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSharedStore } from '@/store/shared.slice'
import type { Area } from '@/shared/types/global.types'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/tasks',     label: 'COMMAND'   },
  { to: '/triage',    label: 'TRIAGE'    },
  { to: '/analytics', label: 'ANALYTICS' },
  { to: '/settings',  label: 'SETTINGS'  },
] as const

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const cleanup = window.electronAPI.onWindowMaximized?.((val: boolean) => {
      setIsMaximized(val)
    })
    return () => cleanup?.()
  }, [])

  return (
    <div className={styles.windowControls}>
      <button
        className={`${styles.winBtn} ${styles.winMinimize}`}
        onClick={() => window.electronAPI.windowMinimize?.()}
        aria-label="Minimalizuj"
      />
      <button
        className={`${styles.winBtn} ${styles.winMaximize}`}
        onClick={() => window.electronAPI.windowMaximize?.()}
        aria-label={isMaximized ? 'Przywróć' : 'Maksymalizuj'}
      />
      <button
        className={`${styles.winBtn} ${styles.winClose}`}
        onClick={() => window.electronAPI.windowClose?.()}
        aria-label="Zamknij"
      />
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time
    .toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase()

  return (
    <span className={styles.datetime}>
      {dateStr} <span className={styles.timeValue}>{timeStr}</span>
    </span>
  )
}

export function Layout(): JSX.Element {
  const { activeArea, setActiveArea } = useSharedStore()
  const navigate = useNavigate()

  const switchArea = (area: Area): void => {
    setActiveArea(area)
    navigate('/tasks')
  }

  return (
    <div className={styles.root}>
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◎</span>
            <span className={styles.logoText}>WORKFOCUS</span>
            <span className={styles.logoSub}>ORBITAL</span>
          </div>
          <div className={styles.areaSwitcher}>
            <button
              className={`${styles.areaBtn} ${activeArea === 'work' ? styles.areaActive : ''}`}
              onClick={() => switchArea('work')}
            >
              WORK
            </button>
            <button
              className={`${styles.areaBtn} ${activeArea === 'personal' ? styles.areaActive : ''}`}
              onClick={() => switchArea('personal')}
            >
              PERSONAL
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.navRight}>
          <span className={styles.sector}>◆ SECTOR A</span>
          <Clock />
          <div className={styles.operatorDot} title="Online" />
          <WindowControls />
        </div>
      </header>

      <div className={styles.contentWrapper}>
        <main className={styles.content}>
          <Suspense fallback={<div className={styles.loading}>LOADING…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
