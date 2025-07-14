import React, { useState, useEffect } from 'react'
import { 
  getStorageStats, 
  getUserList, 
  createBackup, 
  restoreFromBackup, 
  exportUserData, 
  importUserData 
} from '../utils/userData'

interface DataManagerProps {
  className?: string
}

export default function DataManager({ className = '' }: DataManagerProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    totalViews: 0,
    storageSizeKB: 0
  })
  const [userList, setUserList] = useState<Array<{
    username: string
    displayName: string
    songCount: number
    viewCount: number
    updatedAt: string
  }>>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setStats(getStorageStats())
    setUserList(getUserList())
  }

  const handleBackup = () => {
    if (createBackup()) {
      alert('✅ バックアップを作成しました')
      loadData()
    } else {
      alert('❌ バックアップの作成に失敗しました')
    }
  }

  const handleRestore = () => {
    if (confirm('バックアップから復元しますか？現在のデータは上書きされます。')) {
      if (restoreFromBackup()) {
        alert('✅ バックアップから復元しました')
        loadData()
        window.location.reload() // ページをリロードしてデータを反映
      } else {
        alert('❌ バックアップからの復元に失敗しました')
      }
    }
  }

  const handleExport = () => {
    try {
      const exportData = exportUserData()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `musicmeisi_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      alert('✅ データをエクスポートしました')
    } catch (error) {
      console.error('エクスポートエラー:', error)
      alert('❌ データのエクスポートに失敗しました')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        if (importUserData(jsonData)) {
          alert('✅ データをインポートしました')
          loadData()
          window.location.reload() // ページをリロードしてデータを反映
        } else {
          alert('❌ データのインポートに失敗しました')
        }
      } catch (error) {
        console.error('インポートエラー:', error)
        alert('❌ 無効なファイル形式です')
      }
    }
    reader.readAsText(file)
    
    // inputをリセット
    event.target.value = ''
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7V4a1 1 0 011-1h5l2 2h6a1 1 0 011 1v1M4 7h16" />
        </svg>
        データ管理
      </h3>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div className="text-sm text-blue-800">総ユーザー数</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalSongs}</div>
          <div className="text-sm text-green-800">総楽曲数</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
          <div className="text-sm text-purple-800">総閲覧数</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.storageSizeKB}</div>
          <div className="text-sm text-orange-800">ストレージ (KB)</div>
        </div>
      </div>

      {/* 管理ボタン */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleBackup}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          バックアップ
        </button>
        
        <button
          onClick={handleRestore}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          復元
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          エクスポート
        </button>
        
        <label className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          インポート
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="sr-only"
          />
        </label>
      </div>

      {/* ユーザーリスト */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          <svg 
            className={`w-4 h-4 mr-2 transition-transform ${showDetails ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          ユーザー詳細を{showDetails ? '非表示' : '表示'}
        </button>
      </div>

      {showDetails && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">ユーザー名</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">表示名</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">楽曲数</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">閲覧数</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">更新日時</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user) => (
                <tr key={user.username} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-sm">{user.username}</td>
                  <td className="py-2 px-3">{user.displayName}</td>
                  <td className="py-2 px-3 text-right">{user.songCount}</td>
                  <td className="py-2 px-3 text-right">{user.viewCount}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {userList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293L16 14H8l-2.707-1.707A1 1 0 004.586 13H2" />
              </svg>
              <p>登録されているユーザーがいません</p>
            </div>
          )}
        </div>
      )}

      {/* 使用方法 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">💡 使用方法</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>バックアップ</strong>: 現在のデータをブラウザ内に保存</li>
          <li>• <strong>復元</strong>: バックアップからデータを復元</li>
          <li>• <strong>エクスポート</strong>: データをJSONファイルとしてダウンロード</li>
          <li>• <strong>インポート</strong>: JSONファイルからデータを読み込み</li>
        </ul>
      </div>
    </div>
  )
} 