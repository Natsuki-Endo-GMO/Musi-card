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

// 認証関連
export const spotifyAuth = {
  // 認証URLを生成
  getAuthUrl: () => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: generateRandomString(16)
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  },

  // アクセストークンを取得
  getAccessToken: async (code: string): Promise<string> => {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  }
};

// 音楽検索機能
export const spotifySearch = {
  // アルバム検索
  searchAlbums: async (query: string, token: string, limit: number = 10) => {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search albums');
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

  // トラック検索
  searchTracks: async (query: string, token: string, limit: number = 10) => {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search tracks');
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