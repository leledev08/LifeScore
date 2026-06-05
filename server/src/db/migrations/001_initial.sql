-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories (default + custom per user)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Daily entries (one per user per day)
CREATE TABLE IF NOT EXISTS daily_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Scores (one per category per entry)
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 10),
  UNIQUE(entry_id, category_id)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  target_score SMALLINT NOT NULL CHECK (target_score >= 1 AND target_score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_entry ON scores(entry_id);
CREATE INDEX IF NOT EXISTS idx_scores_category ON scores(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
