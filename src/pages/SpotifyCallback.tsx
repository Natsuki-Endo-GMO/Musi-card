import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens, setMusicProvider } from '../services/musicSearch'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLパラメータから認証コードとstateを取得
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`Spotify認証エラー: ${error}`)
        }

        if (!code) {
          throw new Error('認証コードが見つかりません')
        }

        if (!state) {
          throw new Error('状態パラメータが見つかりません')
        }

        console.log('🔄 認証コードをアクセストークンに交換中...')

        // 認証コードをアクセストークンとリフレッシュトークンに交換
        const tokenData = await exchangeCodeForTokens(code, state)
        
        // 音楽検索プロバイダーをSpotifyに設定
        setMusicProvider('spotify')
        
        setStatus('success')
        setMessage(`Spotify認証が完了しました！アクセストークンの有効期限: ${Math.floor(tokenData.expires_in / 60)}分`)

        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          navigate('/')
        }, 3000)

      } catch (error: any) {
        console.error('❌ Spotify認証エラー:', error)
        setStatus('error')
        setMessage(error.message || 'Spotify認証に失敗しました')
        
        // 詳細なエラー情報をコンソールに出力
        if (error.message?.includes('Token exchange failed')) {
          console.error('🔍 トークン交換エラーの詳細:')
          console.error('   • Client IDまたはSecretが間違っている可能性')
          console.error('   • Redirect URIが正確に設定されていない可能性')
          console.error('   • Spotify Developer Dashboardの設定を確認してください')
        }
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/50 shadow-lg text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-blue-900 mb-4">
                🎧 Spotify認証処理中...
              </h1>
              <p className="text-blue-600">
                認証コードをアクセストークンに交換しています...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 text-green-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-700 mb-4">
                🎉 認証完了！
              </h1>
              <p className="text-blue-600 mb-4">
                {message}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-green-700 text-sm">
                  ✅ 音楽検索でSpotifyが利用可能になりました<br/>
                  ✅ リフレッシュトークンによる自動更新対応<br/>
                  ✅ より高精度な検索結果を提供
                </p>
              </div>
              <p className="text-blue-500 text-sm">
                3秒後に自動的にホームページに戻ります...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-700 mb-4">
                ❌ 認証に失敗しました
              </h1>
              <p className="text-red-600 mb-4">
                {message}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm text-left">
                  <strong>🔍 よくある解決方法:</strong><br/>
                  • Spotify Developer Dashboardでredirect_uriを確認<br/>
                  • Client IDとSecretが正しく設定されているか確認<br/>
                  • ブラウザのキャッシュをクリアして再試行
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors duration-300"
              >
                ホームに戻る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 