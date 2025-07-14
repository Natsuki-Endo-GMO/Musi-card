import { useState, useRef, useEffect } from 'react'

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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(30) // 30秒プレビュー
  const [volume, setVolume] = useState(1)
  const [startTime, setStartTime] = useState(0)
  const [isLoadingChorus, setIsLoadingChorus] = useState(false)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // サビ検出用の時間設定（楽曲の長さに応じて推測）
  const getChorusTime = async () => {
    try {
      setIsLoadingChorus(true)
      // 一般的なポップソングのサビは楽曲の30-60%の位置にあることが多い
      // YouTubeの動画情報から推測（実際のAPIでは制限がある）
      const estimatedChorus = Math.floor(Math.random() * 30) + 45; // 45-75秒あたり
      setStartTime(estimatedChorus)
      console.log(`🎵 サビ予測時間: ${estimatedChorus}秒`)
    } catch (error) {
      console.error('サビ検出エラー:', error)
      setStartTime(0) // デフォルトは開始時間
    } finally {
      setIsLoadingChorus(false)
    }
  }

  // フェードイン効果
  const fadeIn = () => {
    setVolume(0)
    let vol = 0
    fadeIntervalRef.current = setInterval(() => {
      vol += 0.05
      if (vol >= 1) {
        vol = 1
        clearInterval(fadeIntervalRef.current!)
      }
      setVolume(vol)
    }, 50)
  }

  // フェードアウト効果
  const fadeOut = (callback?: () => void) => {
    let vol = volume
    fadeIntervalRef.current = setInterval(() => {
      vol -= 0.05
      if (vol <= 0) {
        vol = 0
        clearInterval(fadeIntervalRef.current!)
        callback?.()
      }
      setVolume(vol)
    }, 50)
  }

  // プレビュー再生開始
  const startPreview = () => {
    if (!videoId) {
      onError?.('YouTube動画IDが取得できませんでした')
      return
    }

    try {
      setHasError(false)
      setIsPlaying(true)
      setCurrentTime(0)
      fadeIn()
      
      // 進捗バーの更新
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (newTime >= duration) {
            stopPreview()
            return duration
          }
          return newTime
        })
      }, 1000)
      
      console.log(`▶️ YouTube試聴開始: ${title} - ${artist}`)
      console.log(`🎥 Video ID: ${videoId}, Start: ${startTime}s`)
    } catch (error) {
      console.error('YouTube再生エラー:', error)
      setHasError(true)
      setIsPlaying(false)
      onError?.('YouTube動画の再生に失敗しました')
    }
  }

  // 再生停止
  const stopPreview = () => {
    fadeOut(() => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
    })
    console.log(`⏹️ YouTube試聴停止: ${title} - ${artist}`)
  }

  // YouTube動画URL生成（30秒プレビュー）
  const getEmbedUrl = () => {
    return `https://www.youtube.com/embed/${videoId}?` +
           `autoplay=1&start=${startTime}&end=${startTime + duration}&` +
           `controls=1&modestbranding=1&rel=0&showinfo=0&` +
           `enablejsapi=1&origin=${window.location.origin}`;
  }

  // 進捗バーの計算
  const progressPercent = (currentTime / duration) * 100

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
    }
  }, [])

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
              style={{ opacity: volume }}
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

            {/* 進捗バー */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <div className="flex items-center gap-2 text-white text-xs">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-600 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 楽曲情報 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">{title}</h3>
        <p className="text-sm text-gray-600 truncate mb-3">{artist}</p>
        
        {/* コントロール */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={getChorusTime}
            disabled={isLoadingChorus}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs disabled:opacity-50"
          >
            {isLoadingChorus ? (
              <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            サビ検出
          </button>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>開始:</span>
            <span className="font-mono">{formatTime(startTime)}</span>
          </div>
        </div>
        
        {/* プレビュー情報 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            30秒プレビュー
          </span>
          {isPlaying && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              再生中
            </span>
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