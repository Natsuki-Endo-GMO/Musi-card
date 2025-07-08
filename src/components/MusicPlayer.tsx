import { useState, useRef, useEffect } from 'react'

interface MusicPlayerProps {
  title: string
  artist: string
  previewUrl: string | null
  coverImage: string
  onPlay?: () => void
  onPause?: () => void
  onError?: (error: string) => void
}

export default function MusicPlayer({ 
  title, 
  artist, 
  previewUrl, 
  coverImage,
  onPlay,
  onPause,
  onError 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30) // Spotifyプレビューは30秒
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // 再生/停止処理
  const togglePlay = async () => {
    if (!previewUrl) {
      onError?.('試聴用音源が利用できません')
      return
    }

    if (!audioRef.current) return

    try {
      setLoading(true)
      setHasError(false)

      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        onPause?.()
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        onPlay?.()
      }
    } catch (error) {
      console.error('再生エラー:', error)
      setHasError(true)
      onError?.('音楽の再生に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 進行状況の更新
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // シーク機能
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const newTime = (clickX / width) * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // 時間フォーマット
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 進行率計算
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setHasError(true)
      setIsPlaying(false)
      onError?.('音楽ファイルの読み込みに失敗しました')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [onError])

  // プレビューURLが変更された時に停止
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setHasError(false)
  }, [previewUrl])

  if (!previewUrl) {
    console.warn(`⚠️ 試聴不可: "${title}" by "${artist}"`)
    console.warn(`💡 理由: Spotifyプレビューが提供されていません`)
    console.warn(`🔧 対処法: 
      1. 他の楽曲を試してください
      2. Spotify Premiumを検討してください  
      3. アーティストがプレビューを無効にしている可能性があります`)
    
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 1.414L15.657 9.17l1.414 1.414a1 1 0 11-1.414 1.414L14.243 10.584l-1.414 1.414a1 1 0 11-1.414-1.414L12.829 9.17l-1.414-1.414a1 1 0 111.414-1.414L14.243 7.756l1.414-1.413z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-gray-500">試聴不可</p>
          <p className="text-xs text-gray-400 mt-1">プレビュー未提供</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
      {/* 音声要素 */}
      <audio ref={audioRef} src={previewUrl} preload="metadata" />
      
      {/* カバー画像 */}
      <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-200">
        <img 
          src={coverImage} 
          alt={`${title} by ${artist}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* 楽曲情報 */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 truncate">{artist}</p>
      </div>
      
      {/* コントロール */}
      <div className="space-y-3">
        {/* 再生ボタン */}
        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            disabled={loading || hasError}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
              ${loading || hasError 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg'
              }
            `}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : hasError ? (
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* プログレスバー */}
        <div className="space-y-1">
          <div 
            ref={progressRef}
            onClick={handleSeek}
            className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
          >
            <div 
              className="h-full bg-blue-500 transition-all duration-200 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* 時間表示 */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {hasError && (
        <div className="mt-2 text-xs text-red-500 text-center">
          試聴に失敗しました
        </div>
      )}
    </div>
  )
} 