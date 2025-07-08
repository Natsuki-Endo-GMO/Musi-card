import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface IconUploadProps {
  onIconChange: (iconUrl: string) => void
  currentIcon?: string
  className?: string
}

interface CropArea {
  x: number
  y: number
  size: number
}

export default function IconUpload({ onIconChange, currentIcon, className = '' }: IconUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 20, y: 20, size: 60 })
  const [isCropping, setIsCropping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cropAreaRef = useRef<HTMLDivElement>(null)

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 画像の現在の表示サイズを取得
  const getCurrentImageSize = () => {
    if (!imageRef.current) return { width: 0, height: 0 }
    const rect = imageRef.current.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }

  // ESCキーでのキャンセル機能
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCropping) {
        handleCancelCrop()
      }
    }

    if (isCropping) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isCropping])

  // ファイル選択処理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setIsCropping(true)
      
      const img = new Image()
      img.onload = () => {
        if (isMobile) {
          setCropArea({ x: 15, y: 15, size: 70 })
        } else {
          setCropArea({ x: 20, y: 20, size: 60 })
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // マウスダウン処理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    
    // 画像の表示サイズを基準にした座標計算
    const imageX = ((e.clientX - imageRect.left) / imageRect.width) * 100
    const imageY = ((e.clientY - imageRect.top) / imageRect.height) * 100
    
    // クリック位置がトリミングエリア内かチェック
    if (imageX >= cropArea.x && imageX <= cropArea.x + cropArea.size &&
        imageY >= cropArea.y && imageY <= cropArea.y + cropArea.size) {
      setIsDragging(true)
      setDragStart({ x: imageX - cropArea.x, y: imageY - cropArea.y })
    }
  }

  // マウス移動処理
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return
    
    const imageRect = imageRef.current.getBoundingClientRect()
    const imageX = ((e.clientX - imageRect.left) / imageRect.width) * 100
    const imageY = ((e.clientY - imageRect.top) / imageRect.height) * 100
    
    // 正方形サイズを考慮した境界チェック
    const imageSize = getCurrentImageSize()
    const minSize = Math.min(imageSize.width, imageSize.height)
    const squareSizePercent = (cropArea.size / 100) * minSize
    const maxXPercent = ((imageSize.width - squareSizePercent) / imageSize.width) * 100
    const maxYPercent = ((imageSize.height - squareSizePercent) / imageSize.height) * 100
    
    const newX = Math.max(0, Math.min(maxXPercent, imageX - dragStart.x))
    const newY = Math.max(0, Math.min(maxYPercent, imageY - dragStart.y))
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }

  // マウスアップ処理
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // タッチ開始処理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || !imageRef.current) return
    
    const touch = e.touches[0]
    const imageRect = imageRef.current.getBoundingClientRect()
    const imageX = ((touch.clientX - imageRect.left) / imageRect.width) * 100
    const imageY = ((touch.clientY - imageRect.top) / imageRect.height) * 100
    
    if (imageX >= cropArea.x && imageX <= cropArea.x + cropArea.size &&
        imageY >= cropArea.y && imageY <= cropArea.y + cropArea.size) {
      setIsDragging(true)
      setDragStart({ x: imageX - cropArea.x, y: imageY - cropArea.y })
    }
  }

  // タッチ移動処理
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageRef.current) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const imageRect = imageRef.current.getBoundingClientRect()
    const imageX = ((touch.clientX - imageRect.left) / imageRect.width) * 100
    const imageY = ((touch.clientY - imageRect.top) / imageRect.height) * 100
    
    // 正方形サイズを考慮した境界チェック
    const imageSize = getCurrentImageSize()
    const minSize = Math.min(imageSize.width, imageSize.height)
    const squareSizePercent = (cropArea.size / 100) * minSize
    const maxXPercent = ((imageSize.width - squareSizePercent) / imageSize.width) * 100
    const maxYPercent = ((imageSize.height - squareSizePercent) / imageSize.height) * 100
    
    const newX = Math.max(0, Math.min(maxXPercent, imageX - dragStart.x))
    const newY = Math.max(0, Math.min(maxYPercent, imageY - dragStart.y))
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }

  // タッチ終了処理
  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // トリミング実行
  const handleCropComplete = async () => {
    if (!imageRef.current) return

    setIsUploading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const scaleX = imageRef.current.naturalWidth / imageRef.current.width
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height

      const cropSize = (cropArea.size / 100) * imageRef.current.width
      const cropX = (cropArea.x / 100) * imageRef.current.width
      const cropY = (cropArea.y / 100) * imageRef.current.height

      canvas.width = cropSize
      canvas.height = cropSize

      ctx.drawImage(
        imageRef.current,
        cropX * scaleX,
        cropY * scaleY,
        cropSize * scaleX,
        cropSize * scaleY,
        0,
        0,
        cropSize,
        cropSize
      )

      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
      onIconChange(croppedImageUrl)
      setSelectedImage(null)
      setIsCropping(false)
    } catch (error) {
      console.error('トリミングエラー:', error)
      alert('トリミング中にエラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  // トリミングキャンセル
  const handleCancelCrop = () => {
    setSelectedImage(null)
    setIsCropping(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 背景クリックでのキャンセル
  const handleBackgroundClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleCancelCrop()
    }
  }

  // アイコン削除
  const handleRemoveIcon = () => {
    onIconChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // モーダルコンポーネント
  const Modal = () => {
    if (!isCropping || !selectedImage) return null

    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999] p-4"
        onClick={handleBackgroundClick}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div 
          className={`bg-white rounded-xl shadow-2xl p-4 ${isMobile ? 'w-full h-full max-w-none max-h-none rounded-none' : 'max-w-2xl w-full max-h-[90vh] overflow-y-auto'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">アイコンをトリミング</h3>
            <button
              onClick={handleCancelCrop}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              disabled={isUploading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* デバッグ情報パネル */}
          {(() => {
            const imageSize = getCurrentImageSize()
            const naturalSize = imageRef.current ? {
              width: imageRef.current.naturalWidth,
              height: imageRef.current.naturalHeight
            } : { width: 0, height: 0 }
            
            const debugImageSize = getCurrentImageSize()
            const debugMinSize = Math.min(debugImageSize.width, debugImageSize.height)

            return (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 text-xs rounded z-20">
                画像情報
                <div>元解像度: {naturalSize.width} × {naturalSize.height}</div>
                <div>表示サイズ: {debugImageSize.width} × {debugImageSize.height}</div>
                <div>元縦横比: {(naturalSize.width / naturalSize.height).toFixed(2)}</div>
                <div>表示縦横比: {(debugImageSize.width / debugImageSize.height).toFixed(2)}</div>
                <div>短辺/長辺: {Math.min(naturalSize.width, naturalSize.height)} / {Math.max(naturalSize.width, naturalSize.height)}</div>
                <br />
                トリミング枠情報
                <div>位置: {cropArea.x.toFixed(1)}%, {cropArea.y.toFixed(1)}%</div>
                <div>サイズ: {cropArea.size}%</div>
                <div>
                  {(() => {
                    const squareSize = (cropArea.size / 100) * debugMinSize
                    return `正方形サイズ: ${Math.round(squareSize)}px × ${Math.round(squareSize)}px`
                  })()}
                </div>
                <div>
                  実際幅: {cropAreaRef.current ? cropAreaRef.current.offsetWidth : 0}px
                </div>
                <div>
                  実際高: {cropAreaRef.current ? cropAreaRef.current.offsetHeight : 0}px
                </div>
                <div>
                  実際縦横比: {cropAreaRef.current ? 
                    (cropAreaRef.current.offsetWidth / cropAreaRef.current.offsetHeight).toFixed(2) : 
                    'N/A'
                  }
                </div>
                <div>制限値: {Math.round(debugMinSize)}px</div>
              </div>
            )
          })()}
          
          <div className={`mb-6 ${isMobile ? 'flex-1 flex items-center justify-center' : ''}`}>
            <div 
              ref={containerRef}
              className={`relative inline-block ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
              style={{
                maxWidth: isMobile ? '100%' : '100%',
                maxHeight: isMobile ? '60vh' : '24rem'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                ref={imageRef}
                src={selectedImage}
                alt="トリミング対象"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* トリミングエリア */}
              {(() => {
                const imageSize = getCurrentImageSize()
                const minSize = Math.min(imageSize.width, imageSize.height)
                
                if (imageSize.width === 0 || imageSize.height === 0) return null
                
                // 正方形のサイズを短辺を基準に計算
                const squareSize = (cropArea.size / 100) * minSize
                const cropLeft = (cropArea.x / 100) * imageSize.width
                const cropTop = (cropArea.y / 100) * imageSize.height
                
                return (
                  <div
                    ref={cropAreaRef}
                    className={`absolute border-2 border-blue-500 ${isDragging ? 'border-blue-700 shadow-lg' : ''}`}
                    style={{
                      left: `${cropLeft}px`,
                      top: `${cropTop}px`,
                      width: `${squareSize}px`,
                      height: `${squareSize}px`,
                      cursor: isDragging ? 'grabbing' : 'move',
                      transition: isDragging ? 'none' : 'all 0.1s ease',
                      borderRadius: '50%',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                    title={`正方形サイズ: ${Math.round(squareSize)}px × ${Math.round(squareSize)}px`}
                  >
                    {/* ドラッグハンドル */}
                    <div 
                      className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
                      style={{ zIndex: 15 }}
                    />
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
                      style={{ zIndex: 15 }}
                    />
                    <div 
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
                      style={{ zIndex: 15 }}
                    />
                    <div 
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
                      style={{ zIndex: 15 }}
                    />
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="flex justify-end space-x-3 relative z-20">
            <button
              onClick={handleCancelCrop}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isUploading}
            >
              キャンセル
            </button>
            <button
              onClick={handleCropComplete}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
              disabled={isUploading}
            >
              {isUploading ? '処理中...' : '適用'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 現在のアイコン表示 */}
      {currentIcon && !isCropping && (
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={currentIcon}
              alt="ユーザーアイコン"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              onClick={handleRemoveIcon}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-600">アイコンが設定されています</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              変更する
            </button>
          </div>
        </div>
      )}

      {/* アイコンアップロードボタン */}
      {!currentIcon && !isCropping && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-500"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm">アイコンをアップロード</span>
            <span className="text-xs text-gray-400">JPG, PNG (5MB以下)</span>
          </button>
        </div>
      )}

      {/* モーダル */}
      <Modal />
    </div>
  )
} 