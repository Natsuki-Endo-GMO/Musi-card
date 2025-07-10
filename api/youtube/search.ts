import type { VercelRequest, VercelResponse } from '@vercel/node';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // VITE_プレフィックスなし
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  videoId: string;
  embedUrl: string;
}

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

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  const { query, maxResults = '5' } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // 音楽検索に最適化されたクエリを構築
    const musicQuery = `${query} music audio`;
    
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?` +
      `part=snippet&type=video&videoCategoryId=10&` +
      `q=${encodeURIComponent(musicQuery)}&` +
      `maxResults=${maxResults}&` +
      `key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`YouTube検索失敗: ${response.status} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    
    const results: YouTubeSearchResult[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      duration: 'Unknown',
      videoId: item.id.videoId,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&start=0&end=30`
    }));

    res.status(200).json({ results });
  } catch (error) {
    console.error('YouTube検索エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 