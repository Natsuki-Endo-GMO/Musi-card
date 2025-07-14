import { useState, useEffect } from 'react'
import { storageService, getStorageProviderInfo, switchStorageProvider, StorageProvider } from '../services/storageService'

export default function StorageDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [storageInfo, setStorageInfo] = useState(getStorageProviderInfo())
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    loadStorageStats()
  }, [])

  const loadStorageStats = async () => {
    try {
      const users = await storageService.loadAllUsers()
      setUserCount(Object.keys(users).length)
      setStorageInfo(getStorageProviderInfo())
    } catch (error) {
      console.error('ストレージ統計の読み込みエラー:', error)
    }
  }

  const handleProviderSwitch = (provider: StorageProvider) => {
    switchStorageProvider(provider)
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // 開発環境でのみ表示
  if (!import.meta.env.DEV || !import.meta.env.VITE_DEBUG_STORAGE) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        title="Storage Debug Panel"
      >
        🔧 Storage
      </button>

      {/* デバッグパネル */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-xl p-4 min-w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Storage Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 現在の状態 */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Provider:</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                {storageInfo.current}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">User Count:</span>
              <span className="font-mono">{userCount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Environment:</span>
              <span className="font-mono text-xs">
                {storageInfo.environment || 'default'}
              </span>
            </div>

            {storageInfo.override && (
              <div className="flex justify-between">
                <span className="text-gray-600">Override:</span>
                <span className="font-mono text-orange-600">
                  {storageInfo.override}
                </span>
              </div>
            )}
          </div>

          {/* プロバイダー切り替え */}
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs font-semibold mb-2">Switch Provider:</div>
            <div className="space-y-1">
              {storageInfo.available.map(provider => (
                <button
                  key={provider}
                  onClick={() => handleProviderSwitch(provider)}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    storageInfo.current === provider
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  disabled={storageInfo.current === provider}
                >
                  <span className="font-mono">{provider}</span>
                  {provider === 'localStorage' && (
                    <span className="ml-2 text-green-600">✓ 安定</span>
                  )}
                  {provider === 'vercelBlob' && (
                    <span className="ml-2 text-yellow-600">⚠ 開発中</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* リフレッシュボタン */}
          <div className="mt-3 pt-2 border-t">
            <button
              onClick={loadStorageStats}
              className="w-full text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              🔄 Refresh Stats
            </button>
          </div>

          {/* 注意書き */}
          <div className="mt-2 text-xs text-gray-500 italic">
            * プロバイダー切り替え後はページが自動リロードされます
          </div>
        </div>
      )}
    </div>
  )
} 