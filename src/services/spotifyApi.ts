// Spotify API設定（公開情報なのでVITE_でOK）
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// 環境に応じたコールバックURL生成
const getRedirectUri = (): string => {
  // 環境変数で明示的に指定されている場合はそれを使用（公開情報なのでVITE_でOK）
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  }
  
  // Vercel環境の検出（本番環境）
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Vercel本番環境では確実にhttpsを使用
    return `${protocol}//${hostname}/callback`;
  }
  
  // 自動検出：現在のURLから動的に生成
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // ローカル開発環境の検出
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port || '5173'}/callback`;
    }
    
    // その他の本番環境
    return `${protocol}//${hostname}/callback`;
  }
  
  // フォールバック（SSR環境など）
  // 本番環境では環境変数設定を強制
  if (import.meta.env.PROD) {
    throw new Error('本番環境では VITE_SPOTIFY_REDIRECT_URI を設定してください');
  }
  
  return 'http://127.0.0.1:5173/callback';
};

// Spotify API エンドポイント
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// スコープ設定（必要最小限）
const SCOPES = [
  'user-read-private',
  'user-read-email'
].join(' ');

// PKCE用のユーティリティ関数（RFC 7636準拠）
function generateCodeVerifier(): string {
  // RFC 7636: 43-128文字、unreserved characters のみ
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const length = 128; // 最大長を使用してセキュリティを強化
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  const verifier = Array.from(array, byte => charset[byte % charset.length]).join('');
  
  // デバッグログ（開発環境のみ）
  if (import.meta.env.DEV) {
    console.log('🔐 Code Verifier生成 (RFC7636準拠):', {
      length: verifier.length,
      verifier: verifier.substring(0, 15) + '...',
      charset: 'A-Z,a-z,0-9,-,.,_,~'
    });
  }
  
  return verifier;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // base64url encoding without padding
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // padding除去
  
  // デバッグログ（開発環境のみ）
  if (import.meta.env.DEV) {
    console.log('🔐 Code Challenge生成 (S256):', {
      verifierLength: verifier.length,
      challengeLength: challenge.length,
      challenge: challenge.substring(0, 15) + '...',
      method: 'S256'
    });
  }
  
  return challenge;
}

// 認証関連
export const spotifyAuth = {
  // 現在のリダイレクトURIを取得（デバッグ用）
  getCurrentRedirectUri: (): string => getRedirectUri(),
  
  // 認証URLを生成（PKCE対応）
  getAuthUrl: async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const redirectUri = getRedirectUri();
    
    // state生成
    const state = generateRandomString(32);
    const timestamp = Date.now();
    
    // stateごとにcode_verifierを管理（複数タブ対応）
    const authData = {
      codeVerifier,
      timestamp,
      state
    };
    
    localStorage.setItem(`spotify_auth_${state}`, JSON.stringify(authData));
    localStorage.setItem('spotify_current_state', state);
    
    // デバッグ用ログ（開発環境のみ）
    if (import.meta.env.DEV) {
      console.log('🎵 Spotify Auth:', {
        redirectUri,
        environment: import.meta.env.MODE,
        isProd: import.meta.env.PROD,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        port: typeof window !== 'undefined' ? window.location.port : 'unknown',
        envVar: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'not set',
        state: state
      });
    }
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state: state
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  },

  // アクセストークンを取得（PKCE対応）
  getAccessToken: async (code: string, state?: string): Promise<string> => {
    // state が提供されていない場合は従来の方法で取得を試行
    if (!state) {
      const currentState = localStorage.getItem('spotify_current_state');
      if (currentState) {
        state = currentState;
      }
    }
    
    let codeVerifier: string | null = null;
    let timestamp: number | null = null;
    
    if (state) {
      // stateを使用して対応するcode_verifierを取得
      const authDataStr = localStorage.getItem(`spotify_auth_${state}`);
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          codeVerifier = authData.codeVerifier;
          timestamp = authData.timestamp;
          
          console.log('✅ State対応認証データ取得成功:', {
            state: state.substring(0, 10) + '...',
            hasCodeVerifier: !!codeVerifier,
            作成時刻: timestamp ? new Date(timestamp).toLocaleTimeString() : 'unknown'
          });
        } catch (e) {
          console.error('❌ 認証データ解析エラー:', e);
        }
      }
    }
    
    // フォールバック: 古い方法での取得
    if (!codeVerifier) {
      codeVerifier = localStorage.getItem('spotify_code_verifier');
      const timestampStr = localStorage.getItem('spotify_code_verifier_timestamp');
      if (timestampStr) {
        timestamp = parseInt(timestampStr);
      }
      
      if (codeVerifier) {
        console.log('⚠️ フォールバック: 古い方式でcode_verifier取得');
      }
    }
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found - 認証を最初からやり直してください');
    }
    
    // タイムスタンプチェック
    if (timestamp) {
      const currentTime = Date.now();
      const elapsedMinutes = Math.floor((currentTime - timestamp) / 60000);
      
      console.log('🕐 Code Verifier時間確認:', {
        作成時刻: new Date(timestamp).toLocaleTimeString(),
        現在時刻: new Date(currentTime).toLocaleTimeString(),
        経過時間: `${elapsedMinutes}分`,
        制限時間: '10分'
      });
      
      if (elapsedMinutes > 10) {
        console.warn('⚠️ Code Verifierが10分以上経過しています');
      }
    }

    const redirectUri = getRedirectUri();
    const requestBody = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier
    };

    // デバッグ情報をログ出力
    console.log('🔄 トークン交換リクエスト開始...');
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   Client ID: ${CLIENT_ID ? '設定済み' : '❌ 未設定'}`);
    console.log(`   認証コード: ${code.substring(0, 10)}...`);
    console.log(`   Code Verifier: ${codeVerifier ? '設定済み' : '❌ 未設定'}`);
    console.log(`   Code Verifier長さ: ${codeVerifier ? codeVerifier.length : 0}`);
    console.log(`   Code Verifier先頭: ${codeVerifier ? codeVerifier.substring(0, 15) + '...' : 'なし'}`);

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody)
    });

    // 使用済みの認証データを削除
    if (state) {
      localStorage.removeItem(`spotify_auth_${state}`);
    }
    localStorage.removeItem('spotify_current_state');
    // 古い方式のデータも削除（フォールバック対応）
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_code_verifier_timestamp');

          if (!response.ok) {
        // エラー時も認証データをクリーンアップ
        if (state) {
          localStorage.removeItem(`spotify_auth_${state}`);
        }
        localStorage.removeItem('spotify_current_state');
        localStorage.removeItem('spotify_code_verifier');
        localStorage.removeItem('spotify_code_verifier_timestamp');
        
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
          console.error('❌ Token exchange失敗:', errorData);
        } catch (e) {
          console.error('❌ Token exchange失敗: レスポンス解析エラー');
        }
        throw new Error(`Failed to get access token: ${response.status} - ${errorDetails}`);
      }

    const data = await response.json();
    console.log('✅ Token exchange成功!');
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
  // より安全な乱数生成
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(array, (dec) => possible[dec % possible.length]).join('');
  }
  
  // フォールバック
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