import axios from 'axios'
import { spotifySearch, SpotifyTrack, SpotifyAlbum } from './spotifyApi'

// 音楽API プロバイダー設定
export type MusicProvider = 'lastfm' | 'spotify'

// 設定可能なAPI プロバイダー（デフォルトはSpotify）
let currentProvider: MusicProvider = 'spotify'

// プロバイダー切り替え関数
export const setMusicProvider = (provider: MusicProvider) => {
  currentProvider = provider
  console.log(`音楽検索プロバイダーを ${provider} に切り替えました`)
}

export const getCurrentProvider = (): MusicProvider => currentProvider

// Last.fm API設定
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'YOUR_LASTFM_API_KEY'
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

// Spotify API設定
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const hasSpotifyConfig = Boolean(SPOTIFY_CLIENT_ID)

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
    if (hasSpotifyConfig) {
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
  console.log('Spotify アクセストークンを削除しました')
}

// Spotify検索関数
const searchMusicSpotify = async (query: string): Promise<SearchResult[]> => {
  if (!spotifyAccessToken) {
    console.warn('Spotify アクセストークンが設定されていません。Last.fmにフォールバックします。')
    return searchMusicLastFm(query)
  }

  try {
    // まずアルバム検索を試行
    const albums = await spotifySearch.searchAlbums(query, spotifyAccessToken, 5)
    const tracks = await spotifySearch.searchTracks(query, spotifyAccessToken, 5)

    const results: SearchResult[] = []

    // アルバム結果を追加
    albums.forEach((album: SpotifyAlbum) => {
      results.push({
        name: album.name,
        artist: album.artist,
        image: album.image || undefined,
        url: album.spotifyUrl,
        isGeneratedImage: !album.image,
        provider: 'spotify',
        id: album.id
      })
    })

    // トラック結果を追加
    tracks.forEach((track: SpotifyTrack) => {
      results.push({
        name: track.name,
        artist: track.artist,
        image: track.image || undefined,
        url: track.spotifyUrl,
        isGeneratedImage: !track.image,
        provider: 'spotify',
        id: track.id
      })
    })

    return results.slice(0, 10) // 最大10件に制限
  } catch (error) {
    console.error('Spotify検索エラー:', error)
    console.log('Last.fmにフォールバックします')
    return searchMusicLastFm(query)
  }
}

// Last.fm APIを使用した音楽検索（元のsearchMusic関数を改名）
const searchMusicLastFm = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: 'track.search',
        track: query,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 10
      }
    })

    const tracks = response.data.results?.trackmatches?.track || []
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
        provider: 'lastfm'
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- APIエラー時のデバッグ用
    console.error('音楽検索エラー:', error)
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
  
  if (hasSpotifyConfig && spotifyAccessToken) {
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
  
  // 現在のプロバイダーが利用可能かチェック
  if (availableProviders.includes(currentProvider)) {
    try {
      switch (currentProvider) {
        case 'spotify':
          return await searchMusicSpotify(query)
        case 'lastfm':
          return await searchMusicLastFm(query)
        default:
          throw new Error(`未サポートのプロバイダー: ${currentProvider}`)
      }
    } catch (error) {
      console.error(`${currentProvider}検索エラー:`, error)
    }
  }
  
  // フォールバック: 利用可能な他のプロバイダーを試行
  for (const provider of availableProviders) {
    if (provider !== currentProvider) {
      try {
        console.log(`${provider}にフォールバックします`)
        switch (provider) {
          case 'spotify':
            return await searchMusicSpotify(query)
          case 'lastfm':
            return await searchMusicLastFm(query)
        }
      } catch (error) {
        console.error(`${provider}フォールバック失敗:`, error)
      }
    }
  }
  
  // 全てのプロバイダーが失敗した場合はモックデータ
  console.log('全てのプロバイダーが利用不可。モックデータを使用します。')
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