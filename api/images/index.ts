import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, del, list } from '@vercel/blob';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validateFilename, validateImageData, validateUrl } from '../utils/validation';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'upload':
        return await requireAuth(handleUpload)(req as AuthenticatedRequest, res);
      case 'delete':
        return await requireAuth(handleDelete)(req as AuthenticatedRequest, res);
      case 'cleanup':
        return await requireAdmin(handleCleanup)(req as AuthenticatedRequest, res);
      case 'stats':
        return await requireAuth(handleStats)(req as AuthenticatedRequest, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('画像操作エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// 画像アップロード
async function handleUpload(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    const { imageData, filename } = req.body;

    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Missing imageData or filename' });
    }

    // Base64データをArrayBufferに変換
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Vercel Blobにアップロード
    const blob = await put(filename, buffer, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });

    res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname
    });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// 画像削除
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }

    // Vercel Blobから削除
    await del(url, { token: BLOB_READ_WRITE_TOKEN });

    res.status(200).json({
      success: true,
      message: '画像が正常に削除されました'
    });
  } catch (error) {
    console.error('画像削除エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// 画像クリーンアップ
async function handleCleanup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Missing or invalid urls array' });
    }

    let deletedCount = 0;
    let errorCount = 0;

    for (const url of urls) {
      try {
        await del(url, { token: BLOB_READ_WRITE_TOKEN });
        deletedCount++;
      } catch (error) {
        console.error(`画像削除エラー (${url}):`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `クリーンアップ完了: ${deletedCount}件削除, ${errorCount}件エラー`,
      deletedCount,
      errorCount
    });
  } catch (error) {
    console.error('画像クリーンアップエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// 画像統計情報
async function handleStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    // Vercel Blobのリストを取得
    const { blobs } = await list({ token: BLOB_READ_WRITE_TOKEN });

    // 統計情報を計算
    const totalImages = blobs.length;
    const totalSize = blobs.reduce((sum, blob) => sum + (blob.size || 0), 0);
    const imageTypes = blobs.reduce((types, blob) => {
      const extension = blob.pathname.split('.').pop()?.toLowerCase() || 'unknown';
      types[extension] = (types[extension] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      stats: {
        totalImages,
        totalSize,
        imageTypes,
        blobs: blobs.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        }))
      }
    });
  } catch (error) {
    console.error('画像統計取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 