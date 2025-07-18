import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del, list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

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

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob storage not configured' });
  }

  try {
    // 30日以上前の画像を削除
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { blobs } = await list({
      limit: 1000
    });

    let deletedCount = 0;

    for (const blob of blobs) {
      if (blob.uploadedAt && new Date(blob.uploadedAt) < thirtyDaysAgo) {
        try {
          await del(blob.url);
          deletedCount++;
          console.log(`[API古い画像削除] URL: ${blob.url}, アップロード日: ${blob.uploadedAt}`);
        } catch (error) {
          console.error(`古い画像削除エラー: ${blob.url}`, error);
        }
      }
    }

    console.log(`[APIクリーンアップ完了] 削除件数: ${deletedCount}`);

    res.status(200).json({ deletedCount });
  } catch (error) {
    console.error('クリーンアップエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 