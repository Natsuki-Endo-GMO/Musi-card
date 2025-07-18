import { useState, useEffect } from 'react'
import { imageStorageService } from '../services/imageStorageService'
import { externalImageCacheService } from '../services/externalImageCacheService'
import { useAppConfig } from '../hooks/useAppConfig'

export default function ImageStorageDebug() {
  const { config, loading: configLoading } = useAppConfig();

  // 設定が読み込まれていない、または無効化されている場合は表示しない
  if (configLoading || !config?.enableDebugPanels) {
    return null;
  }

  const [storageStats, setStorageStats] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [storage, cache] = await Promise.all([
        imageStorageService.getStats(),
        externalImageCacheService.getCacheStats()
      ])
      
      setStorageStats(storage)
      setCacheStats(cache)
    } catch (err) {
      setError(err instanceof Error ? err.message : '統計情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupOldImages = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const deletedCount = await imageStorageService.cleanupOldImages()
      alert(`${deletedCount}件の古い画像を削除しました`)
      await loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クリーンアップに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupOldCache = () => {
    const deletedCount = externalImageCacheService.cleanupOldCache()
    alert(`${deletedCount}件の古いキャッシュを削除しました`)
    setCacheStats(externalImageCacheService.getCacheStats())
  }

  useEffect(() => {
    loadStats()
  }, [])

  // 設定が読み込まれていない、または無効化されている場合は表示しない
  if (configLoading || !config?.enableDebugPanels) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">画像ストレージデバッグ</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blob Storage統計 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Blob Storage統計</h3>
          {storageStats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>総ファイル数:</span>
                <span className="font-medium">{storageStats.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span>総サイズ:</span>
                <span className="font-medium">{(storageStats.totalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span>ユーザーアイコン:</span>
                <span className="font-medium">{storageStats.userIcons}</span>
              </div>
              <div className="flex justify-between">
                <span>アルバムジャケット:</span>
                <span className="font-medium">{storageStats.albumCovers}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">統計情報を読み込み中...</p>
          )}
        </div>

        {/* キャッシュ統計 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">外部画像キャッシュ統計</h3>
          {cacheStats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>キャッシュ済み画像:</span>
                <span className="font-medium">{cacheStats.totalCached}</span>
              </div>
              <div className="flex justify-between">
                <span>Spotify画像:</span>
                <span className="font-medium">{cacheStats.spotifyImages}</span>
              </div>
              <div className="flex justify-between">
                <span>Last.fm画像:</span>
                <span className="font-medium">{cacheStats.lastfmImages}</span>
              </div>
              <div className="flex justify-between">
                <span>手動画像:</span>
                <span className="font-medium">{cacheStats.manualImages}</span>
              </div>
              <div className="flex justify-between">
                <span>キャッシュサイズ:</span>
                <span className="font-medium">{(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">統計情報を読み込み中...</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? '更新中...' : '統計を更新'}
        </button>
        
        <button
          onClick={cleanupOldImages}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          古い画像を削除
        </button>
        
        <button
          onClick={cleanupOldCache}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          古いキャッシュを削除
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">設定状況</h4>
        <div className="text-xs space-y-1">
          <div>BLOB_READ_WRITE_TOKEN: {process.env.BLOB_READ_WRITE_TOKEN ? '✅ 設定済み' : '❌ 未設定'}</div>
          <div>NODE_ENV: {process.env.NODE_ENV}</div>
          <div>VITE_BLOB_READ_WRITE_TOKEN: {process.env.VITE_BLOB_READ_WRITE_TOKEN ? '✅ 設定済み' : '❌ 未設定'}</div>
        </div>
      </div>
    </div>
  )
} 