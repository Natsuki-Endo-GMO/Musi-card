import { useState, useEffect, useRef } from 'react'
import { spotifySearch, SpotifyAlbum, SpotifyTrack, SpotifyArtist } from '../services/spotifyApi'

interface SpotifySearchAutocompleteProps {
  onSelect: (item: SpotifyAlbum | SpotifyTrack | SpotifyArtist) => void
  searchType?: 'album' | 'track' | 'artist'
  placeholder?: string
  className?: string
}

export default function SpotifySearchAutocomplete({
  onSelect,
  searchType = 'album',
  placeholder = 'アルバムを検索...',
  className = ''
}: SpotifySearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(SpotifyAlbum | SpotifyTrack | SpotifyArtist)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Spotifyアクセストークンを取得
  const getSpotifyToken = () => {
    return localStorage.getItem('spotify_access_token')
  }

  // 検索実行
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const token = getSpotifyToken()
    if (!token) {
      console.warn('Spotifyアクセストークンが見つかりません')
      return
    }

    setIsLoading(true)
    try {
      let searchResults: (SpotifyAlbum | SpotifyTrack | SpotifyArtist)[] = []

      switch (searchType) {
        case 'album':
          searchResults = await spotifySearch.searchAlbums(searchQuery, token, 8)
          break
        case 'track':
          searchResults = await spotifySearch.searchTracks(searchQuery, token, 8)
          break
        case 'artist':
          searchResults = await spotifySearch.searchArtists(searchQuery, token, 8)
          break
      }

      setResults(searchResults)
      setIsOpen(true)
    } catch (error) {
      console.error('Spotify検索エラー:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // デバウンス処理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        performSearch(query)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchType])

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

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
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // アイテム選択
  const handleSelect = (item: SpotifyAlbum | SpotifyTrack | SpotifyArtist) => {
    onSelect(item)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // アイテム表示用のレンダリング関数
  const renderItem = (item: SpotifyAlbum | SpotifyTrack | SpotifyArtist, index: number) => {
    const isSelected = index === selectedIndex
    const baseClasses = "flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
    const selectedClasses = isSelected ? "bg-blue-50 border-blue-200" : ""

    return (
      <div
        key={item.id}
        className={`${baseClasses} ${selectedClasses}`}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        <div className="flex-shrink-0 w-12 h-12 mr-3">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {searchType === 'album' && (item as SpotifyAlbum).artist}
            {searchType === 'track' && `${(item as SpotifyTrack).artist} • ${(item as SpotifyTrack).album}`}
            {searchType === 'artist' && `${(item as SpotifyArtist).followers.toLocaleString()} followers`}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    )
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
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((item, index) => renderItem(item, index))}
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && query && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <p className="text-gray-500 text-center">検索結果が見つかりませんでした</p>
        </div>
      )}
    </div>
  )
} 