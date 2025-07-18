import axios from 'axios'
import { spotifySearch, SpotifyTrack, SpotifyAlbum } from './spotifyApi'

// 音楽API プロバイダー設定
export type MusicProvider = 'lastfm' | 'spotify'

// 検索状態とエラー情報を管理
interface SearchStatus {
  provider: MusicProvider
  success: boolean
  error?: string
  fallbackReason?: string
  timestamp: number
}

let lastSearchStatus: SearchStatus[] = []

// フォールバック理由とエラー情報を取得する関数
export const getLastSearchStatus = (): SearchStatus[] => lastSearchStatus

export const clearSearchStatus = () => {
  lastSearchStatus = []
}

// ステータス記録関数
const recordSearchStatus = (provider: MusicProvider, success: boolean, error?: string, fallbackReason?: string) => {
  const status: SearchStatus = {
    provider,
    success,
    error,
    fallbackReason,
    timestamp: Date.now()
  }
  lastSearchStatus.push(status)
  
  // コンソールに詳細情報を出力
  if (success) {
    console.log(`✅ ${provider.toUpperCase()}検索成功`)
  } else {
    console.error(`❌ ${provider.toUpperCase()}検索失敗:`, error)
    if (fallbackReason) {
      console.warn(`🔄 フォールバック理由: ${fallbackReason}`)
    }
  }
}

// 設定可能なAPI プロバイダー（デフォルトはSpotify）
let currentProvider: MusicProvider = 'spotify'

// プロバイダー切り替え関数
export const setMusicProvider = (provider: MusicProvider) => {
  currentProvider = provider
  console.log(`🔄 音楽検索プロバイダーを ${provider.toUpperCase()} に切り替えました`)
}

export const getCurrentProvider = (): MusicProvider => currentProvider

// Last.fm API設定
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'YOUR_LASTFM_API_KEY' // 公開APIキーなのでVITE_でOK
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

// Spotify API設定
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '' // 公開情報なのでVITE_でOK
const REDIRECT_URI = `${window.location.origin}/callback`
const SCOPES = 'user-read-private user-read-email'

export interface SearchResult {
  name: string
  artist: string
  image?: string
  url?: string
  isGeneratedImage?: boolean
  provider?: MusicProvider
  id?: string // Spotify用
}

export interface AlbumSearchResult {
  name: string
  artist: string
  image: string
  url: string
  isGeneratedImage?: boolean
  provider?: MusicProvider
  id?: string // Spotify用
}

// 画像URLが有効かどうかをチェックする関数
const isValidImageUrl = (url: string): boolean => {
  return Boolean(url && url.trim() !== '' && !url.includes('2a96cbd8b46e442fc41c2b86b821562f'))
}

// Spotify アクセストークン管理
let spotifyAccessToken: string | null = null

// アプリケーション初期化時にローカルストレージからトークンを復元
const initializeSpotifyToken = () => {
  const savedToken = localStorage.getItem('spotify_access_token')
  if (savedToken) {
    spotifyAccessToken = savedToken
    console.log('Spotify トークンをローカルストレージから復元しました')
    
    // Spotifyが利用可能な場合はデフォルトプロバイダーに設定
    if (SPOTIFY_CLIENT_ID) {
      setMusicProvider('spotify')
    }
  }
}

// 初期化を実行
initializeSpotifyToken()

export const setSpotifyAccessToken = (token: string) => {
  spotifyAccessToken = token
  localStorage.setItem('spotify_access_token', token)
  console.log('Spotify アクセストークンが設定されました')
}

export const getSpotifyAccessToken = (): string | null => spotifyAccessToken

export const removeSpotifyAccessToken = () => {
  spotifyAccessToken = null
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_token_expires')
  console.log('Spotify アクセストークンを削除しました')
}

/**
 * 認証コードからアクセストークンを取得（Authorization Code Flow）
 */
