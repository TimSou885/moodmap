-- MoodMap Phase 0 — 初始 schema
-- PostgreSQL + PostGIS

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 訂閱層級
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');

-- 用戶（匿名）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_alias VARCHAR(30) NOT NULL,
  device_fingerprint VARCHAR(64) NOT NULL,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_device ON users(device_fingerprint);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- 心情標籤對應 valence/arousal（參考 appendix B）
CREATE TABLE mood_tags (
  tag VARCHAR(20) PRIMARY KEY,
  valence FLOAT NOT NULL,
  arousal FLOAT NOT NULL,
  weather_emoji VARCHAR(10) NOT NULL
);

INSERT INTO mood_tags (tag, valence, arousal, weather_emoji) VALUES
  ('happy', 0.8, 0.3, '☀️'),
  ('excited', 0.7, 0.9, '🔥'),
  ('grateful', 0.9, -0.2, '🌈'),
  ('peaceful', 0.5, -0.7, '🌤'),
  ('tired', -0.3, -0.6, '⛅'),
  ('anxious', -0.5, 0.7, '🌪'),
  ('sad', -0.7, -0.5, '🌧'),
  ('angry', -0.8, 0.9, '⛈'),
  ('lonely', -0.6, -0.4, '🌫'),
  ('accomplished', 0.7, 0.5, '⭐'),
  ('confused', -0.2, 0.2, '🌥'),
  ('hopeful', 0.6, 0.4, '🌅');

-- 審核等級（三級響應）
CREATE TYPE alert_level AS ENUM ('safe', 'yellow', 'orange', 'red', 'blocked');

-- 心情文
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(150) NOT NULL DEFAULT '',
  mood_tag VARCHAR(20) NOT NULL REFERENCES mood_tags(tag),
  valence FLOAT NOT NULL,
  arousal FLOAT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  location_fuzzy GEOGRAPHY(Point, 4326) NOT NULL,
  precision_level VARCHAR(20) NOT NULL DEFAULT 'neighborhood',
  h3_index_res7 VARCHAR(15),
  h3_index_res5 VARCHAR(15),
  h3_index_res3 VARCHAR(15),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  alert_level alert_level NOT NULL DEFAULT 'safe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moods_user ON moods(user_id);
CREATE INDEX idx_moods_created ON moods(created_at DESC);
CREATE INDEX idx_moods_active_expires ON moods(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_moods_location ON moods USING GIST(location_fuzzy);
CREATE INDEX idx_moods_h3_7 ON moods(h3_index_res7);
CREATE INDEX idx_moods_h3_5 ON moods(h3_index_res5);
CREATE INDEX idx_moods_h3_3 ON moods(h3_index_res3);

-- 回應類型（罐頭 + 表情）
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mood_id, user_id)
);

CREATE INDEX idx_reactions_mood ON reactions(mood_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- 審核佇列（橙色/紅色排入人工）
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  alert_level alert_level NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_created ON moderation_queue(created_at);

-- 檢舉
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_mood ON reports(mood_id);
CREATE INDEX idx_reports_status ON reports(status);
