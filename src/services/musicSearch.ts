import axios from 'axios'

// Last.fm API設定
const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || 'YOUR_LASTFM_API_KEY'
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export interface SearchResult {
  name: string
  artist: string
  image?: string
  url?: string
}

export interface AlbumSearchResult {
  name: string
  artist: string
  image: string
  url: string
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
    return tracks.map((track: any) => ({
      name: track.name,
      artist: track.artist,
      image: track.image?.[2]?.['#text'] || '',
      url: track.url
    }))
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
    return albums.map((album: any) => ({
      name: album.name,
      artist: album.artist,
      image: album.image?.[2]?.['#text'] || '',
      url: album.url
    }))
  } catch (error) {
    // eslint-disable-next-line no-console -- APIエラー時のデバッグ用
    console.error('アルバム検索エラー:', error)
    return []
  }
}

// モックデータ（APIキーがない場合のフォールバック）
const mockSearchResults: SearchResult[] = [
  { name: 'Bohemian Rhapsody', artist: 'Queen', image: 'https://picsum.photos/300/300?random=1' },
  { name: 'Hotel California', artist: 'Eagles', image: 'https://picsum.photos/300/300?random=2' },
  { name: 'Imagine', artist: 'John Lennon', image: 'https://picsum.photos/300/300?random=3' },
  { name: 'Stairway to Heaven', artist: 'Led Zeppelin', image: 'https://picsum.photos/300/300?random=4' },
  { name: 'Yesterday', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=5' },
  { name: 'Smells Like Teen Spirit', artist: 'Nirvana', image: 'https://picsum.photos/300/300?random=6' },
  { name: 'Like a Rolling Stone', artist: 'Bob Dylan', image: 'https://picsum.photos/300/300?random=7' },
  { name: 'I Want to Hold Your Hand', artist: 'The Beatles', image: 'https://picsum.photos/300/300?random=8' },
  { name: 'Johnny B. Goode', artist: 'Chuck Berry', image: 'https://picsum.photos/300/300?random=9' },
  { name: 'Good Vibrations', artist: 'The Beach Boys', image: 'https://picsum.photos/300/300?random=10' }
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

// メインの検索関数
export const searchMusicWithFallback = async (query: string): Promise<SearchResult[]> => {
  if (hasValidApiKey()) {
    return await searchMusic(query)
  } else {
    return await searchMusicMock(query)
  }
} 