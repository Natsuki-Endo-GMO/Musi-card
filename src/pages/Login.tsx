import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    
    try {
      // シンプルなセッション管理（将来的に認証システムに置き換え可能）
      localStorage.setItem('musicard_user', username.trim().toLowerCase())
      localStorage.setItem('musicard_login_time', Date.now().toString())
      
      console.log(`✅ ユーザー「${username}」でログインしました`)
      
      // 自分の名刺編集ページにリダイレクト
      navigate('/dashboard')
    } catch (error) {
      console.error('ログインエラー:', error)
      alert('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = (user: string): boolean => {
    // 管理者判定（環境変数で設定可能）
    const adminUsers = (import.meta.env.VITE_ADMIN_USERS || 'admin').split(',')
    return adminUsers.includes(user.toLowerCase())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Musi
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
              Card
            </span>
          </h1>
          <p className="text-gray-600">音楽名刺でつながろう</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="あなたのユーザー名を入力"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              初回アクセスの場合、自動で新しい名刺が作成されます
            </p>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ログイン中...
              </div>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        {/* ゲスト機能 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-4">
            または、ゲストとして閲覧
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/users/alice')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Aliceの名刺
            </button>
            <button
              onClick={() => navigate('/users/bob')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Bobの名刺
            </button>
          </div>
        </div>

        {/* デバッグ情報（開発環境のみ） */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
            <p className="text-yellow-800 font-medium">🔧 開発モード</p>
            <p className="text-yellow-700">
              管理者ユーザー: {import.meta.env.VITE_ADMIN_USERS || 'admin'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 