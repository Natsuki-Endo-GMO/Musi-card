import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

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
    const { image, username, type } = req.body;
    
    if (!image || !username || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Base64デコード
    const buffer = Buffer.from(image, 'base64');
    
    // ファイル名生成
    const fileName = `${username}/${type}/${Date.now()}.jpg`;

    // Blobにアップロード
    const { url } = await put(fileName, buffer, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    console.log(`[API画像保存] ユーザー: ${username}, ファイル名: ${fileName}, URL: ${url}`);

    res.status(200).json({ url, fileName });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 