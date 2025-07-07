import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import usersData from '../../data/users.json'

interface Song {
  title: string
  artist: string
  jacket: string
}

export default function UserPage() {
  const { username } = useParams<{ username: string }>()
  const [songs, setSongs] = useState<Song[]>([])
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
          setSongs(users[username])
          setLoading(false)
          return
        }
      }

      // ローカルストレージにない場合はサンプルデータから検索
      if (usersData[username as keyof typeof usersData]) {
        setSongs(usersData[username as keyof typeof usersData])
      } else {
        setSongs([])
      }
    } catch (error) {
      console.error('ユーザーデータの読み込みに失敗しました:', error)
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!username || songs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">ユーザーが見つかりません</h1>
          <p className="text-slate-400 mb-8">指定されたユーザーは存在しないか、まだ楽曲を登録していません。</p>
          <Link 
            to="/"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-slate-900/80 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-300 group"
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
          <h1 className="text-5xl font-bold text-white mb-4">
            {username}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              の音楽名刺
            </span>
          </h1>
          <p className="text-slate-300 text-lg">
            私の好きな音楽をシェアします
          </p>
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {songs.map((song, idx) => (
            <div
              key={idx}
              className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 hover:bg-slate-700/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-slate-700/50"
            >
              {/* Album Cover */}
              <div className="relative aspect-square mb-4 rounded-xl overflow-hidden">
                <img 
                  src={song.jacket} 
                  alt={`${song.title} by ${song.artist}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
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
                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                  {song.title}
                </h3>
                <p className="text-slate-400 text-xs font-medium">
                  {song.artist}
                </p>
              </div>

              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-400 text-sm">
            Powered by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">
              MusicMEisi
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