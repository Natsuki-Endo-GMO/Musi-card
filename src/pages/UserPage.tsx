import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import usersData from '../../data/users.json'
import MusicPlayer from '../components/MusicPlayer'
import YouTubePlayer from '../components/YouTubePlayer'
import { spotifySearch } from '../services/spotifyApi'
import { youtubeSearch } from '../services/youtubeApi'
import { UserProfile, Song, THEME_COLORS } from '../types/user'
import { storageService } from '../services/storageService'

export default function UserPage() {
  const { username } = useParams<{ username: string }>()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    if (username) {
      loadUserData(username)
    }
  }, [username])

  const loadUserData = async (username: string) => {
    try {
      // 新しいストレージサービスを使用（フォールバック付き）
      const userData = await storageService.loadUser(username)
      
      if (userData) {
        setUserProfile(userData)
        console.log(`✅ ユーザー「${username}」のデータを読み込みました`)
      } else {
        console.log(`⚠️ ユーザー「${username}」のデータが見つかりません`)
        
        // users.jsonからのフォールバック
        const staticUserSongs = usersData[username as keyof typeof usersData]
        if (staticUserSongs) {
          const fallbackProfile: UserProfile = {
            username,
            displayName: username,
            bio: '',
            themeColor: THEME_COLORS[0],
            socialLinks: {},
            favoriteGenres: [],
            songs: staticUserSongs.map(song => ({
              ...song,
              id: `${song.title}-${song.artist}`.replace(/\s+/g, '-').toLowerCase(),
              previewUrl: null,
              addedAt: new Date().toISOString()
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: 0,
            isPublic: true
          }
          setUserProfile(fallbackProfile)
          console.log(`📄 users.jsonからフォールバックデータを使用: ${username}`)
        }
      }
    } catch (error) {
      console.error(`❌ ユーザーデータの読み込みに失敗: ${username}`, error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSpotifyPreview = async (song: Song): Promise<Song> => {
    try {
      const token = localStorage.getItem('spotify_access_token')
      if (!token) {
        console.log('Spotifyトークンがありません。検索をスキップします。')
        return song
      }
      
      const results = await spotifySearch.searchTracksAdvanced(song.title, song.artist, token)
      if (results.length > 0) {
        const track = results[0]
        return {
          ...song,
          spotify: {
            id: track.id,
            previewUrl: track.previewUrl,
            spotifyUrl: track.spotifyUrl
          }
        }
      }
    } catch (error) {
      console.error('Spotify検索エラー:', error)
    }
    return song
  }

  const fetchYouTubePreview = async (song: Song): Promise<Song> => {
    try {
      const results = await youtubeSearch.searchMusic(`${song.title} ${song.artist}`)
      if (results.length > 0) {
        const video = results[0]
        return {
          ...song,
          youtube: {
            videoId: video.videoId,
            title: video.title,
            channelTitle: video.channelTitle,
            embedUrl: video.embedUrl
          }
        }
      }
    } catch (error) {
      console.error('YouTube検索エラー:', error)
    }
    return song
  }

  const fetchPreviewFromMultipleSources = async (song: Song): Promise<Song> => {
    let updatedSong = song
    
    // Spotify情報を取得
    if (!song.spotify) {
      updatedSong = await fetchSpotifyPreview(updatedSong)
    }
    
    // YouTube情報を取得
    if (!song.youtube) {
      updatedSong = await fetchYouTubePreview(updatedSong)
    }
    
    return updatedSong
  }

  const handleSongClick = async (song: Song) => {
    if (loadingPreview) return
    
    setLoadingPreview(true)
    try {
      const updatedSong = await fetchPreviewFromMultipleSources(song)
      setSelectedSong(updatedSong)
      setShowPlayer(true)
    } catch (error) {
      console.error('楽曲プレビューの取得に失敗しました:', error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const closePlayer = () => {
    setShowPlayer(false)
    setSelectedSong(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!userProfile || !userProfile.songs || userProfile.songs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ユーザーが見つかりません</h1>
          <p className="text-gray-600 mb-6">
            お探しのユーザー「{username}」は存在しないか、楽曲が登録されていません。
          </p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
        </div>

        {/* ユーザー情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{userProfile.displayName}の音楽名刺</h1>
          <p className="text-gray-600">お気に入りの楽曲 ({userProfile.songs.length}曲)</p>
        </div>

        {/* 楽曲リスト */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userProfile.songs.map((song, index) => (
              <div
                key={index}
                onClick={() => handleSongClick(song)}
                className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                  loadingPreview ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="relative mb-4">
                  <img
                    src={song.jacket}
                    alt={`${song.title} - ${song.artist}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-3 transform scale-0 hover:scale-100 transition-transform duration-300">
                      <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{song.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">{song.artist}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {song.genre && <span className="bg-gray-100 px-2 py-1 rounded">{song.genre}</span>}
                    {song.releaseYear && <span>{song.releaseYear}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 楽曲プレイヤー */}
        {showPlayer && selectedSong && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">楽曲プレイヤー</h3>
                <button
                  onClick={closePlayer}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center mb-6">
                <img
                  src={selectedSong.jacket}
                  alt={`${selectedSong.title} - ${selectedSong.artist}`}
                  className="w-40 h-40 mx-auto rounded-lg shadow-lg mb-4"
                />
                <h4 className="text-lg font-semibold text-gray-800">{selectedSong.title}</h4>
                <p className="text-gray-600">{selectedSong.artist}</p>
              </div>
              
              {selectedSong.spotify && (
                <div className="mb-4">
                  <MusicPlayer
                    previewUrl={selectedSong.spotify.previewUrl}
                    title={selectedSong.title}
                    artist={selectedSong.artist}
                    coverImage={selectedSong.jacket || '/default-cover.jpg'}
                  />
                </div>
              )}
              
              {selectedSong.youtube && (
                <div className="mb-4">
                  <YouTubePlayer
                    videoId={selectedSong.youtube.videoId}
                    title={selectedSong.youtube.title}
                    artist={selectedSong.artist}
                    coverImage={selectedSong.jacket || '/default-cover.jpg'}
                  />
                </div>
              )}
              
              {!selectedSong.spotify && !selectedSong.youtube && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>プレビューが見つかりませんでした</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 