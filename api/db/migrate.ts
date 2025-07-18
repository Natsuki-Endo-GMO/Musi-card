import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production' && process.env.VITE_ENABLE_DATA_MIGRATION !== 'true') {
    return res.status(403).json({ error: 'Data migration is disabled in production' });
  }

  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let migratedUsers = 0;
    let migratedSongs = 0;
    const migrationSources: string[] = [];

    // 1. ファイルベースのデータをマイグレーション
    const usersDataPath = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(usersDataPath)) {
      try {
        const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8')) as Record<string, any[]>;
        migrationSources.push('file');
        
        for (const [username, songs] of Object.entries(usersData)) {
          const result = await migrateUserData(username, songs, 'file');
          migratedUsers += result.users;
          migratedSongs += result.songs;
        }
      } catch (error) {
        console.error('ファイルデータのマイグレーションエラー:', error);
      }
    }

    // 2. リクエストボディからブラウザのローカルストレージデータをマイグレーション
    if (req.body && req.body.localStorageData) {
      try {
        migrationSources.push('localStorage');
        const localStorageData = req.body.localStorageData as Record<string, any>;
        
        for (const [username, userProfile] of Object.entries(localStorageData)) {
          const songs = (userProfile as any).songs || [];
          const result = await migrateUserData(username, songs, 'localStorage', userProfile);
          migratedUsers += result.users;
          migratedSongs += result.songs;
        }
      } catch (error) {
        console.error('ローカルストレージデータのマイグレーションエラー:', error);
      }
    }

    // 統計情報を取得
    const stats = await getDatabaseStats();

    console.log(`[DB] マイグレーション完了: ${migratedUsers}ユーザー, ${migratedSongs}楽曲 (${migrationSources.join(', ')})`);

    res.status(200).json({ 
      success: true, 
      message: 'データマイグレーションが完了しました',
      migrated: {
        users: migratedUsers,
        songs: migratedSongs
      },
      sources: migrationSources,
      stats 
    });
  } catch (error) {
    console.error('データマイグレーションエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function migrateUserData(username: string, songs: any[], source: string, userProfile?: any) {
  let migratedUsers = 0;
  let migratedSongs = 0;

  try {
    // ユーザーを作成または取得
    const displayName = userProfile?.displayName || username;
    const userResult = await sql`
      INSERT INTO users (username, display_name, created_at, updated_at)
      VALUES (${username}, ${displayName}, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET 
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
      RETURNING id
    `;
    
    const userId = userResult.rows[0].id;
    migratedUsers++;

    // 楽曲データを挿入
    if (Array.isArray(songs)) {
      for (const song of songs) {
        await sql`
          INSERT INTO songs (user_id, title, artist, album, cover_url, created_at)
          VALUES (
            ${userId}, 
            ${song.title}, 
            ${song.artist}, 
            ${song.album || null}, 
            ${song.jacket || null}, 
            NOW()
          )
          ON CONFLICT DO NOTHING
        `;
        migratedSongs++;
      }
    }

    console.log(`✅ ${source}: ユーザー「${username}」(${songs.length}曲) をマイグレーションしました`);
  } catch (error) {
    console.error(`${source}: ユーザー ${username} のマイグレーションエラー:`, error);
  }

  return { users: migratedUsers, songs: migratedSongs };
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