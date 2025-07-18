import { validateImageSize, validateImageFormat } from '../utils/imageProcessor'

// API Route経由での画像アップロード
const UPLOAD_API_URL = '/api/upload/image'

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
   * API Route経由で画像をアップロード
   */
  private async uploadViaAPI(buffer: Buffer, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    try {
      const base64 = buffer.toString('base64')
      
      const response = await fetch(UPLOAD_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          username,
          type
        })
      })

      if (!response.ok) {
        throw new Error(`アップロードに失敗しました: ${response.status}`)
      }

      const data = await response.json()
      
      console.log(`[API画像アップロード成功] ユーザー: ${username}, タイプ: ${type}, URL: ${data.url}`)
      
      return {
        url: data.url,
        size: buffer.length,
        width: 0,
        height: 0,
        format: 'jpeg'
      }
    } catch (error) {
      console.error('API画像アップロードエラー:', error)
      throw error
    }
  }

  /**
   * ユーザーアイコンをアップロード
   */
  async uploadUserIcon(file: File, username: string): Promise<ImageUploadResult> {
    try {
      // バリデーション
      if (!validateImageFormat(file.type)) {
        throw new Error('サポートされていない画像形式です')
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      if (!validateImageSize(buffer)) {
        throw new Error('ファイルサイズが大きすぎます（最大5MB）')
      }

      // API Route経由でアップロード
      return await this.uploadViaAPI(buffer, username, 'icon')
    } catch (error) {
      console.error('ユーザーアイコンアップロードエラー:', error)
      // フォールバック: ローカル保存
      return this.fallbackUpload(file, username, 'icon')
    }
  }

  /**
   * アルバムジャケットをアップロード
   */
  async uploadAlbumCover(file: File, username: string, songId: string): Promise<ImageUploadResult> {
    try {
      // バリデーション
      if (!validateImageFormat(file.type)) {
        throw new Error('サポートされていない画像形式です')
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      if (!validateImageSize(buffer)) {
        throw new Error('ファイルサイズが大きすぎます（最大5MB）')
      }

      // API Route経由でアップロード
      return await this.uploadViaAPI(buffer, username, 'album')
    } catch (error) {
      console.error('アルバムジャケットアップロードエラー:', error)
      // フォールバック: ローカル保存
      return this.fallbackUpload(file, username, 'album')
    }
  }

  /**
   * 外部URLから画像を取得してアップロード（Spotify/Last.fm API用）
   */
  async uploadFromUrl(imageUrl: string, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    try {
      // 外部URLから画像を取得
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('画像の取得に失敗しました')
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      // API Route経由でアップロード
      return await this.uploadViaAPI(buffer, username, type)
    } catch (error) {
      console.error('外部画像アップロードエラー:', error)
      // フォールバック: 元のURLを返す
      return this.fallbackUrlUpload(imageUrl, username, type)
    }
  }

  /**
   * フォールバックアップロード（ローカル保存）
   */
  private async fallbackUpload(file: File, username: string, type: 'icon' | 'album'): Promise<ImageUploadResult> {
    console.warn('⚠️ API Routeが利用できません。ローカル保存を使用します。')
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
    console.warn('⚠️ API Routeが利用できません。元のURLを使用します。')
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
      const response = await fetch('/api/delete/image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        console.log(`🗑️ 画像を削除: ${url}`)
        return true
      } else {
        throw new Error(`削除に失敗: ${response.status}`)
      }
    } catch (error) {
      console.error('画像削除エラー:', error)
      return false
    }
  }

  /**
   * 画像統計を取得
   */
  async getStats(): Promise<ImageStorageStats> {
    // TODO: API Route経由で統計情報を取得
    return {
      totalFiles: 0,
      totalSize: 0,
      userIcons: 0,
      albumCovers: 0
    }
  }

  /**
   * 古い画像をクリーンアップ
   */
  async cleanupOldImages(): Promise<number> {
    try {
      const response = await fetch('/api/cleanup/images', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`🧹 ${data.deletedCount}件の古い画像を削除しました`)
        return data.deletedCount
      }
      return 0
    } catch (error) {
      console.error('クリーンアップエラー:', error)
      return 0
    }
  }
}

// シングルトンインスタンス
export const imageStorageService = ImageStorageService.getInstance() 