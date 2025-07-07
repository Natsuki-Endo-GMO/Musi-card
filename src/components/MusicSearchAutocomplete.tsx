import { useState, useEffect, useRef } from 'react'
import { searchMusicWithFallback, SearchResult } from '../services/musicSearch'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 検索の実行
  useEffect(() => {
    const searchMusic = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setShowDropdown(false)
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await searchMusicWithFallback(query)
        setResults(searchResults)
        setShowDropdown(searchResults.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('検索エラー:', error)
        setResults([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }

    // デバウンス処理
    const timeoutId = setTimeout(searchMusic, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

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
          className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={placeholder}
        />
        
        {/* 検索アイコン */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          ) : (
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* ドロップダウン */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={`${result.name}-${result.artist}-${index}`}
              onClick={() => handleSelect(result)}
              className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
                index === selectedIndex 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-slate-600 text-slate-200'
              }`}
            >
              {/* ジャケット画像 */}
              <div className="flex-shrink-0 w-12 h-12 mr-3">
                <img
                  src={result.image || `https://picsum.photos/48/48?random=${index}`}
                  alt={`${result.name} by ${result.artist}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://picsum.photos/48/48?random=${index}`
                  }}
                />
              </div>
              
              {/* 曲情報 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{result.name}</div>
                <div className="text-sm text-slate-400 truncate">{result.artist}</div>
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
            <div className="p-4 text-center text-slate-400">
              検索結果が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  )
} 