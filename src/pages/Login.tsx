import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminConfig } from '../hooks/useAdminConfig'

export default function Login() {
  const navigate = useNavigate()
  const { config: adminConfig } = useAdminConfig()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setIsLoading(true)
    
    try {
      const userKey = username.trim().toLowerCase()
      
      // 既存ユーザーかチェック
      const existingUser = localStorage.getItem(`musicard_auth_${userKey}`)
      
      if (existingUser) {
        // 既存ユーザーの場合、パスワード確認
        const userData = JSON.parse(existingUser)
        if (userData.password !== password) {
          alert('❌ パスワードが正しくありません')
          return
        }
        console.log(`✅ ユーザー「${username}」でログインしました`)
      } else if (isNewUser) {
        // 新規ユーザー登録
        const newUserData = {
          username: userKey,
          password: password,
          createdAt: new Date().toISOString()
        }
        localStorage.setItem(`musicard_auth_${userKey}`, JSON.stringify(newUserData))
        console.log(`🆕 新規ユーザー「${username}」を登録しました`)
      } else {
        alert('❌ ユーザーが見つかりません。新規登録をしてください。')
        return
      }
      
      // セッション管理
      localStorage.setItem('musicard_user', userKey)
      localStorage.setItem('musicard_login_time', Date.now().toString())
      
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
    // 管理者判定（サーバーサイド設定を使用）
    const adminUsers = adminConfig?.adminUsers || ['admin']
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

        {/* ログイン/新規登録切り替え */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsNewUser(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isNewUser 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setIsNewUser(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isNewUser 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            新規登録
          </button>
        </div>

        {/* フォーム */}
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
              placeholder="英数字でユーザー名を入力"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力"
              required
              disabled={isLoading}
            />
            {isNewUser && (
              <p className="text-xs text-gray-500 mt-1">
                パスワードは安全に保管されます
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isNewUser ? '登録中...' : 'ログイン中...'}
              </div>
            ) : (
              isNewUser ? '新規登録' : 'ログイン'
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
              管理者ユーザー: {adminConfig?.adminUsers?.join(', ') || 'admin'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 