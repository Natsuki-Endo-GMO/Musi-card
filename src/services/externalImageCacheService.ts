import { imageStorageService } from './imageStorageService'

export interface CachedImageInfo {
  url: string
  cachedAt: string
  size: number
  source: 'spotify' | 'lastfm' | 'manual'
}

export class ExternalImageCacheService {
  private static instance: ExternalImageCacheService
  private cache = new Map<string, CachedImageInfo>()

  static getInstance(): ExternalImageCacheService {
    if (!ExternalImageCacheService.instance) {
      ExternalImageCacheService.instance = new ExternalImageCacheService()
    }
    return ExternalImageCacheService.instance
  }

  /**
   * 画像URLをキャッシュキーに変換
   */
  private generateCacheKey(imageUrl: string, username: string, type: 'icon' | 'album'): string {
    const urlHash = btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '')
    return `${username}/${type}/${urlHash}`
  }

  /**
   * キャッシュされた画像があるかチェック
   */
  async getCachedImage(imageUrl: string, username: string, type: 'icon' | 'album'): Promise<string | null> {
    const cacheKey = this.generateCacheKey(imageUrl, username, type)
    
    // メモリキャッシュをチェック
    const cached = this.cache.get(cacheKey)
    if (cached) {
      const cachedAt = new Date(cached.cachedAt)
      const now = new Date()
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24)
      
      // 30日以内のキャッシュは有効
      if (daysDiff < 30) {
        console.log(`📋 キャッシュされた画像を使用: ${imageUrl}`)
        return cached.url
      }
    }

    return null
  }

  /**
   * 外部画像をキャッシュに保存
   */
  async cacheExternalImage(
    imageUrl: string, 
    username: string, 
    type: 'icon' | 'album',
    source: 'spotify' | 'lastfm' | 'manual'
  ): Promise<string> {
    try {
      // 既にキャッシュされているかチェック
      const cached = await this.getCachedImage(imageUrl, username, type)
      if (cached) {
        return cached
      }

      // 外部画像をアップロード
      const result = await imageStorageService.uploadFromUrl(imageUrl, username, type)
      
      // キャッシュ情報を保存
      const cacheKey = this.generateCacheKey(imageUrl, username, type)
      const cacheInfo: CachedImageInfo = {
        url: result.url,
        cachedAt: new Date().toISOString(),
        size: result.size,
        source
      }
      
      this.cache.set(cacheKey, cacheInfo)
      
      // ローカルストレージにも保存（永続化）
      this.saveCacheToStorage()
      
      console.log(`💾 外部画像をキャッシュ: ${imageUrl} → ${result.url}`)
      
      return result.url
    } catch (error) {
      console.error('外部画像キャッシュエラー:', error)
      throw error
    }
  }

  /**
   * Spotify API制限を考慮した画像取得
   */
  async getSpotifyImage(
    imageUrl: string, 
    username: string, 
    type: 'icon' | 'album',
    fallbackUrl?: string
  ): Promise<string> {
    try {
      // キャッシュをチェック
      const cached = await this.getCachedImage(imageUrl, username, type)
      if (cached) {
        return cached
      }

      // 新しい画像をキャッシュ
      return await this.cacheExternalImage(imageUrl, username, type, 'spotify')
    } catch (error) {
      console.warn('Spotify画像キャッシュエラー:', error)
      
      // フォールバックURLがある場合は使用
      if (fallbackUrl && fallbackUrl !== imageUrl) {
        try {
          return await this.getSpotifyImage(fallbackUrl, username, type)
        } catch (fallbackError) {
          console.error('フォールバック画像も失敗:', fallbackError)
        }
      }
      
      // デフォルト画像を返す
      return this.getDefaultImage(type)
    }
  }

  /**
   * Last.fm API制限を考慮した画像取得
   */
  async getLastfmImage(
    imageUrl: string, 
    username: string, 
    type: 'icon' | 'album',
    fallbackUrl?: string
  ): Promise<string> {
    try {
      // キャッシュをチェック
      const cached = await this.getCachedImage(imageUrl, username, type)
      if (cached) {
        return cached
      }

      // 新しい画像をキャッシュ
      return await this.cacheExternalImage(imageUrl, username, type, 'lastfm')
    } catch (error) {
      console.warn('Last.fm画像キャッシュエラー:', error)
      
      // フォールバックURLがある場合は使用
      if (fallbackUrl && fallbackUrl !== imageUrl) {
        try {
          return await this.getLastfmImage(fallbackUrl, username, type)
        } catch (fallbackError) {
          console.error('フォールバック画像も失敗:', fallbackError)
        }
      }
      
      // デフォルト画像を返す
      return this.getDefaultImage(type)
    }
  }

  /**
   * デフォルト画像を取得
   */
  private getDefaultImage(type: 'icon' | 'album'): string {
    if (type === 'icon') {
      return '/default-user-icon.png'
    } else {
      return '/default-album-cover.png'
    }
  }

  /**
   * キャッシュをローカルストレージに保存
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries())
      localStorage.setItem('external_image_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('キャッシュ保存エラー:', error)
    }
  }

  /**
   * ローカルストレージからキャッシュを復元
   */
  loadCacheFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('external_image_cache')
      if (cacheData) {
        const parsed = JSON.parse(cacheData) as [string, CachedImageInfo][]
        this.cache = new Map(parsed)
        console.log(`📋 キャッシュを復元: ${this.cache.size}件`)
      }
    } catch (error) {
      console.error('キャッシュ復元エラー:', error)
    }
  }

  /**
   * 古いキャッシュをクリーンアップ
   */
  cleanupOldCache(): number {
    const now = new Date()
    let deletedCount = 0

    for (const [key, info] of this.cache.entries()) {
      const cachedAt = new Date(info.cachedAt)
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24)
      
      // 60日以上前のキャッシュを削除
      if (daysDiff > 60) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.saveCacheToStorage()
      console.log(`🧹 古いキャッシュを${deletedCount}件削除しました`)
    }

    return deletedCount
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): {
    totalCached: number
    spotifyImages: number
    lastfmImages: number
    manualImages: number
    totalSize: number
  } {
    let spotifyCount = 0
    let lastfmCount = 0
    let manualCount = 0
    let totalSize = 0

    for (const info of this.cache.values()) {
      totalSize += info.size
      switch (info.source) {
        case 'spotify':
          spotifyCount++
          break
        case 'lastfm':
          lastfmCount++
          break
        case 'manual':
          manualCount++
          break
      }
    }

    return {
      totalCached: this.cache.size,
      spotifyImages: spotifyCount,
      lastfmImages: lastfmCount,
      manualImages: manualCount,
      totalSize
    }
  }
}

// シングルトンインスタンス
export const externalImageCacheService = ExternalImageCacheService.getInstance()

// 初期化時にキャッシュを復元
if (typeof window !== 'undefined') {
  externalImageCacheService.loadCacheFromStorage()
} 