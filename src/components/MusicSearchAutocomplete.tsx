import { useState, useRef, useEffect, useCallback } from 'react'
import { searchMusic } from '../services/musicSearch'
import { SearchResult } from '../services/musicSearch'
import { externalImageCacheService } from '../services/externalImageCacheService'

interface MusicSearchAutocompleteProps {
  onSelect: (music: SearchResult) => void
  placeholder?: string
  className?: string
  username?: string // ユーザー名を追加
}

export default function MusicSearchAutocomplete({ 
  onSelect, 
  placeholder = "曲名やアーティスト名を検索...",
  className = "",
  username = ""
}: MusicSearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // 検索実行
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowErrorDetails(false)

    try {
      const searchResults = await searchMusic(searchQuery)
      
      // 画像キャッシュ処理
      if (username && searchResults.length > 0) {
        const cachedResults = await Promise.all(
          searchResults.map(async (result) => {
                         if (result.image && result.image.startsWith('http')) {
               try {
                 const cachedImageUrl = await externalImageCacheService.cacheExternalImage(
                   result.image,
                   username,
                   'album',
                   'manual'
                 )
                 return {
                   ...result,
                   image: cachedImageUrl
                 }
               } catch (error) {
                 console.warn('画像キャッシュエラー:', error)
                 // キャッシュに失敗しても元の画像URLを使用
                 return result
               }
             }
            return result
          })
        )
        setResults(cachedResults)
      } else {
        setResults(searchResults)
      }
      
      setShowDropdown(true)
      setSelectedIndex(0)
    } catch (error) {
      console.error('音楽検索エラー:', error)
      setError(error instanceof Error ? error.message : '検索中にエラーが発生しました')
      setResults([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }, [username])

  // 手動検索
  const handleManualSearch = useCallback(() => {
    const now = Date.now()
    if (now - lastSearchTime < 1000) {
      console.log('検索間隔が短すぎます')
      return
    }
    setLastSearchTime(now)
    performSearch(query.trim())
  }, [query, lastSearchTime, performSearch])

  // 自動検索（デバウンス）
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 500)
    } else {
      setResults([])
      setShowDropdown(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, performSearch])

  // キーボードナビゲーション
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }, [showDropdown, results, selectedIndex])

  // 選択処理
  const handleSelect = useCallback((result: SearchResult) => {
    onSelect(result)
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setSelectedIndex(0)
    setError(null)
  }, [onSelect])

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // エラー詳細表示
  const toggleErrorDetails = () => {
    setShowErrorDetails(!showErrorDetails)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setShowDropdown(true)}
          className="w-full px-4 py-3 pr-24 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        
        {/* 手動検索ボタンと読み込みアイコン */}
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* 手動検索ボタン */}
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={isLoading || query.trim().length < 1}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="手動検索を実行"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
          
          {/* エラー詳細表示ボタン */}
          {error && (
            <button
              type="button"
              onClick={toggleErrorDetails}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="エラー詳細を表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          {showErrorDetails && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
              <p>詳細情報:</p>
              <p>• インターネット接続を確認してください</p>
              <p>• 検索キーワードを変更してみてください</p>
              <p>• しばらく時間をおいてから再試行してください</p>
            </div>
          )}
        </div>
      )}

      {/* 検索結果ドロップダウン */}
      {showDropdown && results.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={`${result.name}-${result.artist}-${index}`}
              onClick={() => handleSelect(result)}
              className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
                index === selectedIndex 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-blue-50 text-blue-900'
              }`}
            >
              {/* ジャケット画像 */}
              <div className="flex-shrink-0 w-12 h-12 mr-3 relative">
                <img
                  src={result.image || `https://picsum.photos/48/48?random=${index}`}
                  alt={`${result.name} by ${result.artist}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://picsum.photos/48/48?random=${index}`
                  }}
                />
                {/* 生成画像のインジケーター */}
                {result.isGeneratedImage && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                    AI
                  </div>
                )}
                {/* プロバイダーインジケーター */}
                {result.provider && (
                  <div className={`absolute -bottom-1 -left-1 text-white text-xs px-1 py-0.5 rounded-full ${
                    result.provider === 'spotify' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {result.provider === 'spotify' ? 'S' : 'L'}
                  </div>
                )}
                {/* キャッシュインジケーター */}
                {username && result.image && result.image.includes('blob.vercel-storage.com') && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                    C
                  </div>
                )}
              </div>
              
              {/* 曲情報 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{result.name}</div>
                <div className="text-sm opacity-75 truncate">{result.artist}</div>
              </div>
              
              {/* 選択インジケーター */}
              {index === selectedIndex && (
                <div className="flex-shrink-0 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 