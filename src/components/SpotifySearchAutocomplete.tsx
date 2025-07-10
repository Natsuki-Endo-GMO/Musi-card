import React, { useState, useEffect } from 'react'
import { 
  searchMusicWithFallback, 
  SearchResult,
  setMusicProvider,
  getCurrentProvider,
  getAvailableProviders,
  setSpotifyAccessToken,
  getSpotifyAccessToken,
  MusicProvider
} from '../services/musicSearch'
import { spotifyAuth } from '../services/spotifyApi'

interface SpotifySearchAutocompleteProps {
  onSelect: (track: SearchResult) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export default function SpotifySearchAutocomplete({
  onSelect,
  className = '',
  placeholder = '音楽やアルバムを検索...',
  disabled = false
}: SpotifySearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentProvider, setCurrentProviderState] = useState<MusicProvider>('spotify')
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<MusicProvider[]>([])
  const [lastSearchInfo, setLastSearchInfo] = useState<string>('')

  // 初期化時の処理
  useEffect(() => {
    updateProviderState()
    checkSpotifyAuth()
  }, [])

  const updateProviderState = () => {
    const providers = getAvailableProviders()
    setAvailableProviders(providers)
    setCurrentProviderState(getCurrentProvider())
    
    const providerStatus = providers.length > 0 
      ? `利用可能: ${providers.map(p => p === 'spotify' ? 'Spotify' : 'Last.fm').join(', ')}`
      : '利用可能なプロバイダーなし'
    setLastSearchInfo(providerStatus)
  }

  const checkSpotifyAuth = () => {
    const token = getSpotifyAccessToken()
    setIsSpotifyAuthenticated(Boolean(token))
  }

  // Spotify認証を開始
  const handleSpotifyAuth = async () => {
    const authUrl = await spotifyAuth.getAuthUrl()
    const popup = window.open(
      authUrl,
      'spotify-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // ポップアップからのメッセージを待機
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        // 認証完了後の処理（トークンがセットされているかチェック）
        setTimeout(() => {
          checkSpotifyAuth()
          updateProviderState()
        }, 1000)
      }
    }, 1000)
  }

  // プロバイダー切り替え
  const handleProviderChange = (provider: MusicProvider) => {
    setMusicProvider(provider)
    setCurrentProviderState(provider)
    
    // 既に検索結果がある場合は再検索
    if (query.trim()) {
      searchMusic()
    }
  }

  const searchMusic = async () => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      setLastSearchInfo('検索クエリが空です')
      return
    }

    setIsSearching(true)
    const searchStartTime = Date.now()
    
    try {
      setLastSearchInfo(`${getCurrentProvider()}で検索中: "${query.trim()}"`)
      
      const searchResults = await searchMusicWithFallback(query)
      const searchDuration = Date.now() - searchStartTime
      
      setResults(searchResults)
      setShowResults(searchResults.length > 0)
      
      // 検索結果の分析
      const providerCounts = searchResults.reduce((acc, result) => {
        acc[result.provider || 'unknown'] = (acc[result.provider || 'unknown'] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query)
      const providerInfo = Object.entries(providerCounts)
        .map(([provider, count]) => `${provider}:${count}件`)
        .join(', ')
      
      setLastSearchInfo(
        `検索完了 (${searchDuration}ms) | ${searchResults.length}件 | ${providerInfo}${hasJapanese ? ' | 日本語検索' : ''}`
      )
      
    } catch (error) {
      console.error('検索エラー:', error)
      setResults([])
      setShowResults(false)
      setLastSearchInfo(`検索エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(searchMusic, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (track: SearchResult) => {
    onSelect(track)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const handleInputBlur = () => {
    setTimeout(() => setShowResults(false), 150)
  }

  const getProviderDisplayName = (provider: MusicProvider) => {
    switch (provider) {
      case 'spotify': return 'Spotify'
      case 'lastfm': return 'Last.fm'
      default: return provider
    }
  }

  const getProviderBadgeColor = (provider: MusicProvider) => {
    switch (provider) {
      case 'spotify': return 'bg-green-500'
      case 'lastfm': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* プロバイダー選択とSpotify認証 */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">音楽検索:</span>
        
        {/* プロバイダー切り替えボタン */}
        {availableProviders.map((provider) => (
          <button
            key={provider}
            onClick={() => handleProviderChange(provider)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              currentProvider === provider
                ? `${getProviderBadgeColor(provider)} text-white`
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getProviderDisplayName(provider)}
          </button>
        ))}

        {/* Spotify認証ボタン */}
        {!isSpotifyAuthenticated && (
          <button
            onClick={handleSpotifyAuth}
            className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors"
          >
            Spotify認証
          </button>
        )}

        {/* 認証状態表示 */}
        {isSpotifyAuthenticated && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Spotify認証済み
          </span>
        )}
        
        {/* 検索情報表示 */}
        {lastSearchInfo && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {lastSearchInfo}
          </span>
        )}
      </div>

      {/* 検索入力 */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* 検索結果 */}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((track, index) => (
              <button
                key={index}
                onClick={() => handleSelect(track)}
                className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {track.image ? (
                      <img
                        src={track.image}
                        alt={`${track.name} by ${track.artist}`}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {track.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {track.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getProviderBadgeColor(track.provider || 'lastfm')}`}>
                        {getProviderDisplayName(track.provider || 'lastfm')}
                      </span>
                      {track.isGeneratedImage && (
                        <span className="text-xs text-orange-500">生成画像</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 検索結果なし */}
        {showResults && results.length === 0 && !isSearching && query.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
            「{query}」の検索結果が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  )
} 