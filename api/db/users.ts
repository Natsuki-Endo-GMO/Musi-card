import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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