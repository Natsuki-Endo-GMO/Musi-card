// Spotify API設定
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';

// Spotify API エンドポイント
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// スコープ設定
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'user-library-read'
].join(' ');

// PKCE用のユーティリティ関数
function generateCodeVerifier(): string {
  const array = new Uint32Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...new Uint8Array(array.buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 認証関連
export const spotifyAuth = {
  // 認証URLを生成（PKCE対応）
  getAuthUrl: async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // code_verifierをlocalStorageに保存
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state: generateRandomString(16)
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  },

  // アクセストークンを取得（PKCE対応）
  getAccessToken: async (code: string): Promise<string> => {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier
      })
    });

    // code_verifierを削除
    localStorage.removeItem('spotify_code_verifier');

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  }
};

// 音楽検索機能
export const spotifySearch = {
  // 検索クエリを最適化する関数
  buildOptimizedQuery: (query: string, searchType: 'track' | 'album' | 'artist' = 'track'): string => {
    // 基本的なクリーンアップ
    let cleanQuery = query.trim()
    
    // 日本語検索の最適化
    // 全角文字を含む場合は、より柔軟な検索にする
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanQuery)
    
    if (hasJapanese) {
      // 日本語の場合、市場を日本に指定し、シンプルなクエリにする
      return cleanQuery
    }
    
    // 英語の場合、より具体的な検索フィールドを指定
    if (searchType === 'track') {
      // スペースが含まれている場合、曲名とアーティストの組み合わせとして扱う
      if (cleanQuery.includes(' ') && !cleanQuery.includes('track:') && !cleanQuery.includes('artist:')) {
        const parts = cleanQuery.split(' ')
        if (parts.length >= 2) {
          // 最初の部分を曲名、残りをアーティストとして扱う可能性を考慮
          return cleanQuery // Spotifyの自動判定に任せる
        }
      }
    }
    
    return cleanQuery
  },

  // アルバム検索
  searchAlbums: async (query: string, token: string, limit: number = 10) => {
    const optimizedQuery = spotifySearch.buildOptimizedQuery(query, 'album')
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query)
    
    // 日本語検索の場合は市場を日本に指定
    const marketParam = hasJapanese ? '&market=JP' : ''
    
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(optimizedQuery)}&type=album&limit=${limit}${marketParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to search albums: ${response.status} ${errorData.error?.message || ''}`)
    }

    const data = await response.json();
    return data.albums.items.map((album: any) => ({
      id: album.id,
      name: album.name,
      artist: album.artists[0]?.name || 'Unknown Artist',
      image: album.images[0]?.url || null,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      spotifyUrl: album.external_urls.spotify
    }));
  },

  // トラック検索（強化版）
  searchTracks: async (query: string, token: string, limit: number = 10) => {
    const optimizedQuery = spotifySearch.buildOptimizedQuery(query, 'track')
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query)
    
    // 日本語検索の場合は市場を日本に指定
    const marketParam = hasJapanese ? '&market=JP' : ''
    
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(optimizedQuery)}&type=track&limit=${limit}${marketParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to search tracks: ${response.status} ${errorData.error?.message || ''}`)
    }

    const data = await response.json();
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      image: track.album?.images[0]?.url || null,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify
    }));
  },

  // 複合検索（曲名 + アーティスト名での詳細検索）
  searchTracksAdvanced: async (trackName: string, artistName: string, token: string, limit: number = 5) => {
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trackName + artistName)
    const marketParam = hasJapanese ? '&market=JP' : ''
    
    // より具体的なクエリを構築
    const query = `track:"${trackName}" artist:"${artistName}"`
    
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}${marketParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      // フォールバック: クォートなしで再試行
      const fallbackQuery = `${trackName} ${artistName}`
      return spotifySearch.searchTracks(fallbackQuery, token, limit)
    }

    const data = await response.json();
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      image: track.album?.images[0]?.url || null,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify
    }));
  },

  // アーティスト検索
  searchArtists: async (query: string, token: string, limit: number = 10) => {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search artists');
    }

    const data = await response.json();
    return data.artists.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url || null,
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
      spotifyUrl: artist.external_urls.spotify
    }));
  }
};

// プレビュー機能
export const spotifyPreview = {
  // プレビューURLを取得
  getPreviewUrl: (trackId: string, token: string) => {
    return `${SPOTIFY_API_BASE}/tracks/${trackId}`;
  },

  // プレイリスト取得
  getUserPlaylists: async (token: string) => {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get playlists');
    }

    const data = await response.json();
    return data.items.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      image: playlist.images[0]?.url || null,
      tracksCount: playlist.tracks.total,
      spotifyUrl: playlist.external_urls.spotify
    }));
  }
};

// ユーティリティ関数
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// 型定義
export interface SpotifyAlbum {
  id: string;
  name: string;
  artist: string;
  image: string | null;
  releaseDate: string;
  totalTracks: number;
  spotifyUrl: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  duration: number;
  previewUrl: string | null;
  spotifyUrl: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  image: string | null;
  followers: number;
  genres: string[];
  spotifyUrl: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  image: string | null;
  tracksCount: number;
  spotifyUrl: string;
} 