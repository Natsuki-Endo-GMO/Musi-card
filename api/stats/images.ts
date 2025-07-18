import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

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

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob storage not configured' });
  }

  try {
    const { blobs } = await list({
      limit: 1000
    });

    let totalSize = 0;
    let userIcons = 0;
    let albumCovers = 0;

    blobs.forEach(blob => {
      totalSize += blob.size || 0;
      if (blob.pathname.includes('/icon/')) {
        userIcons++;
      } else if (blob.pathname.includes('/album/')) {
        albumCovers++;
      }
    });

    const stats = {
      totalFiles: blobs.length,
      totalSize,
      userIcons,
      albumCovers
    };

    console.log(`[API統計取得] ファイル数: ${stats.totalFiles}, 合計サイズ: ${stats.totalSize}, アイコン: ${stats.userIcons}, アルバム: ${stats.albumCovers}`);

    res.status(200).json(stats);
  } catch (error) {
    console.error('統計取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 