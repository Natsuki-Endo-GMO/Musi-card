import { sql } from '@vercel/postgres';

// データベース接続テスト
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ データベース接続成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    return false;
  }
}

// ユーザー関連クエリ
export async function createUser(username: string, displayName?: string, spotifyId?: string) {
  try {
    const result = await sql`
      INSERT INTO users (username, display_name, spotify_id)
      VALUES (${username}, ${displayName}, ${spotifyId})
      RETURNING id, username, display_name, created_at
    `;
    console.log(`[DB] ユーザー作成: ${username}`);
    return result.rows[0];
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    throw error;
  }
}

export async function getUserByUsername(username: string) {
  try {
    const result = await sql`
      SELECT id, username, display_name, icon_url, spotify_id, created_at, updated_at
      FROM users 
      WHERE username = ${username}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    throw error;
  }
}

export async function updateUser(username: string, updates: {
  displayName?: string;
  iconUrl?: string;
  spotifyId?: string;
}) {
  try {
    const result = await sql`
      UPDATE users 
      SET 
        display_name = COALESCE(${updates.displayName}, display_name),
        icon_url = COALESCE(${updates.iconUrl}, icon_url),
        spotify_id = COALESCE(${updates.spotifyId}, spotify_id),
        updated_at = NOW()
      WHERE username = ${username}
      RETURNING id, username, display_name, icon_url, updated_at
    `;
    console.log(`[DB] ユーザー更新: ${username}`);
    return result.rows[0];
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    throw error;
  }
}

// 楽曲関連クエリ
export async function addSong(userId: number, songData: {
  title: string;
  artist: string;
  album?: string;
  spotifyId?: string;
  youtubeId?: string;
  coverUrl?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO songs (user_id, title, artist, album, spotify_id, youtube_id, cover_url)
      VALUES (${userId}, ${songData.title}, ${songData.artist}, ${songData.album}, ${songData.spotifyId}, ${songData.youtubeId}, ${songData.coverUrl})
      RETURNING id, title, artist, created_at
    `;
    console.log(`[DB] 楽曲追加: ${songData.title} - ${songData.artist}`);
    return result.rows[0];
  } catch (error) {
    console.error('楽曲追加エラー:', error);
    throw error;
  }
}

export async function getUserSongs(username: string, limit = 20, offset = 0) {
  try {
    const result = await sql`
      SELECT s.id, s.title, s.artist, s.album, s.spotify_id, s.youtube_id, s.cover_url, s.listen_count, s.created_at
      FROM songs s
      JOIN users u ON s.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    console.error('楽曲取得エラー:', error);
    throw error;
  }
}

// 統計情報
export async function getDatabaseStats() {
  try {
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const songCount = await sql`SELECT COUNT(*) as count FROM songs`;
    const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`;
    
    return {
      users: userCount.rows[0].count,
      songs: songCount.rows[0].count,
      sessions: sessionCount.rows[0].count
    };
  } catch (error) {
    console.error('統計取得エラー:', error);
    return { users: 0, songs: 0, sessions: 0 };
  }
}

// クリーンアップ (無料枠対策)
export async function cleanupOldData() {
  try {
    const result = await sql`SELECT cleanup_old_data()`;
    console.log('[DB] 古いデータをクリーンアップしました');
    return true;
  } catch (error) {
    console.error('クリーンアップエラー:', error);
    return false;
  }
} 