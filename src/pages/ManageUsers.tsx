import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface Song {
  title: string
  artist: string
  jacket: string
}

interface UserData {
  [username: string]: Song[]
}

export default function ManageUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    try {
      const storedData = localStorage.getItem('musicmeisi_users')
      if (storedData) {
        setUsers(JSON.parse(storedData))
      }
    } catch (error) {
      // eslint-disable-next-line no-console -- ユーザーデータ読込失敗時のデバッグ用
      console.error('ユーザーデータの読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = (username: string) => {
    if (confirm(`${username}の名刺を削除しますか？`)) {
      try {
        const newUsers = { ...users }
        delete newUsers[username]
        localStorage.setItem('musicmeisi_users', JSON.stringify(newUsers))
        setUsers(newUsers)
        alert('削除されました')
      } catch (error) {
        alert('削除に失敗しました')
      }
    }
  }

  const editUser = (username: string) => {
    navigate(`/edit/${username}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  const userEntries = Object.entries(users)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-slate-900/80 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">名刺管理</h1>
            <div className="flex gap-4">
              <Link
                to="/create"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-300"
              >
                新規作成
              </Link>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                トップに戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {userEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 max-w-md mx-auto">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-4">まだ名刺がありません</h2>
              <p className="text-slate-400 mb-6">
                最初の名刺を作成して、あなたの音楽の趣味をシェアしましょう！
              </p>
              <Link
                to="/create"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
              >
                名刺を作成
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">あなたの名刺一覧</h2>
              
              <div className="grid gap-6">
                {userEntries.map(([username, songs]) => (
                  <div key={username} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{username}</h3>
                        <p className="text-slate-400">{songs.length}曲登録済み</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/users/${username}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        >
                          表示
                        </Link>
                        <button
                          onClick={() => editUser(username)}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-300"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteUser(username)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    {/* Song Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {songs.slice(0, 4).map((song, index) => (
                        <div key={index} className="bg-slate-600/50 rounded-lg p-3">
                          <div className="aspect-square mb-2 rounded-lg overflow-hidden">
                            <img
                              src={song.jacket}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="text-white text-sm font-medium truncate">{song.title}</h4>
                          <p className="text-slate-400 text-xs truncate">{song.artist}</p>
                        </div>
                      ))}
                      {songs.length > 4 && (
                        <div className="bg-slate-600/50 rounded-lg p-3 flex items-center justify-center">
                          <span className="text-slate-400 text-sm">+{songs.length - 4}曲</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-600/50">
                      <p className="text-slate-400 text-sm">
                        共有URL: <span className="text-purple-400 font-mono">{window.location.origin}/users/{username}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 