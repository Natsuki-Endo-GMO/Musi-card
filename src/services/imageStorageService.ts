import { put, del, list } from '@vercel/blob'
import { processImage, validateImageSize, validateImageFormat, generateSafeFileName, IMAGE_PRESETS, ProcessedImage } from '../utils/imageProcessor'

// Vercel Blob Storage設定
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VITE_BLOB_READ_WRITE_TOKEN

if (!BLOB_READ_WRITE_TOKEN) {
  console.warn('⚠️ BLOB_READ_WRITE_TOKENが設定されていません。画像ストレージ機能が無効になります。')
}

// 本番環境での画像処理を無効化（Vercelの制限のため）
const isProduction = process.env.NODE_ENV === 'production'

// 環境変数が設定されていない場合は常にフォールバック
const useFallback = !BLOB_READ_WRITE_TOKEN || isProduction

export interface ImageUploadResult {
  url: string
  size: number
  width: number
  height: number
  format: string
}

export interface ImageStorageStats {
  totalFiles: number
  totalSize: number
  userIcons: number
  albumCovers: number
}

export class ImageStorageService {
  private static instance: ImageStorageService
  private uploadCache = new Map<string, string>()

  static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService()
    }
    return ImageStorageService.instance
  }

  /**
   * Blob Storageが利用可能かチェック
   */
  private isBlobStorageAvailable(): boolean {
    return !!BLOB_READ_WRITE_TOKEN && !useFallback
  }

  /**
   * ユーザーアイコンをアップロード
   */
  async uploadUserIcon(file: File, username: string): Promise<ImageUploadResult> {
    try {
      // Blob Storageが利用できない場合はフォールバック
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。ローカル保存を使用します。')
        return this.fallbackUpload(file, username, 'icon')
      }

      // バリデーション
      if (!validateImageFormat(file.type)) {
        throw new Error('サポートされていない画像形式です')
      }

      if (!validateImageSize(await file.arrayBuffer().then(buf => Buffer.from(buf)))) {
        throw new Error('ファイルサイズが大きすぎます（最大5MB）')
      }

      // 画像処理（本番環境ではスキップ）
      const buffer = Buffer.from(await file.arrayBuffer())
      let processed: ProcessedImage
      
      if (isProduction) {
        // 本番環境では画像処理をスキップ
        processed = {
          buffer,
          format: file.type.split('/')[1] || 'jpeg',
          size: buffer.length,
          width: 0,
          height: 0
        }
      } else {
        processed = await processImage(buffer, IMAGE_PRESETS.userIcon)
      }

      // ファイル名生成
      const fileName = generateSafeFileName(file.name, username, 'icon')

      // Blobにアップロード
      const { url } = await put(fileName, processed.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: `image/${processed.format}`
      })

      // キャッシュに保存
      this.uploadCache.set(fileName, url)

      console.log(`[画像保存] ユーザー: ${username}, ファイル名: ${fileName}, サイズ: ${processed.size}, URL: ${url}`)

      return {
        url,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        format: processed.format
      }
    } catch (error) {
      console.error('ユーザーアイコンアップロードエラー:', error)
      // エラーの場合はフォールバック
      return this.fallbackUpload(file, username, 'icon')
    }
  }

  /**
   * アルバムジャケットをアップロード
   */
  async uploadAlbumCover(file: File, username: string, songId: string): Promise<ImageUploadResult> {
    try {
      // Blob Storageが利用できない場合はフォールバック
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。ローカル保存を使用します。')
        return this.fallbackUpload(file, username, 'album')
      }

      // バリデーション
      if (!validateImageFormat(file.type)) {
        throw new Error('サポートされていない画像形式です')
      }

      if (!validateImageSize(await file.arrayBuffer().then(buf => Buffer.from(buf)))) {
        throw new Error('ファイルサイズが大きすぎます（最大5MB）')
      }

      // 画像処理（本番環境ではスキップ）
      const buffer = Buffer.from(await file.arrayBuffer())
      let processed: ProcessedImage
      
      if (isProduction) {
        // 本番環境では画像処理をスキップ
        processed = {
          buffer,
          format: file.type.split('/')[1] || 'jpeg',
          size: buffer.length,
          width: 0,
          height: 0
        }
      } else {
        processed = await processImage(buffer, IMAGE_PRESETS.albumCover)
      }

      // ファイル名生成
      const fileName = generateSafeFileName(file.name, username, 'album')

      // Blobにアップロード
      const { url } = await put(fileName, processed.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: `image/${processed.format}`
      })

      // キャッシュに保存
      this.uploadCache.set(fileName, url)

      console.log(`[画像保存] ユーザー: ${username}, ファイル名: ${fileName}, サイズ: ${processed.size}, URL: ${url}`)

      return {
        url,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        format: processed.format
      }
    } catch (error) {
      console.error('アルバムジャケットアップロードエラー:', error)
      // エラーの場合はフォールバック
      return this.fallbackUpload(file, username, 'album')
    }
  }

  /**
   * 外部URLから画像を取得してアップロード（Spotify/Last.fm API用）
   */
  async uploadFromUrl(imageUrl: string, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    try {
      // Blob Storageが利用できない場合はフォールバック
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。元のURLを返します。')
        return this.fallbackUrlUpload(imageUrl, username, type)
      }

      // 外部URLから画像を取得
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('画像の取得に失敗しました')
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      // 画像処理（本番環境ではスキップ）
      let processed: ProcessedImage
      
      if (isProduction) {
        // 本番環境では画像処理をスキップ
        processed = {
          buffer,
          format: 'jpeg',
          size: buffer.length,
          width: 0,
          height: 0
        }
      } else {
        const preset = type === 'icon' ? IMAGE_PRESETS.userIcon : IMAGE_PRESETS.albumCover
        processed = await processImage(buffer, preset)
      }

      // ファイル名生成
      const fileName = generateSafeFileName(`external-${Date.now()}`, username, type)

      // Blobにアップロード
      const { url } = await put(fileName, processed.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: `image/${processed.format}`
      })

      console.log(`📤 外部画像をアップロード: ${username}/${type} (${processed.size} bytes)`)

      return {
        url,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        format: processed.format
      }
    } catch (error) {
      console.error('外部画像アップロードエラー:', error)
      // エラーの場合はフォールバック
      return this.fallbackUrlUpload(imageUrl, username, type)
    }
  }

  /**
   * フォールバックアップロード（ローカル保存）
   */
  private async fallbackUpload(file: File, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        resolve({
          url: dataUrl,
          size: file.size,
          width: 0,
          height: 0,
          format: file.type.split('/')[1] || 'jpeg'
        })
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * フォールバックURLアップロード（元のURLを返す）
   */
  private async fallbackUrlUpload(imageUrl: string, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    return {
      url: imageUrl,
      size: 0,
      width: 0,
      height: 0,
      format: 'jpeg'
    }
  }

  /**
   * 画像を削除
   */
  async deleteImage(url: string): Promise<boolean> {
    try {
      // Blob Storageが利用できない場合はスキップ
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。削除をスキップします。')
        return true
      }

      await del(url)
      console.log(`🗑️ 画像を削除: ${url}`)
      return true
    } catch (error) {
      console.error('画像削除エラー:', error)
      return false
    }
  }

  /**
   * ユーザーの画像一覧を取得
   */
  async getUserImages(username: string): Promise<string[]> {
    try {
      // Blob Storageが利用できない場合は空配列を返す
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。画像一覧を取得できません。')
        return []
      }

      const { blobs } = await list({
        prefix: `${username}/`,
        limit: 100
      })

      return blobs.map(blob => blob.url)
    } catch (error) {
      console.error('ユーザー画像一覧取得エラー:', error)
      return []
    }
  }

  /**
   * ストレージ統計を取得
   */
  async getStorageStats(): Promise<ImageStorageStats> {
    try {
      // Blob Storageが利用できない場合はデフォルト値を返す
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。統計情報を取得できません。')
        return {
          totalFiles: 0,
          totalSize: 0,
          userIcons: 0,
          albumCovers: 0
        }
      }

      const { blobs } = await list({
        limit: 1000
      })

      let totalSize = 0
      let userIcons = 0
      let albumCovers = 0

      blobs.forEach(blob => {
        totalSize += blob.size || 0
        if (blob.pathname.includes('/icon/')) {
          userIcons++
        } else if (blob.pathname.includes('/album/')) {
          albumCovers++
        }
      })

      return {
        totalFiles: blobs.length,
        totalSize,
        userIcons,
        albumCovers
      }
    } catch (error) {
      console.error('ストレージ統計取得エラー:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        userIcons: 0,
        albumCovers: 0
      }
    }
  }

  /**
   * 古い画像をクリーンアップ（30日以上前）
   */
  async cleanupOldImages(): Promise<number> {
    try {
      // Blob Storageが利用できない場合はスキップ
      if (!this.isBlobStorageAvailable()) {
        console.warn('⚠️ Blob Storageが利用できません。クリーンアップをスキップします。')
        return 0
      }

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { blobs } = await list({
        limit: 1000
      })

      let deletedCount = 0

      for (const blob of blobs) {
        if (blob.uploadedAt && new Date(blob.uploadedAt) < thirtyDaysAgo) {
          try {
            await del(blob.url)
            deletedCount++
          } catch (error) {
            console.error(`古い画像削除エラー: ${blob.url}`, error)
          }
        }
      }

      console.log(`🧹 古い画像を${deletedCount}件削除しました`)
      return deletedCount
    } catch (error) {
      console.error('古い画像クリーンアップエラー:', error)
      return 0
    }
  }
}

// シングルトンインスタンス
export const imageStorageService = ImageStorageService.getInstance() 