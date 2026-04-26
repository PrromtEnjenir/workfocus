## Status projektu
**Faza:** 3 — Focus Tools (w toku)
**Ostatnia sesja:** Sesja 4+5 (długa)
**Następna sesja:** Quick Capture UI, History page, Daily Planning ritual, Settings page

---

## Co jest zrobione

### Faza 1 — Fundament (ukończona)
- [x] Setup projektu (electron-vite 5, TS strict, path aliases)
- [x] DB init + WAL mode + FK
- [x] Migrations runner
- [x] 001_initial.sql — pełny schemat DB
- [x] base.repo.ts (softDelete, logChange, activeWhere)
- [x] settings.repo.ts
- [x] IPC registry + preload bridge (z send + window controls)
- [x] Zustand setup (shared.slice, settings.slice)
- [x] Layout + routing (lazy)
- [x] Dark theme
- [x] i18n setup (PL default)
- [x] Tray icon + globalny Ctrl+Shift+Space
- [x] Testy: migrations + settings repo

### Faza 2 — Core (ukończona)
- [x] tags.repo.ts + tags.ipc.ts
- [x] tasks.repo.ts + tasks.ipc.ts
- [x] tasks.slice.ts (Zustand, undo queue)
- [x] useTasks.ts + useTags.ts (createTask robi fetchTasks zamiast upsert)
- [x] TaskItem, TaskList, TaskForm, TaskDetail, UndoBar
- [x] Soft delete z 30s undo
- [x] Post-mortem przy zamykaniu zadania
- [x] global.types.ts
- [x] reminders.repo.ts + reminders.ipc.ts
- [x] history.repo.ts + history.ipc.ts
- [x] pomodoro.repo.ts + pomodoro.ipc.ts (z statsByTask)
- [x] scheduler.service.ts (cron + restart recovery)
- [x] Follow-up tracker
- [x] IntelFeed (forwardRef + refresh po complete)
- [x] StatCards — FOCUS TIME, SESSIONS, STREAK, EFFICIENCY

### Faza 2 — Stats (ukończona)
- [x] stats.repo.ts (streak, efficiency, weeklyThroughput, timePerTag, estimationAccuracy)
- [x] stats.ipc.ts + rejestracja w registry

### Faza 2 — Triage (ukończona)
- [x] triage.types.ts, useTriageTasks.ts
- [x] TriageCard.tsx — Eisenhower toggles + pain slider
- [x] PairComparison.tsx — pary TYLKO wewnątrz ćwiartki, winner/loser ±1 pain
- [x] TriagePage — matrix 2x2 + lista priorytetów

### Faza 3 — Focus Tools (w toku)
- [x] pomodoro.slice.ts — globalny stan timera (source of truth)
- [x] FocusTimer.tsx — przepisany na pomodoro.slice + broadcast
- [x] Focus Mode mini-okno (Ctrl+Shift+F) — always-on-top, sync stanu z głównym oknem
- [x] Dźwięk końca sesji (timer-end.wav)
- [x] focusTaskId w shared.slice — Active Mission niezależna od detaila
- [x] TaskItem — kółko → ▶ Focus button (toggle focus)
- [x] broadcast w main.ts — timer:broadcast → timer:sync między oknami
- [x] scripts/reset-db.js — dev reset bazy

### UI — Orbital Dark Theme (ukończony)
- [x] Frameless window z custom titlebar
- [x] Poziomy navbar (COMMAND / TRIAGE / ANALYTICS / SETTINGS)
- [x] COMMAND page — kokpit 3 kolumny
- [x] FocusTimer SVG orbital
- [x] StatCards, IntelFeed, Active Mission panel

### Wersje kluczowych zależności
- electron: ^41.3.0
- electron-vite: ^5.0.0
- better-sqlite3: ^12.9.0
- vite: ^6.3.0
- zustand: ^5.0.3
- vitest: ^3.1.0

### Struktura katalogów (ważne)
- Electron entry: src/main/index.ts (NIE electron/main.ts — ten jest nieużywany)
- Preload: src/preload/index.ts
- Renderer root: src/renderer/
- Backend logika: electron/ (db/, ipc/, services/)
- COMMAND page: src/renderer/modules/tasks/CommandPage.tsx
- Triage: src/renderer/modules/triage/
- Focus Mode: src/renderer/modules/focus/FocusMode.tsx
- Bridge: src/renderer/bridge/api.ts (ma: api, listen, broadcast)
- Store: src/renderer/store/ (shared.slice, tasks.slice, pomodoro.slice, settings.slice)

## W toku / Następna sesja

### Do zrobienia (priorytet):
1. **Quick Capture UI** — mini-okno na Ctrl+Shift+Space (osobny BrowserWindow, formularz: tytuł + typ + area, Enter = create + zamknij)
2. **History page** — moduł analytics/history, lista zamkniętych tasków z filtrami
3. **Daily Planning ritual** — poranny przegląd + plan dnia
4. **Daily Shutdown ritual** — wieczorny summary
5. **Weekly Review** — piątkowy przegląd
6. **Settings page** — zarządzanie tagami, konfiguracja pomodoro, motyw, język

### Znane problemy / decyzje:
- Po każdym npm install: `npx electron-rebuild -f -w better-sqlite3`
- Zustand v5: selektory zwracające obiekt/array ZAWSZE przez useShallow
- electron/main.ts istnieje ale jest NIEUŻYWANY — entry to src/main/index.ts
- Efficiency liczy tylko taski z actual_minutes != NULL (wypełnione w post-mortem)
- Focus Mode: wyciszenie dźwięku jest w mini-oknie (🔇/🔊 button)
- FOLLOW-UP (było QUEUED) = filter type waiting_for w CommandPage

## Log sesji

### Sesja 0 — Planowanie (2026-04-22)
- Zaprojektowana architektura, stack, scope

### Sesja 1 — Fundament (2026-04-23)
- Wygenerowane wszystkie pliki Fazy 1, aplikacja uruchomiona

### Sesja 2 — Core + Orbital Redesign (2026-04-24)
- Pełny moduł Tasks, Orbital dark theme, COMMAND kokpit

### Sesja 3 — Reminders + Pomodoro + IntelFeed (2026-04-26)
- reminders/history/pomodoro repo+ipc, FocusTimer podpięty pod DB
- IntelFeed z prawdziwymi danymi, follow-up auto reminder

### Sesja 4+5 — Stats + Triage + Focus Mode (2026-04-26)
- stats.repo + stats.ipc (streak, efficiency, throughput)
- StatCards: wszystkie 4 karty z DB
- Triage: matrix Eisenhower + pary wewnątrz ćwiartki
- pomodoro.slice jako global state
- Focus Mode mini-okno (Ctrl+Shift+F), broadcast sync między oknami
- focusTaskId w shared.slice, ▶ Focus button w TaskItem
- IntelFeed: forwardRef refresh po complete
- scripts/reset-db.js
- Dźwięk końca sesji pomodoro