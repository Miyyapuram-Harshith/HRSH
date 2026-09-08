-- HRSH Database Schema

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  favorite_game TEXT,
  avatar TEXT,
  title TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  settings TEXT NOT NULL,
  winner_id TEXT,
  played_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  score INTEGER,
  rank INTEGER,
  metrics TEXT,
  PRIMARY KEY (match_id, player_id),
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS achievements (
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, achievement_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  game_id TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  target_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player_challenges (
  player_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  progress INTEGER DEFAULT 0,
  completed_at INTEGER,
  PRIMARY KEY (player_id, challenge_id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_game_id ON matches(game_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_players_xp ON players(xp DESC);
