-- Vercel Postgres 無料枠最適化スキーマ
-- ストレージ: 256MB, 行数: 10,000行

-- ユーザーテーブル (軽量化)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL, -- 短縮
  display_name VARCHAR(100), -- 短縮
  icon_url TEXT,
  spotify_id VARCHAR(50), -- 短縮
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 楽曲テーブル (軽量化)
CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL, -- 短縮
  artist VARCHAR(200) NOT NULL, -- 短縮
  album VARCHAR(200), -- 短縮
  spotify_id VARCHAR(50), -- 短縮
  youtube_id VARCHAR(20), -- 短縮
  cover_url TEXT,
  listen_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- セッションテーブル (軽量化)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256ハッシュ
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス (検索最適化)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 古いデータ自動削除トリガー (無料枠対策)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- 30日以上前のセッションを削除
  DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '30 days';
  
  -- 1年以上前の楽曲を削除 (ユーザーが非アクティブな場合)
  DELETE FROM songs 
  WHERE created_at < NOW() - INTERVAL '1 year' 
  AND user_id IN (
    SELECT id FROM users 
    WHERE updated_at < NOW() - INTERVAL '6 months'
  );
END;
$$ LANGUAGE plpgsql;

-- 定期的なクリーンアップ (手動実行用)
-- SELECT cleanup_old_data(); 