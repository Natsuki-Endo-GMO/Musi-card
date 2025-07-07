import axios from 'axios'

// Last.fm API設定
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'YOUR_LASTFM_API_KEY'
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export interface SearchResult {
  name: string
  artist: string
  image?: string
  url?: string
  isGeneratedImage?: boolean
}

export interface AlbumSearchResult {
  name: string
  artist: string
  image: string
  url: string
  isGeneratedImage?: boolean
}

// 画像URLが有効かどうかをチェックする関数
const isValidImageUrl = (url: string): boolean => {
  return Boolean(url && url.trim() !== '' && !url.includes('2a96cbd8b46e442fc41c2b86b821562f'))
}

// Last.fm APIを使用した音楽検索
export const searchMusic = async (query: string): Promise<SearchResult[]> => {
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
        isGeneratedImage: !isValidImageUrl(imageUrl)
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
        isGeneratedImage: !isValidImageUrl(imageUrl)
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- APIエラー時のデバッグ用
    console.error('アルバム検索エラー:', error)
    return []
  }
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
  { name: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://picsum.photos/300/300?random=1', isGeneratedImage: true },
  { name: 'Hotel California', artist: 'Eagles', image: 'https://picsum.photos/300/300?random=2', isGeneratedImage: true },
  { name: 'Imagine', artist: 'John Lennon', image: 'https://picsum.photos/300/300?random=3', isGeneratedImage: true },
  { name: 'Stairway to Heaven', artist: 'Led Zeppelin', image: 'https://picsum.photos/300/300?random=4', isGeneratedImage: true },
  { name: 'Yesterday', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=5', isGeneratedImage: true },
  { name: 'Smells Like Teen Spirit', artist: 'Nirvana', image: 'https://picsum.photos/300/300?random=6', isGeneratedImage: true },
  { name: 'Like a Rolling Stone', artist: 'Bob Dylan', image: 'https://picsum.photos/300/300?random=7', isGeneratedImage: true },
  { name: 'I Want to Hold Your Hand', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=8', isGeneratedImage: true },
  { name: 'Johnny B. Goode', artist: 'Chuck Berry', image: 'https://picsum.photos/300/300?random=9', isGeneratedImage: true },
  { name: 'Good Vibrations', artist: 'The Beach Boys', image: 'https://picsum.photos/300/300?random=10', isGeneratedImage: true }
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

// アルバム検索を優先した統合検索
export const searchMusicWithAlbumPriority = async (query: string): Promise<SearchResult[]> => {
  if (hasValidApiKey()) {
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
      // eslint-disable-next-line no-console -- APIエラー時のデバッグ用
      console.error('統合検索エラー:', error)
      return await searchMusicMock(query)
    }
  } else {
    return await searchMusicMock(query)
  }
}

// メインの検索関数（後方互換性のため残す）
export const searchMusicWithFallback = async (query: string): Promise<SearchResult[]> => {
  return await searchMusicWithAlbumPriority(query)
} 