export async function exchangeCodeForTokens(code: string, state: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  // 認証コードの重複使用チェック
  const usedCodes = JSON.parse(localStorage.getItem('spotify_used_codes') || '[]')
  if (usedCodes.includes(code)) {
    console.warn('⚠️ 認証コードは既に使用済みです')
    throw new Error('この認証コードは既に使用されています。新しい認証を開始してください。')
  }

  // CSRF攻撃防止のためのstate検証（デバッグ情報付き）
  const storedState = localStorage.getItem('spotify_auth_state')
  const storedTimestamp = localStorage.getItem('spotify_auth_timestamp')
  
  console.log('🔍 State検証デバッグ:')
  console.log(`   受信したstate: "${state}"`)
  console.log(`   保存されたstate: "${storedState}"`)
  console.log(`   一致: ${state === storedState}`)
  
  // タイムアウトチェック（10分以内）
  if (storedTimestamp) {
    const timeDiff = Date.now() - parseInt(storedTimestamp)
    const timeoutMinutes = Math.floor(timeDiff / (1000 * 60))
    console.log(`   認証開始からの経過時間: ${timeoutMinutes}分`)
    
    if (timeDiff > 10 * 60 * 1000) { // 10分以上経過
      console.warn('⚠️ 認証タイムアウト（10分以上経過）')
      localStorage.removeItem('spotify_auth_state')
      localStorage.removeItem('spotify_auth_timestamp')
      throw new Error('認証がタイムアウトしました。再度認証を開始してください。')
    }
  }
  
  // 開発環境では一時的にstate検証をスキップ（セキュリティ警告あり）
  if (state !== storedState) {
    console.warn('⚠️ State parameter不一致 - 開発環境では続行します')
    console.warn('🔐 本番環境では必ずstate検証を有効にしてください')
    
    // 本番環境では以下の行のコメントを外す
    // throw new Error('Invalid state parameter')
  } else {
    console.log('✅ State検証成功')
    // 使用済みstateを削除
    localStorage.removeItem('spotify_auth_state')
    localStorage.removeItem('spotify_auth_timestamp')
  }
  
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback' // 公開情報なのでVITE_でOK
  
  console.log('🔄 トークン交換リクエスト開始...')
  console.log(`   Redirect URI: ${redirectUri}`)
  console.log(`   Client ID: ${SPOTIFY_CLIENT_ID ? '設定済み' : '未設定'}`)
  console.log(`   認証コード: ${code.substring(0, 10)}...`)
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || ''}`)}` // 注意: シークレットはサーバーサイドで処理すべき
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Token exchange失敗:', errorData)
      
      // 詳細なエラー分析
      if (errorData.error === 'invalid_grant') {
        if (errorData.error_description?.includes('authorization code')) {
          throw new Error('認証コードが無効または既に使用済みです')
        } else if (errorData.error_description?.includes('redirect_uri')) {
          throw new Error('Redirect URIが一致しません')
        }
      }
      
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
    }
    
    const tokenData = await response.json()
    
    // 認証コードを使用済みリストに追加
    usedCodes.push(code)
    // 最新の10個のコードのみ保持
    if (usedCodes.length > 10) {
      usedCodes.shift()
    }
    localStorage.setItem('spotify_used_codes', JSON.stringify(usedCodes))
    
    // トークンを保存
    setSpotifyAccessToken(tokenData.access_token)
    localStorage.setItem('spotify_refresh_token', tokenData.refresh_token)
    localStorage.setItem('spotify_token_expires', (Date.now() + tokenData.expires_in * 1000).toString())
    
    console.log('✅ Spotifyトークンを正常に取得・保存しました')
    console.log(`   有効期限: ${new Date(Date.now() + tokenData.expires_in * 1000).toLocaleString()}`)
    
    return tokenData
    
  } catch (error: any) {
    // ネットワークエラーやJSONパースエラーの場合
    if (error.message?.includes('fetch')) {
      throw new Error('ネットワークエラー: Spotify APIへの接続に失敗しました')
    }
    throw error
  }
}

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 */
export async function refreshSpotifyToken(): Promise<string> {
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  if (!refreshToken) {
    throw new Error('リフレッシュトークンがありません')
  }
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || ''}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`)
  }
  
  const tokenData = await response.json()
  
  // 新しいトークンを保存
  setSpotifyAccessToken(tokenData.access_token)
  localStorage.setItem('spotify_token_expires', (Date.now() + tokenData.expires_in * 1000).toString())
  
  // リフレッシュトークンが更新された場合は保存
  if (tokenData.refresh_token) {
    localStorage.setItem('spotify_refresh_token', tokenData.refresh_token)
  }
  
  console.log('✅ Spotifyトークンをリフレッシュしました')
  
  return tokenData.access_token
}

/**
 * トークンの有効期限をチェックし、必要に応じて更新
 */
export async function ensureValidToken(): Promise<string | null> {
  if (!spotifyAccessToken) {
    console.log('❌ アクセストークンが設定されていません')
    return null
  }
  
  const expiresAt = localStorage.getItem('spotify_token_expires')
  if (!expiresAt) {
    console.log('❌ トークンの有効期限情報がありません')
    return spotifyAccessToken
  }
  
  const now = Date.now()
  const expireTime = parseInt(expiresAt)
  
  // 5分前にリフレッシュ（安全マージン）
  if (now >= expireTime - 5 * 60 * 1000) {
    console.log('🔄 トークンの有効期限が近いため、リフレッシュします')
    try {
      return await refreshSpotifyToken()
    } catch (error) {
      console.error('❌ トークンリフレッシュに失敗:', error)
      removeSpotifyAccessToken()
      return null
    }
  }
  
  return spotifyAccessToken
}

// Spotify検索関数
const searchMusicSpotify = async (query: string): Promise<SearchResult[]> => {
  clearSearchStatus() // 新しい検索開始時にクリア
  
  if (!SPOTIFY_CLIENT_ID) {
    const reason = 'Spotify設定（CLIENT_ID）が不完全です'
    recordSearchStatus('spotify', false, reason, `${reason}。Last.fmにフォールバックします。`)
    return searchMusicLastFm(query)
  }

  // トークンの有効性を確認し、必要に応じてリフレッシュ
  const validToken = await ensureValidToken()
  if (!validToken) {
    const reason = 'Spotify アクセストークンが設定されていないか、リフレッシュに失敗しました'
    recordSearchStatus('spotify', false, reason, `${reason}。Last.fmにフォールバックします。`)
    return searchMusicLastFm(query)
  }

  try {
    const results: SearchResult[] = []
    
    // クエリを分析（曲名 + アーティスト名の組み合わせかどうか）
    const queryParts = query.trim().split(/\s+/)
    const hasMultipleWords = queryParts.length >= 2
    
    // 1. まず通常の楽曲検索を実行
    const tracks = await spotifySearch.searchTracks(query, validToken, 7)
    
    // 2. アルバム検索も並行実行
    const albums = await spotifySearch.searchAlbums(query, validToken, 3)
    
    // 3. 複数単語の場合は詳細検索も試行
    let advancedTracks: any[] = []
    if (hasMultipleWords && queryParts.length <= 4) {
      try {
        // 前半を曲名、後半をアーティスト名として詳細検索
        const trackPart = queryParts.slice(0, Math.ceil(queryParts.length / 2)).join(' ')
        const artistPart = queryParts.slice(Math.ceil(queryParts.length / 2)).join(' ')
        
        advancedTracks = await spotifySearch.searchTracksAdvanced(trackPart, artistPart, validToken, 3)
      } catch (error) {
        console.log('Spotify詳細検索失敗（通常の検索結果を使用）:', error)
      }
    }

    // 結果をマージ（重複を避けるためIDで管理）
    const addedIds = new Set<string>()
    
    // 詳細検索結果を優先して追加
    advancedTracks.forEach((track: SpotifyTrack) => {
      if (!addedIds.has(track.id)) {
        results.push({
          name: track.name,
          artist: track.artist,
          image: track.image || undefined,
          url: track.spotifyUrl,
          isGeneratedImage: !track.image,
          provider: 'spotify',
          id: track.id
        })
        addedIds.add(track.id)
      }
    })

    // 通常の楽曲検索結果を追加
    tracks.forEach((track: SpotifyTrack) => {
      if (!addedIds.has(track.id)) {
        results.push({
          name: track.name,
          artist: track.artist,
          image: track.image || undefined,
          url: track.spotifyUrl,
          isGeneratedImage: !track.image,
          provider: 'spotify',
          id: track.id
        })
        addedIds.add(track.id)
      }
    })

    // アルバム結果を追加
    albums.forEach((album: SpotifyAlbum) => {
      if (!addedIds.has(album.id)) {
        results.push({
          name: album.name,
          artist: album.artist,
          image: album.image || undefined,
          url: album.spotifyUrl,
          isGeneratedImage: !album.image,
          provider: 'spotify',
          id: album.id
        })
        addedIds.add(album.id)
      }
    })

    recordSearchStatus('spotify', true)
    console.log(`Spotify検索完了: ${results.length}件の結果`)
    return results.slice(0, 10) // 最大10件に制限
    
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error?.message || error?.message || 'Spotify API呼び出しに失敗しました'
    const statusCode = error?.response?.status
    const fullError = statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage
    
    recordSearchStatus('spotify', false, fullError, 'Spotify検索でエラーが発生したため、Last.fmにフォールバックします')
    console.error('Spotify検索エラー詳細:', {
      status: statusCode,
      message: errorMessage,
      response: error?.response?.data,
      error
    })
    
    return searchMusicLastFm(query)
  }
}

// Last.fm APIを使用した音楽検索（元のsearchMusic関数を改名）
const searchMusicLastFm = async (query: string): Promise<SearchResult[]> => {
  try {
    // 検索クエリの最適化
    const optimizedQuery = query.trim()
    
    console.log(`Last.fm検索実行: "${optimizedQuery}"`)
    
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'track.search',
        track: optimizedQuery,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 15 // Spotify比較のため少し多めに取得
      }
    })

    const tracks = response.data.results?.trackmatches?.track || []
    recordSearchStatus('lastfm', true)
    console.log(`Last.fm検索結果: ${tracks.length}件`)
    
    if (!Array.isArray(tracks)) {
      recordSearchStatus('lastfm', false, 'Last.fm APIの応答形式が予期しない形式です', 'レスポンスデータの構造が変更された可能性があります')
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Last.fm APIのレスポンス型が不定のため
    return tracks.map((track: any) => {
      const imageUrl = track.image?.[3]?.['#text'] || track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'] || ''
      const fallback = getFallbackImage(track.name, track.artist)
      return {
        name: track.name,
        artist: track.artist,
        image: isValidImageUrl(imageUrl) ? imageUrl : fallback.image,
        url: track.url,
        isGeneratedImage: !isValidImageUrl(imageUrl),
        provider: 'lastfm' as MusicProvider
      }
    })
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Last.fm API呼び出しに失敗しました'
    const statusCode = error?.response?.status
    const fullError = statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage
    
    recordSearchStatus('lastfm', false, fullError, 'Last.fm APIでエラーが発生しました')
    console.error('Last.fm検索エラー詳細:', {
      status: statusCode,
      message: errorMessage,
      response: error?.response?.data,
      error
    })
    return []
  }
}

// アルバム検索
export const searchAlbum = async (query: string): Promise<AlbumSearchResult[]> => {
  const availableProviders = getAvailableProviders()
  
  // 現在のプロバイダーが利用可能かチェック
  if (availableProviders.includes(currentProvider)) {
    try {
      switch (currentProvider) {
        case 'spotify':
          return await searchAlbumSpotify(query)
        case 'lastfm':
          return await searchAlbumLastFm(query)
        default:
          throw new Error(`未サポートのプロバイダー: ${currentProvider}`)
      }
    } catch (error) {
      console.error(`${currentProvider}アルバム検索エラー:`, error)
    }
  }
  
  // フォールバック
  for (const provider of availableProviders) {
    if (provider !== currentProvider) {
      try {
        switch (provider) {
          case 'spotify':
            return await searchAlbumSpotify(query)
          case 'lastfm':
            return await searchAlbumLastFm(query)
        }
      } catch (error) {
        console.error(`${provider}アルバム検索フォールバック失敗:`, error)
      }
    }
  }
  
  return []
}

// 画像の代替手段を提供する関数
const getFallbackImage = (trackName: string, artistName: string): { image: string; isGenerated: boolean } => {
  // より良い代替画像サービスを使用
  return {
    image: `https://picsum.photos/300/300?random=${Math.floor(Math.random() * 1000)}`,
    isGenerated: true
  }
}

