import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 楽曲一覧取得
      const { username, limit = 10, offset = 0 } = req.query;

      // TODO: データベースから取得
      const songs = [
        {
          id: 1,
          title: 'Sample Song',
          artist: 'Sample Artist',
          album: 'Sample Album',
          coverImageUrl: null,
          listenCount: 0,
          createdAt: new Date().toISOString()
        }
      ];

      res.status(200).json({ songs, total: songs.length });
    } else if (req.method === 'POST') {
      // 楽曲追加
      const { username, title, artist, album, spotifyId, youtubeId, coverImageUrl } = req.body;

      if (!username || !title || !artist) {
        return res.status(400).json({ error: 'Username, title, and artist are required' });
      }

      // TODO: データベースに保存
      const songId = Date.now(); // 仮のID
      
      console.log(`[API 楽曲追加] ユーザー: ${username}, 楽曲: ${title} - ${artist}`);

      res.status(201).json({ 
        id: songId,
        success: true 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('楽曲API エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 