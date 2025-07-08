import { useState, useRef } from 'react'

interface YouTubePlayerProps {
  title: string
  artist: string
  videoId: string
  coverImage: string
  onError?: (error: string) => void
}

export default function YouTubePlayer({ 
  title, 
  artist, 
  videoId, 
  coverImage,
  onError 
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // プレビュー再生開始
  const startPreview = () => {
    if (!videoId) {
      onError?.('YouTube動画IDが取得できませんでした')
      return
    }

    try {
      setHasError(false)
      setIsPlaying(true)
      console.log(`▶️ YouTube試聴開始: ${title} - ${artist}`)
      console.log(`🎥 Video ID: ${videoId}`)
    } catch (error) {
      console.error('YouTube再生エラー:', error)
      setHasError(true)
      setIsPlaying(false)
      onError?.('YouTube動画の再生に失敗しました')
    }
  }

  // 再生停止
  const stopPreview = () => {
    setIsPlaying(false)
    console.log(`⏹️ YouTube試聴停止: ${title} - ${artist}`)
  }

  // YouTube動画URL生成（30秒プレビュー）
  const getEmbedUrl = () => {
    return `https://www.youtube.com/embed/${videoId}?` +
           `autoplay=1&start=0&end=30&` +
           `controls=1&modestbranding=1&rel=0&showinfo=0&` +
           `enablejsapi=1&origin=${window.location.origin}`;
  }

  if (!videoId) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <p className="text-xs text-gray-500">YouTube動画なし</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm mx-auto">
      {/* 動画プレイヤー部分 */}
      <div className="relative aspect-video bg-black">
        {!isPlaying ? (
          // プレビュー画像とプレイボタン
          <div className="relative w-full h-full">
            <img 
              src={coverImage} 
              alt={`${title} by ${artist}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button
                onClick={startPreview}
                disabled={hasError}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                  ${hasError 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 hover:scale-110 shadow-lg'
                  }
                `}
              >
                {hasError ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* YouTube ロゴ */}
            <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1">
              <svg className="w-6 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
          </div>
        ) : (
          // YouTube 埋め込みプレイヤー
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={getEmbedUrl()}
              title={`${title} by ${artist}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            />
            
            {/* 停止ボタン */}
            <button
              onClick={stopPreview}
              className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* 楽曲情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">{title}</h3>
        <p className="text-sm text-gray-600 truncate mb-3">{artist}</p>
        
        {/* プレビュー情報 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            30秒プレビュー
          </span>
          {isPlaying && (
            <span className="text-red-500 font-medium">再生中</span>
          )}
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {hasError && (
        <div className="px-4 pb-4">
          <div className="text-xs text-red-500 text-center bg-red-50 p-2 rounded">
            YouTube動画の再生に失敗しました
          </div>
        </div>
      )}
    </div>
  )
} 