import sharp from 'sharp'

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  blur?: number
}

export interface ProcessedImage {
  buffer: Buffer
  format: string
  size: number
  width: number
  height: number
}

// デフォルト設定
const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 85,
  format: 'webp',
  blur: 0
}

// 画像タイプ別の最適化設定
export const IMAGE_PRESETS = {
  // ユーザーアイコン用（小さく、高品質）
  userIcon: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 90,
    format: 'webp' as const,
    blur: 0
  },
  // アルバムジャケット用（中サイズ、バランス重視）
  albumCover: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    format: 'webp' as const,
    blur: 0
  },
  // サムネイル用（小さく、軽量）
  thumbnail: {
    maxWidth: 150,
    maxHeight: 150,
    quality: 80,
    format: 'webp' as const,
    blur: 0
  }
}

/**
 * 画像を最適化・圧縮する
 */
export async function processImage(
  input: Buffer | string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    let pipeline = sharp(input)
    
    // メタデータを取得
    const metadata = await pipeline.metadata()
    
    // リサイズ処理
    if (opts.maxWidth || opts.maxHeight) {
      pipeline = pipeline.resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    }
    
    // ブラー処理（必要に応じて）
    if (opts.blur > 0) {
      pipeline = pipeline.blur(opts.blur)
    }
    
    // フォーマット変換と圧縮
    let outputBuffer: Buffer
    let outputFormat: string
    
    switch (opts.format) {
      case 'webp':
        outputBuffer = await pipeline.webp({ quality: opts.quality }).toBuffer()
        outputFormat = 'webp'
        break
      case 'jpeg':
        outputBuffer = await pipeline.jpeg({ quality: opts.quality }).toBuffer()
        outputFormat = 'jpeg'
        break
      case 'png':
        outputBuffer = await pipeline.png({ quality: opts.quality }).toBuffer()
        outputFormat = 'png'
        break
      default:
        outputBuffer = await pipeline.webp({ quality: opts.quality }).toBuffer()
        outputFormat = 'webp'
    }
    
    // 処理後のメタデータを取得
    const processedMetadata = await sharp(outputBuffer).metadata()
    
    return {
      buffer: outputBuffer,
      format: outputFormat,
      size: outputBuffer.length,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0
    }
  } catch (error) {
    console.error('画像処理エラー:', error)
    throw new Error('画像の処理に失敗しました')
  }
}

/**
 * 画像のサイズを検証する
 */
export function validateImageSize(buffer: Buffer, maxSizeMB: number = 5): boolean {
  const sizeInMB = buffer.length / (1024 * 1024)
  return sizeInMB <= maxSizeMB
}

/**
 * 画像の形式を検証する
 */
export function validateImageFormat(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * ファイル名を安全に生成する
 */
export function generateSafeFileName(originalName: string, username: string, type: 'icon' | 'album'): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'
  
  return `${username}/${type}/${timestamp}-${randomId}.${extension}`
}

/**
 * 画像の使用量を計算する（月1000人想定）
 */
export function calculateImageUsage(): {
  userIcons: number
  albumCovers: number
  totalStorageGB: number
  monthlyOperations: number
} {
  // 月1000人、平均5曲/人を想定
  const monthlyUsers = 1000
  const avgSongsPerUser = 5
  const iconUpdateFrequency = 0.1 // 10%のユーザーが月1回アイコン更新
  
  const userIcons = monthlyUsers * iconUpdateFrequency
  const albumCovers = monthlyUsers * avgSongsPerUser
  
  // 推定ファイルサイズ
  const iconSizeKB = 50 // 200x200 WebP
  const albumSizeKB = 100 // 400x400 WebP
  
  const totalStorageMB = (userIcons * iconSizeKB + albumCovers * albumSizeKB) / 1024
  const totalStorageGB = totalStorageMB / 1024
  
  const monthlyOperations = userIcons + albumCovers
  
  return {
    userIcons: Math.round(userIcons),
    albumCovers: Math.round(albumCovers),
    totalStorageGB: Math.round(totalStorageGB * 100) / 100,
    monthlyOperations: Math.round(monthlyOperations)
  }
} 