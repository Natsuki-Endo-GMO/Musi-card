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
    // テーブル統計
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const songCount = await sql`SELECT COUNT(*) as count FROM songs`;
    const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`;

    // 無料枠制限
    const FREE_TIER_LIMITS = {
      storage: 256 * 1024 * 1024, // 256MB in bytes
      rows: 10000,
      connections: 1
    };

    // 推定使用量 (簡易計算)
    const estimatedStorage = (userCount.rows[0].count * 1000) + // ユーザー: 約1KB/人
                           (songCount.rows[0].count * 500) +    // 楽曲: 約500B/曲
                           (sessionCount.rows[0].count * 200);  // セッション: 約200B/セッション

    const totalRows = userCount.rows[0].count + songCount.rows[0].count + sessionCount.rows[0].count;

    const stats = {
      tables: {
        users: userCount.rows[0].count,
        songs: songCount.rows[0].count,
        sessions: sessionCount.rows[0].count
      },
      limits: FREE_TIER_LIMITS,
      usage: {
        storage: {
          used: estimatedStorage,
          limit: FREE_TIER_LIMITS.storage,
          percentage: Math.round((estimatedStorage / FREE_TIER_LIMITS.storage) * 100)
        },
        rows: {
          used: totalRows,
          limit: FREE_TIER_LIMITS.rows,
          percentage: Math.round((totalRows / FREE_TIER_LIMITS.rows) * 100)
        }
      },
      warnings: [] as string[]
    };

    // 警告チェック
    if (stats.usage.storage.percentage > 80) {
      stats.warnings.push('ストレージ使用量が80%を超えています');
    }
    if (stats.usage.rows.percentage > 80) {
      stats.warnings.push('行数が80%を超えています');
    }
    if (songCount.rows[0].count > 5000) {
      stats.warnings.push('楽曲数が多いため、古いデータの削除を検討してください');
    }

    console.log(`[DB統計] ユーザー: ${stats.tables.users}, 楽曲: ${stats.tables.songs}, 使用率: ${stats.usage.storage.percentage}%`);

    res.status(200).json(stats);
  } catch (error) {
    console.error('統計取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 