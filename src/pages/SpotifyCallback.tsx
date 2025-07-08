import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { spotifyAuth } from '../services/spotifyApi'
import { setSpotifyAccessToken, setMusicProvider } from '../services/musicSearch'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPopup, setIsPopup] = useState(false)

  useEffect(() => {
    // ポップアップウィンドウかどうかを確認
    const isPopupWindow = window.opener && window.opener !== window
    setIsPopup(isPopupWindow)

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setErrorMessage('認証に失敗しました')
          return
        }

        if (!code) {
          setStatus('error')
          setErrorMessage('認証コードが見つかりません')
          return
        }

        // アクセストークンを取得
        const accessToken = await spotifyAuth.getAccessToken(code)
        
        // 音楽検索システムにトークンを設定
        setSpotifyAccessToken(accessToken)
        
        // デフォルトプロバイダーをSpotifyに設定
        setMusicProvider('spotify')
        
        // トークンをローカルストレージにも保存（永続化用）
        localStorage.setItem('spotify_access_token', accessToken)
        
        setStatus('success')
        
        // ポップアップの場合は親ウィンドウに通知して閉じる
        if (isPopupWindow) {
          // 親ウィンドウにメッセージを送信
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { 
                type: 'SPOTIFY_AUTH_SUCCESS', 
                token: accessToken 
              }, 
              window.location.origin
            )
          }
          // 少し待ってからポップアップを閉じる
          setTimeout(() => {
            window.close()
          }, 1500)
        } else {
          // 通常のウィンドウの場合は少し待ってからホームページにリダイレクト
          setTimeout(() => {
            navigate('/')
          }, 2000)
        }

      } catch (error) {
        console.error('Spotify認証エラー:', error)
        setStatus('error')
        setErrorMessage('認証処理中にエラーが発生しました')
        
        // ポップアップの場合はエラーも親に通知
        if (isPopupWindow && window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { 
              type: 'SPOTIFY_AUTH_ERROR', 
              error: '認証処理中にエラーが発生しました' 
            }, 
            window.location.origin
          )
        }
      }
    }

    handleCallback()
  }, [searchParams, navigate, isPopup])

  // ポップアップ表示用のスタイル
  const containerClass = isPopup 
    ? "min-h-screen bg-white flex items-center justify-center p-8"
    : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center"

  if (status === 'loading') {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spotifyに接続中...</h2>
          <p className="text-gray-600">認証処理を行っています。しばらくお待ちください。</p>
          {isPopup && (
            <p className="text-sm text-gray-500 mt-2">完了後、このウィンドウは自動的に閉じます。</p>
          )}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">認証エラー</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          {!isPopup && (
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              ホームに戻る
            </button>
          )}
          {isPopup && (
            <button
              onClick={() => window.close()}
              className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">認証完了！</h2>
        <p className="text-gray-600 mb-4">Spotifyとの連携が完了しました。</p>
        {isPopup ? (
          <p className="text-sm text-gray-500">このウィンドウは自動的に閉じます...</p>
        ) : (
          <p className="text-sm text-gray-500">ホームページに自動的に移動します...</p>
        )}
      </div>
    </div>
  )
} 