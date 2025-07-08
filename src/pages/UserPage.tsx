import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import usersData from '../../data/users.json'
import MusicPlayer from '../components/MusicPlayer'
import YouTubePlayer from '../components/YouTubePlayer'
import { spotifySearch, SpotifyTrack } from '../services/spotifyApi'
import { youtubeSearch, YouTubeTrack } from '../services/youtubeApi'

interface Song {
  title: string
  artist: string
  jacket: string
  isGeneratedImage?: boolean
  spotify?: {
    id: string
    previewUrl: string | null
    spotifyUrl: string
  }
  youtube?: {
    videoId: string
    title: string
    channelTitle: string
    embedUrl: string
  }
}

interface ThemeColor {
  id: string
  name: string
  gradient: string
  primary: string
  secondary: string
}

interface UserData {
  icon?: string
  themeColor?: ThemeColor
  songs: Song[]
}

// デフォルトテーマカラー
const DEFAULT_THEME: ThemeColor = {
  id: 'blue',
  name: 'ブルー',
  gradient: 'from-blue-500 to-blue-600',
  primary: 'blue-500',
  secondary: 'blue-100'
}

export default function UserPage() {
  const { username } = useParams<{ username: string }>()
  const [userData, setUserData] = useState<UserData>({ songs: [] })
  const [loading, setLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    if (username) {
      loadUserData(username)
    }
  }, [username])

  const loadUserData = (username: string) => {
    try {
      // まずローカルストレージから検索
      const storedData = localStorage.getItem('musicmeisi_users')
      if (storedData) {
        const users = JSON.parse(storedData)
        if (users[username]) {
          // 新しいデータ構造に対応
          if (typeof users[username] === 'object' && users[username].songs) {
            setUserData({
              ...users[username],
              themeColor: users[username].themeColor || DEFAULT_THEME
            })
          } else {
            // 古いデータ構造（後方互換性）
            setUserData({ 
              songs: users[username],
              themeColor: DEFAULT_THEME
            })
          }
          setLoading(false)
          return
        }
      }

      // ローカルストレージにない場合はサンプルデータから検索
      if (usersData[username as keyof typeof usersData]) {
        setUserData({ 
          songs: usersData[username as keyof typeof usersData],
          themeColor: DEFAULT_THEME
        })
      } else {
        setUserData({ 
          songs: [],
          themeColor: DEFAULT_THEME
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- ユーザーデータ読込失敗時のデバッグ用
      console.error('ユーザーデータの読み込みに失敗しました:', error)
      setUserData({ 
        songs: [],
        themeColor: DEFAULT_THEME
      })
    } finally {
      setLoading(false)
    }
  }

  // Spotifyからプレビュー情報を取得
  const fetchSpotifyPreview = async (song: Song): Promise<Song> => {
    // すでにSpotify情報がある場合はそのまま返す
    if (song.spotify?.previewUrl) {
      console.log(`✅ キャッシュからプレビューURL取得: ${song.title} - ${song.artist}`)
      return song
    }

    try {
      // localStorage からアクセストークンを取得
      const accessToken = localStorage.getItem('spotify_access_token')
      if (!accessToken) {
        console.error('❌ Spotify認証が必要です - アクセストークンが見つかりません')
        throw new Error('Spotify認証が必要です')
      }

      console.log(`🔍 Spotify検索開始: "${song.title}" by "${song.artist}"`)

      // Spotify APIで楽曲を検索
      const searchResults = await spotifySearch.searchTracksAdvanced(
        song.title,
        song.artist,
        accessToken,
        1
      )

      console.log(`📊 Spotify検索結果:`, {
        query: `${song.title} - ${song.artist}`,
        resultCount: searchResults.length,
        results: searchResults.map((track: SpotifyTrack) => ({
          name: track.name,
          artist: track.artist,
          hasPreview: !!track.previewUrl,
          previewUrl: track.previewUrl
        }))
      })

      if (searchResults.length > 0) {
        const spotifyTrack = searchResults[0]
        
        if (spotifyTrack.previewUrl) {
          console.log(`✅ プレビューURL取得成功: ${spotifyTrack.previewUrl}`)
        } else {
          console.warn(`⚠️ プレビューURL未提供: "${spotifyTrack.name}" by "${spotifyTrack.artist}"`)
          console.warn(`💡 理由: この楽曲はSpotifyプレビューに対応していません（プレミアム限定、地域制限、またはアーティストの設定による）`)
        }

        return {
          ...song,
          spotify: {
            id: spotifyTrack.id,
            previewUrl: spotifyTrack.previewUrl,
            spotifyUrl: spotifyTrack.spotifyUrl
          }
        }
      } else {
        console.warn(`⚠️ Spotify検索結果なし: "${song.title}" - "${song.artist}"`)
        console.warn(`💡 理由: 楽曲がSpotifyに存在しないか、検索クエリが一致しません`)
        
        // 検索結果がない場合
        return {
          ...song,
          spotify: {
            id: '',
            previewUrl: null,
            spotifyUrl: ''
          }
        }
      }
    } catch (error) {
      console.error(`❌ Spotify検索エラー: "${song.title}" - "${song.artist}"`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          console.error('💡 認証エラー: Spotifyアクセストークンが無効または期限切れです')
        } else if (error.message.includes('403')) {
          console.error('💡 権限エラー: Spotify APIの利用制限に達している可能性があります')
        } else if (error.message.includes('429')) {
          console.error('💡 レート制限: Spotify APIのリクエスト制限に達しました。しばらく待ってから再試行してください')
        }
      }
      
      return {
        ...song,
        spotify: {
          id: '',
          previewUrl: null,
          spotifyUrl: ''
        }
      }
    }
  }

  // 複数ソースから試聴情報を取得
  const fetchPreviewFromMultipleSources = async (song: Song): Promise<Song> => {
    console.log(`🎵 マルチソース検索開始: "${song.title}" by "${song.artist}"`)
    
    let updatedSong = { ...song }

    // 1. Spotifyから試聴情報を取得
    try {
      updatedSong = await fetchSpotifyPreview(updatedSong)
      if (updatedSong.spotify?.previewUrl) {
        console.log(`✅ Spotify試聴成功: プレビューURL取得`)
        return updatedSong
      } else {
        console.log(`⚠️ Spotify試聴不可: YouTubeにフォールバック`)
      }
    } catch (error) {
      console.warn(`❌ Spotify検索失敗: YouTubeにフォールバック`, error)
    }

    // 2. YouTubeから試聴情報を取得
    try {
      if (!updatedSong.youtube?.videoId) {
        console.log(`🔍 YouTube検索開始: "${song.title}" by "${song.artist}"`)
        
        const youtubeResults = await youtubeSearch.searchTrackByArtist(
          song.title,
          song.artist,
          3
        )

        if (youtubeResults.length > 0) {
          const bestMatch = youtubeResults[0]
          console.log(`✅ YouTube検索成功:`, {
            title: bestMatch.title,
            channel: bestMatch.channelTitle,
            videoId: bestMatch.videoId,
            score: (bestMatch as any).score
          })

          updatedSong.youtube = {
            videoId: bestMatch.videoId,
            title: bestMatch.title,
            channelTitle: bestMatch.channelTitle,
            embedUrl: bestMatch.embedUrl
          }
        } else {
          console.warn(`⚠️ YouTube検索結果なし: "${song.title}" - "${song.artist}"`)
        }
      }
    } catch (error) {
      console.error(`❌ YouTube検索エラー: "${song.title}" - "${song.artist}"`, error)
    }

    // 試聴可能性を確認
    const hasSpotify = !!updatedSong.spotify?.previewUrl
    const hasYouTube = !!updatedSong.youtube?.videoId
    
    console.log(`📊 試聴可能性チェック:`, {
      song: `${song.title} - ${song.artist}`,
      spotify: hasSpotify,
      youtube: hasYouTube,
      totalSources: (hasSpotify ? 1 : 0) + (hasYouTube ? 1 : 0)
    })

    return updatedSong
  }

  // 楽曲をクリックした時の処理
  const handleSongClick = async (song: Song) => {
    console.log(`🎵 楽曲クリック: "${song.title}" by "${song.artist}"`)
    setLoadingPreview(true)
    
    try {
      const songWithPreview = await fetchPreviewFromMultipleSources(song)
      
      if (songWithPreview.spotify?.previewUrl || songWithPreview.youtube?.videoId) {
        console.log(`🎧 プレイヤー起動: プレビューURL利用可能`)
      } else {
        console.warn(`🚫 プレイヤー起動: プレビューURL未提供（試聴不可）`)
      }
      
      setSelectedSong(songWithPreview)
      setShowPlayer(true)
    } catch (error) {
      console.error('❌ プレビュー取得エラー:', error)
      setSelectedSong(song)
      setShowPlayer(true)
    } finally {
      setLoadingPreview(false)
    }
  }

  // プレイヤーを閉じる
  const closePlayer = () => {
    setShowPlayer(false)
    setSelectedSong(null)
  }

  const theme = userData.themeColor || DEFAULT_THEME

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!username || userData.songs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">ユーザーが見つかりません</h1>
          <p className="text-blue-600 mb-8">指定されたユーザーは存在しないか、まだ楽曲を登録していません。</p>
          <Link 
            to="/"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-blue-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300 group"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">トップに戻る</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {/* ユーザーアイコン */}
          <div className="flex justify-center mb-6">
            {userData.icon ? (
              <img
                src={userData.icon}
                alt={`${username}のアイコン`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center border-4 border-white shadow-lg`}>
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            {username}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
              の音楽名刺
            </span>
          </h1>
          <p className="text-blue-600 text-lg">
            私の好きな音楽をシェアします
          </p>
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {userData.songs.map((song: Song, idx: number) => (
            <div
              key={idx}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-blue-200/50 shadow-lg cursor-pointer"
              onClick={() => handleSongClick(song)}
            >
              {/* Album Cover */}
              <div className="relative aspect-square mb-4 rounded-xl overflow-hidden">
                <img 
                  src={song.jacket} 
                  alt={`${song.title} by ${song.artist}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* 生成画像のインジケーター */}
                {song.isGeneratedImage && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    AI生成
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {loadingPreview ? (
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div className="space-y-2">
                <h3 className="text-blue-900 font-semibold text-sm leading-tight line-clamp-2">
                  {song.title}
                </h3>
                <p className="text-blue-600 text-xs font-medium">
                  {song.artist}
                </p>
              </div>

              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`}></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-blue-600 text-sm">
            Powered by{' '}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient} font-semibold`}>
              MusiCard
            </span>
          </p>
        </div>
      </div>

      {/* 音楽プレイヤーモーダル */}
      {showPlayer && selectedSong && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            {/* 閉じるボタン */}
            <button
              onClick={closePlayer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* プレイヤー選択 */}
            {selectedSong.spotify?.previewUrl ? (
              // Spotifyプレイヤー（優先）
              <MusicPlayer
                title={selectedSong.title}
                artist={selectedSong.artist}
                coverImage={selectedSong.jacket}
                previewUrl={selectedSong.spotify.previewUrl}
                onError={(error) => {
                  console.error(`❌ Spotifyプレイヤーエラー: "${selectedSong.title}" - "${selectedSong.artist}"`)
                  console.error(`📝 エラー詳細: ${error}`)
                }}
              />
            ) : selectedSong.youtube?.videoId ? (
              // YouTubeプレイヤー（フォールバック）
              <YouTubePlayer
                title={selectedSong.title}
                artist={selectedSong.artist}
                videoId={selectedSong.youtube.videoId}
                coverImage={selectedSong.jacket}
                onError={(error) => {
                  console.error(`❌ YouTubeプレイヤーエラー: "${selectedSong.title}" - "${selectedSong.artist}"`)
                  console.error(`📝 エラー詳細: ${error}`)
                }}
              />
            ) : (
              // 試聴不可表示
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 1.414L15.657 9.17l1.414 1.414a1 1 0 11-1.414 1.414L14.243 10.584l-1.414 1.414a1 1 0 11-1.414-1.414L12.829 9.17l-1.414-1.414a1 1 0 111.414-1.414L14.243 7.756l1.414-1.413z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedSong.title}</h3>
                <p className="text-gray-600 mb-4">{selectedSong.artist}</p>
                <p className="text-sm text-gray-500 mb-4">
                  この楽曲の試聴音源が見つかりませんでした
                </p>
                <p className="text-xs text-gray-400">
                  Spotify・YouTube共に試聴できない楽曲です
                </p>
              </div>
            )}

            {/* 外部リンクボタン */}
            <div className="mt-4 flex gap-2 justify-center">
              {selectedSong.spotify?.spotifyUrl && (
                <a
                  href={selectedSong.spotify.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.959-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.361 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.48.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify
                </a>
              )}
              
              {selectedSong.youtube?.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${selectedSong.youtube.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
} 