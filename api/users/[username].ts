import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    if (req.method === 'GET') {
      // ユーザー情報取得
      // TODO: データベースから取得
      const user = {
        username,
        displayName: 'Sample User',
        iconUrl: null,
        spotifyId: null,
        createdAt: new Date().toISOString()
      };

      res.status(200).json(user);
    } else if (req.method === 'PUT') {
      // ユーザー情報更新
      const { displayName, iconUrl, spotifyId } = req.body;

      // TODO: データベースに保存
      console.log(`[API ユーザー更新] ${username}: displayName=${displayName}, iconUrl=${iconUrl}`);

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('ユーザーAPI エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 