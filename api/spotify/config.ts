import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 公開可能な設定のみを返す
    const config = {
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || '',
      lastfmApiKey: process.env.LASTFM_API_KEY || '',
      environment: process.env.NODE_ENV || 'development',
      isProduction: isProduction
    };

    res.status(200).json(config);
  } catch (error) {
    console.error('Spotify設定取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 