import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import usersData from '../../data/users.json'

interface Song {
  title: string
  artist: string
  jacket: string
  isGeneratedImage?: boolean
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
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-blue-200/50 shadow-lg"
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
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
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