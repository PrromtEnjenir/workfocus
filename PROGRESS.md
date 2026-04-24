## Status projektu
**Faza:** 2 — Core (Tasks, Tags, Reminders)
**Ostatnia sesja:** Sesja 1
**Następna sesja:** Faza 2 — tasks.repo, tasks.ipc, tags.repo, moduł Tasks

---

## Co jest zrobione

### Faza 1 — Fundament (ukończona)
- [x] Setup projektu (electron-vite 5, TS strict, path aliases)
- [x] DB init + WAL mode + FK
- [x] Migrations runner — SQL inlinowany przez ?raw (nie readFileSync)
- [x] 001_initial.sql — pełny schemat DB
- [x] base.repo.ts (softDelete, logChange, activeWhere)
- [x] settings.repo.ts
- [x] IPC registry + preload bridge (whitelist kanałów)
- [x] Zustand setup (shared.slice, settings.slice)
- [x] Layout + routing (lazy, 10 modułów jako stuby)
- [x] Light/dark mode (CSS vars + data-theme + system sync)
- [x] i18n setup (PL default, pl+en common+tasks)
- [x] Tray icon + globalny Ctrl+Shift+Space
- [x] Testy: migrations + settings repo (5 testów)

### Wersje kluczowych zależności
- electron: ^41.3.0
- electron-vite: ^5.0.0
- better-sqlite3: ^12.9.0 (wymaga electron-rebuild po npm install)
- vite: ^6.3.0
- zustand: ^5.0.3
- vitest: ^3.1.0

### Struktura katalogów (ważne)
- Electron entry: src/main/index.ts
- Preload entry: src/preload/index.ts
- Renderer root: src/renderer/ (tu jest index.html, main.tsx, app/, bridge/, store/, itd.)
- Logika backendu: electron/ (db/, ipc/, services/)

## W toku
_Nic._

## Znane problemy / decyzje do podjęcia
- Po każdym npm install trzeba odpalić: npx electron-rebuild -f -w better-sqlite3
- Warto dodać "postinstall": "electron-rebuild -f -w better-sqlite3" do package.json scripts
- Zustand v5: selektory zwracające array/obiekt inline wymagają useShallow z zustand/shallow

## Log sesji

### Sesja 0 — Planowanie (2026-04-22)
- Zaprojektowana architektura, stack, scope, pliki kontekstowe

### Sesja 1 — Fundament (2026-04-23)
- Wygenerowane wszystkie pliki Fazy 1
- Walka z konfiguracją electron-vite 5 (breaking changes vs v2)
- Rozwiązane problemy: better-sqlite3 ABI, SQL ?raw import, struktura katalogów
- Aplikacja uruchomiona — sidebar, nawigacja, dark mode działają