import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataManager from '../components/DataManager'
import { getUserList, deleteUser as deleteUserData } from '../utils/userData'

interface UserInfo {
  username: string
  displayName: string
  songCount: number
  viewCount: number
  updatedAt: string
}

export default function ManageUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showDataManager, setShowDataManager] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    try {
      const userList = getUserList()
      setUsers(userList)
    } catch (error) {
      console.error('ユーザーデータの読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = (username: string) => {
    if (confirm(`${username}の名刺を削除しますか？この操作は取り消せません。`)) {
      if (deleteUserData(username)) {
        loadUsers() // リストを再読み込み
        alert(`✅ ${username}の名刺を削除しました`)
      } else {
        alert(`❌ ${username}の削除に失敗しました`)
      }
    }
  }

  const editUser = (username: string) => {
    navigate(`/edit/${username}`)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('ja-JP')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">音楽名刺管理</h1>
            <p className="text-gray-600">作成された音楽名刺の管理とデータ統計</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDataManager(!showDataManager)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showDataManager 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              データ管理
            </button>
            <Link 
              to="/create"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg"
            >
              新しい名刺を作成
            </Link>
            <Link 
              to="/"
              className="bg-white text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              ホームに戻る
            </Link>
          </div>
        </div>

        {/* データマネージャー */}
        {showDataManager && (
          <div className="mb-8">
            <DataManager />
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{users.length}</div>
            <div className="text-gray-600">総ユーザー数</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {users.reduce((sum, user) => sum + user.songCount, 0)}
            </div>
            <div className="text-gray-600">総楽曲数</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {users.reduce((sum, user) => sum + user.viewCount, 0)}
            </div>
            <div className="text-gray-600">総閲覧数</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.songCount, 0) / users.length) : 0}
            </div>
            <div className="text-gray-600">平均楽曲数</div>
          </div>
        </div>

        {/* ユーザーリスト */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">登録ユーザー一覧</h2>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🎵</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">名刺がまだありません</h3>
              <p className="text-gray-600 mb-6">最初の音楽名刺を作成してみましょう</p>
              <Link 
                to="/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                名刺を作成
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">ユーザー</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">楽曲数</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">閲覧数</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">更新日</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                            <div className="text-sm text-gray-500 font-mono">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.songCount} 曲
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {user.viewCount} 回
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/users/${user.username}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            表示
                          </Link>
                          <button
                            onClick={() => editUser(user.username)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => deleteUser(user.username)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 使用方法 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 使用方法</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">名刺の管理</h4>
              <ul className="space-y-1">
                <li>• 「表示」で名刺ページを表示</li>
                <li>• 「編集」で名刺内容を編集</li>
                <li>• 「削除」で名刺を完全削除</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">データ管理</h4>
              <ul className="space-y-1">
                <li>• 統計情報の確認</li>
                <li>• データのバックアップ・復元</li>
                <li>• エクスポート・インポート</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 