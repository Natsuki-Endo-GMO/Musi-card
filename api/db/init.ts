import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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