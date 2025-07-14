import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserProfile, Song, ThemeColor, THEME_COLORS, BASE_COLORS, GRID_LAYOUTS } from '../types/user'
import { storageService } from '../services/storageService'
import MusicSearchAutocomplete from '../components/MusicSearchAutocomplete'
import IconUpload from '../components/IconUpload'
import Toast from '../components/Toast'
import { SearchResult } from '../services/musicSearch'
import ImageStorageDebug from '../components/ImageStorageDebug'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<string>('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showMusicSearch, setShowMusicSearch] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const user = localStorage.getItem('musicard_user')
    if (!user) {
      navigate('/login')
      return
    }

    setCurrentUser(user)
    await loadUserData(user)
  }

  const loadUserData = async (username: string) => {
    try {
      let userData = await storageService.loadUser(username)
      
      if (!userData) {
        // 新規ユーザーの場合、デフォルトプロフィールを作成
        userData = {
          username,
          displayName: username,
          bio: '',
          baseColor: BASE_COLORS[0], // ライトベースをデフォルトに
          themeColor: THEME_COLORS[0], // ブルーテーマをデフォルトに
          socialLinks: {},
          favoriteGenres: [],
          songs: [],
          gridLayout: GRID_LAYOUTS[1], // デフォルトは4x4
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          isPublic: true
        }
        
        await storageService.saveUser(userData)
        console.log(`🆕 新規ユーザー「${username}」のプロフィールを作成しました`)
      }
      
      setUserProfile(userData)
    } catch (error) {
      console.error('ユーザーデータの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userProfile) return

    setSaving(true)
    try {
      const success = await storageService.saveUser({
        ...userProfile,
        updatedAt: new Date().toISOString()
      })
      
      if (success) {
        console.log('✅ プロフィールを保存しました')
        setToast({
          message: 'プロフィールを保存しました！',
          type: 'success'
        })
      } else {
        setToast({
          message: '保存に失敗しました',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('保存エラー:', error)
      setToast({
        message: '保存中にエラーが発生しました',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('musicard_user')
      localStorage.removeItem('musicard_login_time')
      navigate('/login')
    }
  }

  const handlePreview = () => {
    if (currentUser) {
      // プレビューモードで同じタブで表示
      navigate(`/users/${currentUser}`, { 
        state: { isPreview: true } 
      })
    }
  }

  const handleMusicSelect = (music: SearchResult) => {
    if (!userProfile) return

    const newSong: Song = {
      id: music.id || `${music.name}-${music.artist}`.replace(/\s+/g, '-').toLowerCase(),
      title: music.name,
      artist: music.artist,
      jacket: music.image,
      previewUrl: null,
      addedAt: new Date().toISOString()
    }

    setUserProfile({
      ...userProfile,
      songs: [...userProfile.songs, newSong]
    })
    
    // 楽曲追加後は検索モーダルを閉じる
    setShowMusicSearch(false)
  }

  const removeSong = (songId: string) => {
    if (!userProfile) return

    setUserProfile({
      ...userProfile,
      songs: userProfile.songs.filter(song => song.id !== songId)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">プロフィールの読み込みに失敗しました</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {userProfile.displayName}の音楽名刺
            </h1>
            <p className="text-gray-600">@{currentUser}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors font-medium"
            >
              👁️ プレビュー
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
            >
              {saving ? '保存中...' : '💾 保存'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* デバッグコンポーネント（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && <ImageStorageDebug />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：プロフィール編集 */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">基本情報</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロフィールアイコン
                  </label>
                  <IconUpload
                    currentIcon={userProfile.icon || ''}
                    onIconChange={(iconUrl: string) => setUserProfile({
                      ...userProfile,
                      icon: iconUrl
                    })}
                    username={currentUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示名
                  </label>
                  <input
                    type="text"
                    value={userProfile.displayName}
                    onChange={(e) => setUserProfile({
                      ...userProfile,
                      displayName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({
                      ...userProfile,
                      bio: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="音楽の趣味について..."
                  />
                </div>
              </div>
            </div>

            {/* ベースカラー選択 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">ベースカラー</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  音楽名刺の基本となる背景色を選択してください。
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {BASE_COLORS.map((baseColor) => (
                    <label key={baseColor.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="baseColor"
                        checked={userProfile.baseColor.id === baseColor.id}
                        onChange={() => setUserProfile({
                          ...userProfile,
                          baseColor: baseColor
                        })}
                        className="sr-only"
                      />
                      <div className={`relative p-4 rounded-xl border-2 transition-all ${
                        userProfile.baseColor.id === baseColor.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                      }`}>
                        {/* カラープレビュー */}
                        <div className={`w-full h-8 rounded-lg ${baseColor.background} mb-2 shadow-sm`}></div>
                        
                        {/* テーマ名 */}
                        <p className="text-center text-sm font-medium text-gray-800">{baseColor.name}</p>
                        
                        {/* 選択中インジケーター */}
                        {userProfile.baseColor.id === baseColor.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* テーマカラー選択 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">テーマカラー</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  アイコンの枠線やボタンの色に反映されるテーマカラーを選択してください。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {THEME_COLORS.map((theme) => (
                    <label key={theme.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="themeColor"
                        checked={userProfile.themeColor.id === theme.id}
                        onChange={() => setUserProfile({
                          ...userProfile,
                          themeColor: theme
                        })}
                        className="sr-only"
                      />
                      <div className={`relative p-3 rounded-xl border-2 transition-all ${
                        userProfile.themeColor.id === theme.id
                          ? 'border-gray-400 ring-2 ring-blue-500/20 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                      }`}>
                        {/* カラープレビュー */}
                        <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.gradient} mb-2 shadow-sm`}></div>
                        
                        {/* テーマ名 */}
                        <p className="text-center text-sm font-medium text-gray-800">{theme.name}</p>
                        
                        {/* 選択中インジケーター */}
                        {userProfile.themeColor.id === theme.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* グリッドレイアウト選択 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">グリッドレイアウト</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  音楽名刺のグリッドレイアウトを選択してください
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {GRID_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setUserProfile({
                        ...userProfile,
                        gridLayout: layout
                      })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        userProfile.gridLayout?.id === layout.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">{layout.name}</div>
                      <div className="text-xs text-gray-500">
                        {layout.centerPositions.length === 1 ? '中央1マス' : '中央4マス'}のアイコン配置
                      </div>
                      
                      {/* プレビューグリッド */}
                      <div 
                        className="mt-2 grid gap-0.5 w-12 h-12"
                        style={{
                          gridTemplateColumns: `repeat(${layout.size}, 1fr)`,
                          gridTemplateRows: `repeat(${layout.size}, 1fr)`
                        }}
                      >
                        {Array.from({ length: layout.totalCells }).map((_, index) => {
                          const isCenterCell = layout.centerPositions.includes(index)
                          if (isCenterCell && layout.centerPositions.length === 4 && index !== layout.centerPositions[0]) {
                            return null
                          }
                          
                          return (
                            <div
                              key={index}
                              className={`rounded-sm ${
                                isCenterCell ? 'bg-blue-400' : 'bg-gray-300'
                              }`}
                              style={
                                isCenterCell && layout.centerPositions.length === 4 ? {
                                  gridColumn: `${(layout.centerPositions[0] % layout.size) + 1} / span 2`,
                                  gridRow: `${Math.floor(layout.centerPositions[0] / layout.size) + 1} / span 2`
                                } : {}
                              }
                            />
                          )
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右側：楽曲リスト */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col h-full max-h-[calc(100vh-12rem)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                楽曲リスト ({userProfile.songs.length})
              </h2>
              <button
                onClick={() => setShowMusicSearch(true)}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                曲を追加
              </button>
            </div>
            
            {userProfile.songs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 flex-1 flex items-center justify-center flex-col">
                <div className="text-4xl mb-4">🎵</div>
                <p>まだ楽曲が追加されていません</p>
                <p className="text-sm">右上の「曲を追加」ボタンから楽曲を追加してみましょう</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto pr-2 space-y-3">
                {userProfile.songs.map((song) => (
                  <div key={song.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <img
                      src={song.jacket || '/default-cover.jpg'}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{song.title}</div>
                      <div className="text-sm text-gray-500 truncate">{song.artist}</div>
                    </div>
                    <button
                      onClick={() => {
                        const songId = song.id || `${song.title}-${song.artist}`.replace(/\s+/g, '-').toLowerCase()
                        removeSong(songId)
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 楽曲検索モーダル */}
        {showMusicSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">楽曲を追加</h3>
                <button
                  onClick={() => setShowMusicSearch(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <MusicSearchAutocomplete
                onSelect={handleMusicSelect}
                placeholder="楽曲名やアーティスト名で検索..."
                username={currentUser}
              />
            </div>
          </div>
        )}

        {/* 共有セクション */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">共有</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 mb-3">
              あなたの音楽名刺URL:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${window.location.origin}/users/${currentUser}`}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/users/${currentUser}`)
                  // TODO: コピー完了トーストを表示
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📋 コピー
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
} 