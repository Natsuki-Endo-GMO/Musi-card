import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'init':
        return await handleInit(req, res);
      case 'migrate':
        return await handleMigrate(req, res);
      case 'users':
        return await handleUsers(req, res);
      case 'stats':
        return await handleStats(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('データベース操作エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// データベース初期化
async function handleInit(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // スキーマファイルを読み込み
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // スキーマを実行
    await sql.query(schema);

    console.log('[DB] データベース初期化完了');

    // 統計情報を取得
    const stats = await getDatabaseStats();

    res.status(200).json({ 
      success: true, 
      message: 'データベースが正常に初期化されました',
      stats 
    });
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// データマイグレーション
async function handleMigrate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 本番環境でのマイグレーション制限
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DATA_MIGRATION !== 'true') {
    return res.status(403).json({ 
      error: 'データマイグレーションは本番環境では無効です' 
    });
  }

  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const userData of data) {
      try {
        // ユーザーが存在するかチェック
        const existingUser = await sql`
          SELECT id FROM users WHERE username = ${userData.username}
        `;

        let userId: string;

        if (existingUser.rows.length === 0) {
          // 新規ユーザー作成
          const newUser = await sql`
            INSERT INTO users (username, display_name, created_at, updated_at)
            VALUES (${userData.username}, ${userData.displayName || userData.username}, NOW(), NOW())
            RETURNING id
          `;
          userId = newUser.rows[0].id;
        } else {
          userId = existingUser.rows[0].id;
        }

        // 楽曲データを挿入
        for (const song of userData.songs || []) {
          await sql`
            INSERT INTO songs (user_id, title, artist, album, cover_url, listen_count, created_at)
            VALUES (${userId}, ${song.title}, ${song.artist}, ${song.album || ''}, ${song.coverUrl || ''}, ${song.listenCount || 0}, NOW())
            ON CONFLICT DO NOTHING
          `;
        }

        migratedCount++;
      } catch (error) {
        console.error(`ユーザー ${userData.username} のマイグレーションエラー:`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `マイグレーション完了: ${migratedCount}件成功, ${errorCount}件失敗`,
      migratedCount,
      errorCount
    });
  } catch (error) {
    console.error('マイグレーションエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// ユーザーデータ取得
async function handleUsers(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;

    if (username) {
      // 特定のユーザーのデータを取得
      const userResult = await sql`
        SELECT id, username, display_name, created_at, updated_at
        FROM users 
        WHERE username = ${username as string}
      `;

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // ユーザーの楽曲データを取得
      const songsResult = await sql`
        SELECT id, title, artist, album, cover_url, listen_count, created_at
        FROM songs 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;

      const userData = {
        ...user,
        songs: songsResult.rows,
        songCount: songsResult.rows.length
      };

      res.status(200).json({
        source: 'database',
        user: userData
      });
    } else {
      // すべてのユーザーのリストを取得
      const usersResult = await sql`
        SELECT 
          u.id, 
          u.username, 
          u.display_name, 
          u.created_at, 
          u.updated_at,
          COUNT(s.id) as song_count
        FROM users u
        LEFT JOIN songs s ON u.id = s.user_id
        GROUP BY u.id, u.username, u.display_name, u.created_at, u.updated_at
        ORDER BY u.updated_at DESC
      `;

      res.status(200).json({
        source: 'database',
        users: usersResult.rows,
        totalUsers: usersResult.rows.length
      });
    }
  } catch (error) {
    console.error('データベース取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// 統計情報取得
async function handleStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await getDatabaseStats();
    res.status(200).json({
      source: 'database',
      stats
    });
  } catch (error) {
    console.error('統計情報取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function getDatabaseStats() {
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
    return { users: 0, songs: 0, sessions: 0 };
  }
} 