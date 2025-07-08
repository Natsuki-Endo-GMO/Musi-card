import { Link } from 'react-router-dom'
import { startSpotifyAuth, generateSpotifyAuthUrl } from '../services/musicSearch'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold text-gray-900 mb-6">
            Musi
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
              Card
            </span>
          </h1>
          <p className="text-gray-600 text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            好きな音で、あなたを彩ろう
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              to="/create"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 text-lg shadow-lg hover:shadow-xl"
            >
              音楽名刺を作成
            </Link>
            <Link 
              to="/manage"
              className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-105 text-lg border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
            >
              名刺を管理
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
              <p className="text-gray-600 text-sm mb-4">サンプル名刺をご覧ください</p>
              <div className="flex gap-4">
                <Link 
                  to="/users/alice"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Aliceの名刺
                </Link>
                <Link 
                  to="/users/bob"
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 hover:scale-105 border border-gray-200"
                >
                  Bobの名刺
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">洗練されたデザイン</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Topsters風のモダンで美しいレイアウト</p>
          </div>
          
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">簡単シェア</h3>
            <p className="text-gray-600 text-sm leading-relaxed">SNSのプロフィールに貼るだけで音楽の趣味を共有</p>
          </div>
          
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">どこでも表示</h3>
            <p className="text-gray-600 text-sm leading-relaxed">PC・スマートフォンどちらでも美しく表示</p>
          </div>
        </div>

        {/* 音楽検索機能説明 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/50 shadow-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">🎵 音楽検索機能</h2>
          <p className="text-blue-700 mb-4">
            SpotifyとLast.fmの両方に対応した音楽検索で、豊富な楽曲データベースから選択できます。
          </p>
          
          {/* Spotify認証ボタン */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">🎧 Spotify認証</h3>
                <p className="text-blue-600 text-sm">
                  Spotifyにログインして、より豊富な音楽データベースにアクセス
                </p>
              </div>
              <button
                onClick={() => {
                  const authUrl = generateSpotifyAuthUrl()
                  window.open(authUrl, '_blank')
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-300 flex items-center gap-2"
              >
                <span>🎵</span>
                Spotify連携
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Spotify検索</h3>
              <p className="text-blue-600 text-sm">高精度な検索結果と豊富なメタデータ</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔄 Last.fmフォールバック</h3>
              <p className="text-blue-600 text-sm">Spotifyで見つからない場合の自動フォールバック</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 