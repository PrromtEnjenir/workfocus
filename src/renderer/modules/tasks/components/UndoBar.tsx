import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './UndoBar.module.css'

const UNDO_MS = 30_000

interface UndoBarProps {
  taskTitle: string
  onUndo: () => void
}

export function UndoBar({ taskTitle, onUndo }: UndoBarProps) {
  const { t } = useTranslation('tasks')
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.max(0, 100 - (elapsed / UNDO_MS) * 100))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.bar} role="alert">
      <span className={styles.text}>
        {t('deleted')}: <strong>{taskTitle}</strong>
      </span>
      <button className={styles.undoBtn} onClick={onUndo}>
        {t('undo')}
      </button>
      <div className={styles.progress} style={{ width: `${progress}%` }} />
    </div>
  )
}