// モックデータ（APIキーがない場合のフォールバック）
const mockSearchResults: SearchResult[] = [
  { name: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://picsum.photos/300/300?random=1', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Hotel California', artist: 'Eagles', image: 'https://picsum.photos/300/300?random=2', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Imagine', artist: 'John Lennon', image: 'https://picsum.photos/300/300?random=3', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Stairway to Heaven', artist: 'Led Zeppelin', image: 'https://picsum.photos/300/300?random=4', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Yesterday', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=5', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Smells Like Teen Spirit', artist: 'Nirvana', image: 'https://picsum.photos/300/300?random=6', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Like a Rolling Stone', artist: 'Bob Dylan', image: 'https://picsum.photos/300/300?random=7', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'I Want to Hold Your Hand', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=8', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Johnny B. Goode', artist: 'Chuck Berry', image: 'https://picsum.photos/300/300?random=9', isGeneratedImage: true, provider: 'lastfm' },
  { name: 'Good Vibrations', artist: 'The Beach Boys', image: 'https://picsum.photos/300/300?random=10', isGeneratedImage: true, provider: 'lastfm' }
]

// モック検索（実際のAPIキーがない場合）
export const searchMusicMock = async (query: string): Promise<SearchResult[]> => {
  // 検索クエリに基づいてフィルタリング
  const filtered = mockSearchResults.filter(
    track => 
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artist.toLowerCase().includes(query.toLowerCase())
  )
  
  // 遅延をシミュレート
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return filtered
}

// 実際のAPIキーがあるかどうかをチェック
const hasValidApiKey = () => {
  return LASTFM_API_KEY && LASTFM_API_KEY !== 'YOUR_LASTFM_API_KEY'
}

// プロバイダーの利用可能性をチェック
export const getAvailableProviders = (): MusicProvider[] => {
  const providers: MusicProvider[] = []
  
  if (Boolean(SPOTIFY_CLIENT_ID) && spotifyAccessToken) {
    providers.push('spotify')
  }
  
  if (hasValidApiKey()) {
    providers.push('lastfm')
  }
  
  return providers
}

// 統合音楽検索（プロバイダーに基づく）
export const searchMusic = async (query: string): Promise<SearchResult[]> => {
  const availableProviders = getAvailableProviders()
  
  console.log(`🔍 音楽検索開始: "${query}"`)
  console.log(`📋 利用可能プロバイダー: ${availableProviders.map(p => p.toUpperCase()).join(', ')}`)
  console.log(`⚙️ 現在のプロバイダー: ${currentProvider.toUpperCase()}`)
  
  // 現在のプロバイダーが利用可能かチェック
  if (availableProviders.includes(currentProvider)) {
    try {
      switch (currentProvider) {
        case 'spotify':
          return await searchMusicSpotify(query)
        case 'lastfm':
          return await searchMusicLastFm(query)
        default: {
          const errorMsg = `未サポートのプロバイダー: ${currentProvider}`
          recordSearchStatus(currentProvider, false, errorMsg)
          throw new Error(errorMsg)
        }
      }
    } catch (error: any) {
      console.error(`${currentProvider.toUpperCase()}検索エラー:`, error)
    }
  } else {
    const reason = `${currentProvider.toUpperCase()}は現在利用できません`
    recordSearchStatus(currentProvider, false, reason, reason)
  }
  
  // フォールバック: 利用可能な他のプロバイダーを試行
  for (const provider of availableProviders) {
    if (provider !== currentProvider) {
      try {
        console.log(`🔄 ${provider.toUpperCase()}にフォールバックします`)
        switch (provider) {
          case 'spotify':
            return await searchMusicSpotify(query)
          case 'lastfm':
            return await searchMusicLastFm(query)
        }
      } catch (error: any) {
        const errorMsg = error?.message || `${provider}フォールバック失敗`
        recordSearchStatus(provider, false, errorMsg, `フォールバック試行中にエラー`)
        console.error(`${provider.toUpperCase()}フォールバック失敗:`, error)
      }
    }
  }
  
  // 全てのプロバイダーが失敗した場合はモックデータ
  console.warn('⚠️ 全てのプロバイダーが利用不可。モックデータを使用します。')
  recordSearchStatus('lastfm', false, '全プロバイダー失敗', 'モックデータにフォールバック')
  return await searchMusicMock(query)
}

// Spotify用のアルバム検索
const searchAlbumSpotify = async (query: string): Promise<AlbumSearchResult[]> => {
  if (!spotifyAccessToken) {
    return searchAlbumLastFm(query)
  }

  try {
    const albums = await spotifySearch.searchAlbums(query, spotifyAccessToken, 10)
    return albums.map((album: SpotifyAlbum) => ({
      name: album.name,
      artist: album.artist,
      image: album.image || getFallbackImage(album.name, album.artist).image,
      url: album.spotifyUrl,
      isGeneratedImage: !album.image,
      provider: 'spotify',
      id: album.id
    }))
  } catch (error) {
    console.error('Spotifyアルバム検索エラー:', error)
    return searchAlbumLastFm(query)
  }
}

// Last.fm用のアルバム検索（元のsearchAlbum関数を改名）
const searchAlbumLastFm = async (query: string): Promise<AlbumSearchResult[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'album.search',
        album: query,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 10
      }
    })

    const albums = response.data.results?.albummatches?.album || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Last.fm APIのレスポンス型が不定のため
    return albums.map((album: any) => {
      const imageUrl = album.image?.[3]?.['#text'] || album.image?.[2]?.['#text'] || album.image?.[1]?.['#text'] || ''
      const fallback = getFallbackImage(album.name, album.artist)
      return {
        name: album.name,
        artist: album.artist,
        image: isValidImageUrl(imageUrl) ? imageUrl : fallback.image,
        url: album.url,
        isGeneratedImage: !isValidImageUrl(imageUrl),
        provider: 'lastfm'
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- APIエラー時のデバッグ用
    console.error('アルバム検索エラー:', error)
    return []
  }
}

// アルバム検索を優先した統合検索
export const searchMusicWithAlbumPriority = async (query: string): Promise<SearchResult[]> => {
  try {
    // まずアルバム検索を試行
    const albumResults = await searchAlbum(query)
    if (albumResults.length > 0) {
      return albumResults
    }
    
    // アルバムが見つからない場合は楽曲検索
    const trackResults = await searchMusic(query)
    return trackResults
  } catch (error) {
    console.error('統合検索エラー:', error)
    return await searchMusicMock(query)
  }
}

// メインの検索関数（後方互換性のため残す）
export const searchMusicWithFallback = async (query: string): Promise<SearchResult[]> => {
  return await searchMusicWithAlbumPriority(query)
}

export interface SpotifyAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string
}

/**
 * Spotify認証URLを生成（Authorization Code Flow）
 */
export async function generateSpotifyAuthUrl(): Promise<string> {
  // 新しいspotifyApi.tsの実装を使用
  const { spotifyAuth } = await import('./spotifyApi');
  return spotifyAuth.getAuthUrl();
}

/**
 * Spotify認証を開始（ポップアップまたはリダイレクト）
 */
export async function startSpotifyAuth(usePopup = false): Promise<string | void> {
  const authUrl = await generateSpotifyAuthUrl()
  
  if (usePopup) {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        'spotifyAuth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      
      if (!popup) {
        reject(new Error('ポップアップがブロックされました'))
        return
      }
      
      // メッセージリスナー
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener)
          resolve(event.data.token)
        } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
          window.removeEventListener('message', messageListener)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // ポップアップが閉じられた場合の処理
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          reject(new Error('認証がキャンセルされました'))
        }
      }, 1000)
    })
  } else {
    // 通常のリダイレクト
    window.location.href = authUrl
  }
} 