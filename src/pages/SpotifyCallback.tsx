import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { spotifyAuth } from '../services/spotifyApi'

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
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
        
        // トークンをローカルストレージに保存
        localStorage.setItem('spotify_access_token', accessToken)
        
        setStatus('success')
        
        // 少し待ってからホームページにリダイレクト
        setTimeout(() => {
          navigate('/')
        }, 2000)

      } catch (error) {
        console.error('Spotify認証エラー:', error)
        setStatus('error')
        setErrorMessage('認証処理中にエラーが発生しました')
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spotifyに接続中...</h2>
          <p className="text-gray-600">認証処理を行っています。しばらくお待ちください。</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">認証エラー</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">認証完了！</h2>
        <p className="text-gray-600 mb-4">Spotifyとの連携が完了しました。</p>
        <p className="text-sm text-gray-500">ホームページに自動的に移動します...</p>
      </div>
    </div>
  )
} 