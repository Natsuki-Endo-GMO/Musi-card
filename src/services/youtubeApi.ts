// YouTube Data API v3設定
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeTrack {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  videoId: string;
  embedUrl: string;
}

export const youtubeSearch = {
  // 音楽検索
  searchMusic: async (query: string, maxResults: number = 5): Promise<YouTubeTrack[]> => {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API キーが設定されていません');
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
      
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        duration: 'Unknown',
        videoId: item.id.videoId,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&start=0&end=30`
      }));
    } catch (error) {
      console.error('YouTube検索エラー:', error);
      throw error;
    }
  },

  // 楽曲詳細検索（アーティスト名込み）
  searchTrackByArtist: async (trackName: string, artistName: string, maxResults: number = 3): Promise<YouTubeTrack[]> => {
    const queries = [
      `${trackName} ${artistName} official`,
      `${trackName} ${artistName} music video`,
      `${trackName} ${artistName} audio`,
      `${artistName} ${trackName}`
    ];

    for (const query of queries) {
      try {
        const results = await youtubeSearch.searchMusic(query, maxResults);
        if (results.length > 0) {
          // 結果をスコアリング（公式動画を優先）
          const scoredResults = results.map(track => ({
            ...track,
            score: youtubeSearch.calculateRelevanceScore(track, trackName, artistName)
          })).sort((a, b) => b.score - a.score);

          return scoredResults;
        }
      } catch (error) {
        console.warn(`クエリ失敗: ${query}`, error);
        continue;
      }
    }

    return [];
  },

  // 関連度スコア計算
  calculateRelevanceScore: (track: YouTubeTrack, targetTitle: string, targetArtist: string): number => {
    let score = 0;
    const title = track.title.toLowerCase();
    const channel = track.channelTitle.toLowerCase();
    const targetTitleLower = targetTitle.toLowerCase();
    const targetArtistLower = targetArtist.toLowerCase();

    // タイトル一致
    if (title.includes(targetTitleLower)) score += 30;
    
    // アーティスト一致
    if (channel.includes(targetArtistLower) || title.includes(targetArtistLower)) score += 25;
    
    // 公式チャンネル
    if (channel.includes('official') || title.includes('official')) score += 20;
    
    // 音楽動画系
    if (title.includes('music video') || title.includes('mv')) score += 15;
    if (title.includes('audio') || title.includes('lyric')) score += 10;
    
    // ライブ動画は減点
    if (title.includes('live') || title.includes('concert')) score -= 10;
    if (title.includes('cover') || title.includes('remix')) score -= 5;

    return score;
  }
};

// YouTube埋め込みプレイヤー用のユーティリティ
export const youtubeUtils = {
  // 30秒プレビュー用の埋め込みURL生成
  generatePreviewEmbedUrl: (videoId: string, startTime: number = 0): string => {
    const endTime = startTime + 30; // 30秒間
    return `https://www.youtube.com/embed/${videoId}?` +
           `autoplay=1&start=${startTime}&end=${endTime}&` +
           `controls=1&modestbranding=1&rel=0&showinfo=0`;
  },

  // サムネイル取得
  getThumbnailUrl: (videoId: string, quality: 'default' | 'medium' | 'high' = 'medium'): string => {
    return `https://img.youtube.com/vi/${videoId}/${quality === 'high' ? 'hqdefault' : quality === 'medium' ? 'mqdefault' : 'default'}.jpg`;
  },

  // YouTube動画URL生成
  generateVideoUrl: (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
}; 