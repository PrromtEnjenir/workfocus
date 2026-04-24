-- WorkFocus — migracja inicjalna
-- Wersja: 001

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  area TEXT NOT NULL CHECK(area IN ('work', 'personal')),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('task', 'email', 'waiting_for')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active', 'completed', 'someday', 'cancelled')),
  area TEXT NOT NULL CHECK(area IN ('work', 'personal')),
  tag_id TEXT REFERENCES tags(id),
  important INTEGER NOT NULL DEFAULT 0,
  urgent INTEGER NOT NULL DEFAULT 0,
  pain_score INTEGER NOT NULL DEFAULT 5 CHECK(pain_score BETWEEN 1 AND 10),
  energy_required TEXT CHECK(energy_required IN ('high', 'medium', 'low')),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  deadline TEXT,
  waiting_for_person TEXT,
  notes TEXT,
  parent_task_id TEXT REFERENCES tasks(id),
  depends_on_task_id TEXT REFERENCES tasks(id),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS task_changelog (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  tag_id TEXT,
  area TEXT NOT NULL,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  post_mortem TEXT,
  friction_reason TEXT
    CHECK(friction_reason IN ('waiting', 'missing_info', 'technical', 'reprioritized', 'none')),
  priority_accurate INTEGER,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  planned_minutes INTEGER NOT NULL DEFAULT 25,
  completed INTEGER NOT NULL DEFAULT 0,
  interrupted_reason TEXT,
  parking_lot TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  remind_at TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('once', 'followup', 'recurring')),
  recurrence_days INTEGER,
  followup_after_days INTEGER,
  dismissed_at TEXT,
  fired_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ritual_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('daily_plan', 'daily_shutdown', 'weekly_review')),
  date TEXT NOT NULL,
  energy_level TEXT CHECK(energy_level IN ('high', 'medium', 'low')),
  notes TEXT,
  wins TEXT,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_log (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  context TEXT,
  tag_id TEXT REFERENCES tags(id),
  area TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_tasks_area ON tasks(area);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_pomodoro_task ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_history_completed ON task_history(completed_at);

-- Domyślne ustawienia
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme', '"system"'),
  ('language', '"pl"'),
  ('pomodoroMinutes', '25'),
  ('shortBreakMinutes', '5'),
  ('longBreakMinutes', '15'),
  ('longBreakAfter', '4'),
  ('dailyPlanningTime', '"08:00"'),
  ('dailyShutdownTime', '"17:00"'),
  ('weeklyReviewDay', '"friday"'),
  ('backupEnabled', 'true'),
  ('backupPath', '""'),
  ('backupIntervalDays', '7'),
  ('notificationsEnabled', 'true'),
  ('followupDefaultDays', '3'),
  ('defaultArea', '"work"');
