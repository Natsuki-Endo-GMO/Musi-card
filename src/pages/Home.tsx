import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold text-white mb-6">
            Music
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              MEisi
            </span>
          </h1>
          <p className="text-slate-300 text-xl mb-8 max-w-2xl mx-auto">
            好きな音楽を美しく飾った、あなただけの音楽名刺を作成しよう
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Link 
              to="/create"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 text-lg"
            >
              自分の名刺を作成
            </Link>
            <Link 
              to="/manage"
              className="bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300 hover:scale-105 text-lg"
            >
              名刺を管理
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-4">サンプルユーザーの名刺を見る</p>
              <div className="flex gap-4">
                <Link 
                  to="/users/alice"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
                >
                  Aliceの名刺
                </Link>
                <Link 
                  to="/users/bob"
                  className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300 hover:scale-105"
                >
                  Bobの名刺
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">美しいデザイン</h3>
            <p className="text-slate-400 text-sm">Topstersライクなモダンで洗練されたデザイン</p>
          </div>
          
          <div className="text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">簡単シェア</h3>
            <p className="text-slate-400 text-sm">SNSのbioに貼るだけで音楽の趣味をシェア</p>
          </div>
          
          <div className="text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">レスポンシブ</h3>
            <p className="text-slate-400 text-sm">PC・スマホどちらでも美しく表示</p>
          </div>
        </div>
      </div>
    </div>
  )
} 