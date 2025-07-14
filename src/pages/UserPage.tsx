import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import usersData from '../../data/users.json'
import MusicPlayer from '../components/MusicPlayer'
import YouTubePlayer from '../components/YouTubePlayer'
import ShareProfile from '../components/ShareProfile'
import MusicStats from '../components/MusicStats'
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
  const [showStats, setShowStats] = useState(false)
  const [showShare, setShowShare] = useState(false)

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
        
        // ビューカウントを増加
        await storageService.incrementViewCount(username)
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

  const theme = userProfile.themeColor || THEME_COLORS[0]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 背景グラデーション */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-20`}></div>
      
      <div className="relative z-10">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6">
          <Link 
            to="/"
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showStats 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              統計
            </button>
            <button
              onClick={() => setShowShare(!showShare)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showShare 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              共有
            </button>
          </div>
        </div>

        {/* 統計とシェア */}
        {(showStats || showShare) && (
          <div className="px-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {showStats && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <MusicStats songs={userProfile.songs} />
                </div>
              )}
              {showShare && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <ShareProfile 
                    username={userProfile.username}
                    displayName={userProfile.displayName}
                    bio={userProfile.bio}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          {/* 中央のプロフィールアイコン */}
          <div className="mb-8">
            {userProfile.icon ? (
              <img 
                src={userProfile.icon} 
                alt={`${userProfile.displayName}のアイコン`}
                className="w-48 h-48 rounded-full object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-6xl font-bold shadow-2xl border-4 border-white/30`}>
                {userProfile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* ユーザー名とプロフィール情報 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">{userProfile.displayName}</h1>
            {userProfile.bio && (
              <p className="text-white/80 text-lg mb-4">{userProfile.bio}</p>
            )}
            <div className="flex items-center justify-center gap-6 text-white/60">
              <span>🎵 {userProfile.songs.length}曲</span>
              {userProfile.viewCount > 0 && <span>👁️ {userProfile.viewCount}回閲覧</span>}
              {userProfile.location && <span>📍 {userProfile.location}</span>}
            </div>
          </div>

          {/* 楽曲ジャケット配置 */}
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
              {userProfile.songs.map((song, index) => (
                <div
                  key={index}
                  onClick={() => handleSongClick(song)}
                  className={`relative cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl group ${
                    loadingPreview ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={song.jacket}
                      alt={`${song.title} - ${song.artist}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 object-cover rounded-lg shadow-lg"
                    />
                    {/* ホバー時の再生ボタン */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 rounded-full p-2 sm:p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* ホバー時の楽曲情報 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-80 transition-all duration-300 rounded-b-lg p-2 transform translate-y-full group-hover:translate-y-0">
                    <p className="text-white text-xs font-medium truncate">{song.title}</p>
                    <p className="text-white/80 text-xs truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SNSリンク */}
          {Object.keys(userProfile.socialLinks).length > 0 && (
            <div className="flex gap-4 mt-12">
              {userProfile.socialLinks.twitter && (
                <a
                  href={userProfile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              )}
              {userProfile.socialLinks.instagram && (
                <a
                  href={userProfile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {userProfile.socialLinks.spotify && (
                <a
                  href={userProfile.socialLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* 楽曲プレイヤー */}
        {showPlayer && selectedSong && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
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