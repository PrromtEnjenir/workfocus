## Status projektu
**Faza:** 2 — Core (domykanie)
**Ostatnia sesja:** Sesja 3
**Następna sesja:** Faza 3 — stats.ipc (STREAK + EFFICIENCY), pomodoro slice, triage module

---

## Co jest zrobione

### Faza 1 — Fundament (ukończona)
- [x] Setup projektu (electron-vite 5, TS strict, path aliases)
- [x] DB init + WAL mode + FK
- [x] Migrations runner
- [x] 001_initial.sql — pełny schemat DB
- [x] base.repo.ts (softDelete, logChange, activeWhere)
- [x] settings.repo.ts
- [x] IPC registry + preload bridge
- [x] Zustand setup (shared.slice, settings.slice)
- [x] Layout + routing (lazy)
- [x] Light/dark mode (zastąpiony przez stały dark theme)
- [x] i18n setup (PL default)
- [x] Tray icon + globalny Ctrl+Shift+Space
- [x] Testy: migrations + settings repo

### Faza 2 — Core (ukończona)
- [x] tags.repo.ts + tags.ipc.ts
- [x] tasks.repo.ts + tasks.ipc.ts
- [x] tasks.slice.ts (Zustand, undo queue)
- [x] useTasks.ts + useTags.ts
- [x] TaskItem, TaskList, TaskForm, TaskDetail, UndoBar — komponenty
- [x] Soft delete z 30s undo (UndoBar z progress barem)
- [x] Post-mortem przy zamykaniu zadania
- [x] Badge priorytetu CRITICAL/HIGH/MED na task itemach
- [x] Pain dots (10 kropek) na task itemach
- [x] global.types.ts — wszystkie typy aplikacji
- [x] reminders.repo.ts + reminders.ipc.ts
- [x] history.repo.ts + history.ipc.ts
- [x] pomodoro.repo.ts + pomodoro.ipc.ts
- [x] scheduler.service.ts (cron co minutę + restart recovery)
- [x] Follow-up tracker — auto reminder przy tworzeniu email/waiting_for
- [x] IntelFeed — prawdziwe dane (historia + nadchodzące remindery + fired eventy)
- [x] FocusTimer — podpięty pod DB, zapisuje sesje pomodoro
- [x] StatCards — FOCUS TIME i SESSIONS z prawdziwych danych

### UI Redesign — Orbital Dark Theme
- [x] Nowy design system — paleta orbital (deep purple/indigo/fiolet)
- [x] Frameless window z custom titlebar
- [x] Poziomy navbar (COMMAND / TRIAGE / ANALYTICS / SETTINGS)
- [x] COMMAND page — kokpit z 3 kolumnami
- [x] FocusTimer — SVG orbital timer z animowanym okręgiem
- [x] StatCards, IntelFeed, Active Mission panel

### Wersje kluczowych zależności
- electron: ^41.3.0
- electron-vite: ^5.0.0
- better-sqlite3: ^12.9.0
- vite: ^6.3.0
- zustand: ^5.0.3
- vitest: ^3.1.0

### Struktura katalogów (ważne)
- Electron entry: src/main/index.ts
- Preload entry: src/preload/index.ts
- Renderer root: src/renderer/
- Logika backendu: electron/ (db/, ipc/, services/)
- COMMAND page: src/renderer/modules/tasks/CommandPage.tsx

## W toku
- STREAK i EFFICIENCY w StatCards — czekają na stats.ipc
- FocusTimer progress bar — placeholder 0%, czeka na tracking actual_minutes

## Znane problemy / decyzje do podjęcia
- Po każdym npm install: npx electron-rebuild -f -w better-sqlite3
- Zustand v5: selektory zwracające array/obiekt inline wymagają useShallow
- window.electronAPI wymaga rozszerzenia typów w global.d.ts

## Log sesji

### Sesja 0 — Planowanie (2026-04-22)
- Zaprojektowana architektura, stack, scope, pliki kontekstowe

### Sesja 1 — Fundament (2026-04-23)
- Wygenerowane wszystkie pliki Fazy 1
- Aplikacja uruchomiona — sidebar, nawigacja, dark mode działają

### Sesja 2 — Core + Orbital Redesign (2026-04-24)
- Zaimplementowany pełny moduł Tasks (repo, IPC, store, komponenty)
- Orbital dark theme — nowy design system od zera
- Frameless window z custom kontrolkami
- COMMAND kokpit — timer, active mission, stat karty, intel feed

### Sesja 3 — Reminders + Pomodoro + IntelFeed (2026-04-26)
- global.types.ts — stworzony od zera (brakowało)
- reminders.repo + reminders.ipc + scheduler.service
- history.repo + history.ipc
- pomodoro.repo + pomodoro.ipc
- FocusTimer podpięty pod DB (zapisuje sesje, liczy sessions today)
- IntelFeed z prawdziwymi danymi (historia + remindery + push eventy)
- StatCards: FOCUS TIME i SESSIONS z DB
- Follow-up tracker: auto reminder dla email/waiting_for przy create
- Debugowanie: podwójne liczenie sesji (useRef zamiast useState), animacja kółka przy końcu sesji