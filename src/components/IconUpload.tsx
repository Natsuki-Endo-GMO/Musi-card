import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface IconUploadProps {
  onIconChange: (iconUrl: string) => void
  currentIcon?: string
  className?: string
}

export default function IconUpload({ onIconChange, currentIcon, className = '' }: IconUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 60,
    height: 60,
    x: 20,
    y: 20
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isCropping, setIsCropping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropRef = useRef<any>(null)

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ESCキーでのキャンセル機能
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCropping) {
        handleCancelCrop()
      }
    }

    if (isCropping) {
      document.addEventListener('keydown', handleEscKey)
      // スクロールを無効化
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

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setIsCropping(true)
      
      // 画像の縦横比に応じて初期配置を調整
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.width / img.height
        
        if (isMobile) {
          // モバイルの場合
          setCrop({
            unit: '%',
            width: 70,
            height: 70,
            x: 15,
            y: 15
          })
        } else {
          // デスクトップの場合
          setCrop({
            unit: '%',
            width: 60,
            height: 60,
            x: 20,
            y: 20
          })
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // トリミング実行
  const handleCropComplete = async () => {
    if (!completedCrop || !imageRef.current) return

    setIsUploading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const scaleX = imageRef.current.naturalWidth / imageRef.current.width
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height

      canvas.width = completedCrop.width
      canvas.height = completedCrop.height

      ctx.drawImage(
        imageRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      )

      // トリミングされた画像をBase64で取得
      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      // アイコンとして設定
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

  // ドラッグ開始
  const handleDragStart = () => {
    setIsDragging(true)
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setIsDragging(false)
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
          
          <div className={`mb-6 ${isMobile ? 'flex-1 flex items-center justify-center' : ''}`}>
            <div className={`crop-container ${isDragging ? 'dragging' : ''}`}>
              <ReactCrop
                ref={cropRef}
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-w-full"
                minWidth={50}
                minHeight={50}
                keepSelection
                ruleOfThirds
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="トリミング対象"
                  className={`${isMobile ? 'max-h-[60vh] max-w-full' : 'max-w-full max-h-96'} object-contain rounded-lg`}
                  style={{ 
                    maxWidth: isMobile ? '100%' : '100%',
                    maxHeight: isMobile ? '60vh' : '24rem'
                  }}
                />
              </ReactCrop>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
              disabled={isUploading || !completedCrop}
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