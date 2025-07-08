import React, { useState, useEffect, useRef } from 'react'
import { searchMusicWithFallback, SearchResult, getLastSearchStatus, getCurrentProvider } from '../services/musicSearch'

interface MusicSearchAutocompleteProps {
  onSelect: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export default function MusicSearchAutocomplete({ 
  onSelect, 
  placeholder = "曲名やアーティスト名を検索...",
  className = ""
}: MusicSearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 検索の実行（自動・手動共通）
  const performSearch = async (searchQuery: string, isManual: boolean = false) => {
    if (searchQuery.trim().length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setLastSearchTime(Date.now())
    
    try {
      const searchResults = await searchMusicWithFallback(searchQuery)
      setResults(searchResults)
      setShowDropdown(searchResults.length > 0)
      setSelectedIndex(-1)
      
      // 手動検索の場合は常にエラー詳細を表示
      if (isManual) {
        setShowErrorDetails(true)
        
        // 検索状況をコンソールに詳細表示
        const searchStatus = getLastSearchStatus()
        const currentProvider = getCurrentProvider()
        
        console.group(`🔍 手動検索結果詳細 (${new Date().toLocaleTimeString()})`)
        console.log(`📝 検索クエリ: "${searchQuery}"`)
        console.log(`⚙️ 現在のプロバイダー: ${currentProvider.toUpperCase()}`)
        console.log(`📊 検索結果数: ${searchResults.length}件`)
        
        if (searchStatus.length > 0) {
          console.log('📋 検索状況:')
          searchStatus.forEach((status, index) => {
            const statusIcon = status.success ? '✅' : '❌'
            console.log(`  ${index + 1}. ${statusIcon} ${status.provider.toUpperCase()}`)
            if (status.error) {
              console.log(`     エラー: ${status.error}`)
            }
            if (status.fallbackReason) {
              console.log(`     フォールバック理由: ${status.fallbackReason}`)
            }
          })
          
          // フォールバック理由をまとめて表示
          const failedProviders = searchStatus.filter(s => !s.success)
          if (failedProviders.length > 0) {
            console.warn('⚠️ フォールバック詳細:')
            failedProviders.forEach(status => {
              if (status.fallbackReason) {
                console.warn(`  • ${status.provider.toUpperCase()}: ${status.fallbackReason}`)
              }
            })
          }
        }
        console.groupEnd()
      }
      
    } catch (error) {
      console.error('🔍 検索エラー:', error)
      setResults([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 自動検索（デバウンス付き）
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    // デバウンス処理
    const timeoutId = setTimeout(() => {
      performSearch(query, false)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [query])

  // 手動検索ボタンのハンドラ
  const handleManualSearch = () => {
    if (query.trim().length >= 1) {
      performSearch(query, true)
    }
  }

  // エラー詳細の表示・非表示切り替え
  const toggleErrorDetails = () => {
    setShowErrorDetails(!showErrorDetails)
    
    if (!showErrorDetails) {
      // エラー詳細を表示する際に現在の検索状況をコンソールに出力
      const searchStatus = getLastSearchStatus()
      const currentProvider = getCurrentProvider()
      
      console.group(`📊 現在の検索状況詳細`)
      console.log(`⚙️ アクティブプロバイダー: ${currentProvider.toUpperCase()}`)
      
      if (searchStatus.length > 0) {
        console.log('📋 最新の検索履歴:')
        searchStatus.forEach((status, index) => {
          const statusIcon = status.success ? '✅' : '❌'
          const timeStr = new Date(status.timestamp).toLocaleTimeString()
          console.log(`  ${index + 1}. ${statusIcon} ${status.provider.toUpperCase()} (${timeStr})`)
          if (status.error) {
            console.log(`     エラー: ${status.error}`)
          }
          if (status.fallbackReason) {
            console.log(`     理由: ${status.fallbackReason}`)
          }
        })
      } else {
        console.log('まだ検索が実行されていません')
      }
      console.groupEnd()
    }
  }

  // エラー詳細を表示するためのコンポーネント
  const ErrorDetails = () => {
    const searchStatus = getLastSearchStatus()
    const currentProvider = getCurrentProvider()
    
    if (searchStatus.length === 0) return null

    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-blue-900">検索状況詳細</span>
          <span className="text-blue-600 text-xs">現在: {currentProvider.toUpperCase()}</span>
        </div>
        
        {searchStatus.map((status, index) => (
          <div key={index} className="mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <span className={status.success ? 'text-green-600' : 'text-red-600'}>
                {status.success ? '✅' : '❌'}
              </span>
              <span className="font-medium text-blue-800">
                {status.provider.toUpperCase()}
              </span>
              <span className="text-blue-500 text-xs">
                {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            {status.error && (
              <div className="ml-6 text-red-600 text-xs">
                エラー: {status.error}
              </div>
            )}
            
            {status.fallbackReason && (
              <div className="ml-6 text-orange-600 text-xs">
                {status.fallbackReason}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // 結果の選択
  const handleSelect = (result: SearchResult) => {
    onSelect(result)
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // クリックアウトサイドでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          {lastSearchTime > 0 && (
            <button
              type="button"
              onClick={toggleErrorDetails}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="検索状況詳細を表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* エラー詳細表示 */}
      {showErrorDetails && <ErrorDetails />}

      {/* ドロップダウン */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
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
              </div>
              
              {/* 曲情報 */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${
                  index === selectedIndex ? 'text-white' : 'text-blue-900'
                }`}>
                  {result.name}
                </div>
                <div className={`text-sm truncate ${
                  index === selectedIndex ? 'text-blue-100' : 'text-blue-600'
                }`}>
                  {result.artist}
                </div>
              </div>
              
              {/* 選択インジケーター */}
              {index === selectedIndex && (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          ))}
          
          {/* 結果が見つからない場合 */}
          {results.length === 0 && query.trim().length >= 2 && !isLoading && (
            <div className="p-4 text-center text-blue-600">
              検索結果が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  )
} 