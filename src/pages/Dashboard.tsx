import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserProfile, Song, ThemeColor, THEME_COLORS } from '../types/user'
import { storageService } from '../services/storageService'
import MusicSearchAutocomplete from '../components/MusicSearchAutocomplete'
import { SearchResult } from '../services/musicSearch'

export default function Dashboard() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<string>('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
          themeColor: THEME_COLORS[0],
          socialLinks: {},
          favoriteGenres: [],
          songs: [],
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
        // TODO: 成功トーストを表示
      } else {
        alert('❌ 保存に失敗しました')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('❌ 保存中にエラーが発生しました')
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
      // 新しいタブでプレビューを開く
      window.open(`/users/${currentUser}`, '_blank')
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：プロフィール編集 */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">基本情報</h2>
              
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テーマカラー
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_COLORS.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setUserProfile({
                          ...userProfile,
                          themeColor: theme
                        })}
                        className={`p-3 rounded-lg text-white text-xs font-medium transition-all ${
                          userProfile.themeColor.name === theme.name
                            ? 'ring-2 ring-gray-400 scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                        }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 音楽追加 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">音楽を追加</h2>
              <MusicSearchAutocomplete
                onSelect={handleMusicSelect}
                placeholder="楽曲名やアーティスト名で検索..."
              />
            </div>
          </div>

          {/* 右側：楽曲リスト */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              楽曲リスト ({userProfile.songs.length})
            </h2>
            
            {userProfile.songs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎵</div>
                <p>まだ楽曲が追加されていません</p>
                <p className="text-sm">左側の検索から楽曲を追加してみましょう</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
            )}
          </div>
        </div>

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
    </div>
  )
} 