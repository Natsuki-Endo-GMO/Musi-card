import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setIsLoading(true)
    
    try {
      // 管理者ユーザーかチェック
      const adminUsers = (import.meta.env.VITE_ADMIN_USERS || 'admin').split(',')
      if (!adminUsers.includes(username.toLowerCase())) {
        alert('❌ 管理者権限がありません')
        return
      }

      // 管理者の認証情報を確認
      const adminKey = `musicard_admin_${username.toLowerCase()}`
      const existingAdmin = localStorage.getItem(adminKey)
      
      if (existingAdmin) {
        const adminData = JSON.parse(existingAdmin)
        if (adminData.password !== password) {
          alert('❌ 管理者パスワードが正しくありません')
          return
        }
      } else {
        // 初回アクセスの場合、管理者アカウントを作成
        const adminData = {
          username: username.toLowerCase(),
          password: password,
          role: 'admin',
          createdAt: new Date().toISOString()
        }
        localStorage.setItem(adminKey, JSON.stringify(adminData))
        console.log(`🛡️ 管理者アカウント「${username}」を作成しました`)
      }
      
      // 管理者セッション
      localStorage.setItem('musicard_admin', username.toLowerCase())
      localStorage.setItem('musicard_admin_login_time', Date.now().toString())
      
      console.log(`🛡️ 管理者「${username}」でログインしました`)
      
      // 管理者ページにリダイレクト
      navigate('/admin')
    } catch (error) {
      console.error('管理者ログインエラー:', error)
      alert('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border-t-4 border-red-500">
        {/* 管理者ロゴ */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            管理者ログイン
          </h1>
          <p className="text-gray-600">MusiCard Admin Panel</p>
        </div>

        {/* 警告 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 text-sm">
              管理者のみアクセス可能です
            </p>
          </div>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              管理者ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="管理者ユーザー名"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              管理者パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="管理者パスワード"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ログイン中...
              </div>
            ) : (
              '管理者ログイン'
            )}
          </button>
        </form>

        {/* 戻るリンク */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← トップページに戻る
          </button>
        </div>

        {/* デバッグ情報（開発環境のみ） */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
            <p className="text-yellow-800 font-medium">🔧 開発モード</p>
            <p className="text-yellow-700">
              許可された管理者: {import.meta.env.VITE_ADMIN_USERS || 'admin'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 