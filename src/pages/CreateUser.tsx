import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MusicSearchAutocomplete from '../components/MusicSearchAutocomplete'
import IconUpload from '../components/IconUpload'
import { SearchResult } from '../services/musicSearch'
import { UserProfile, Song, ThemeColor, THEME_COLORS, BASE_COLORS, MUSIC_GENRES, GRID_LAYOUTS } from '../types/user'
import { saveUser } from '../utils/userData'

export default function CreateUser() {
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    displayName: '',
    bio: '',
    baseColor: BASE_COLORS[0], // ライトベースをデフォルトに
    themeColor: THEME_COLORS[0],
    socialLinks: {},
    favoriteGenres: [],
    songs: [],
    gridLayout: GRID_LAYOUTS[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    isPublic: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const addSong = () => {
    if (userProfile.songs.length < 20) {
      setUserProfile(prev => ({
        ...prev,
        songs: [...prev.songs, { title: '', artist: '', jacket: '', genre: '', releaseYear: undefined }]
      }))
    }
  }

  const removeSong = (index: number) => {
    setUserProfile(prev => ({
      ...prev,
      songs: prev.songs.filter((_, i) => i !== index)
    }))
  }

  const updateSong = (index: number, field: keyof Song, value: string | number | boolean) => {
    setUserProfile(prev => ({
      ...prev,
      songs: prev.songs.map((song, i) => 
        i === index ? { ...song, [field]: value } : song
      )
    }))
  }

  const handleMusicSelect = (index: number, result: SearchResult) => {
    updateSong(index, 'title', result.name)
    updateSong(index, 'artist', result.artist)
    updateSong(index, 'jacket', result.image || '')
    updateSong(index, 'isGeneratedImage', result.isGeneratedImage || false)
  }

  const handleGenreToggle = (genre: string) => {
    setUserProfile(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre]
    }))
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    setUserProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url.trim() || undefined
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!userProfile.username.trim()) {
      newErrors.username = 'ユーザー名は必須です'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userProfile.username)) {
      newErrors.username = 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用可能です'
    }

    if (!userProfile.displayName.trim()) {
      newErrors.displayName = '表示名は必須です'
    }

    if (userProfile.songs.length === 0) {
      newErrors.songs = '最低1曲は追加してください'
    }

    const hasIncompleteSongs = userProfile.songs.some(song => !song.title || !song.artist)
    if (hasIncompleteSongs) {
      newErrors.songs = '全ての楽曲のタイトルとアーティストを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      // 新しいデータ管理ユーティリティを使用
      if (saveUser(userProfile)) {
        // 成功メッセージを表示してユーザーページに遷移
        navigate(`/users/${userProfile.username}`)
      } else {
        setErrors({ submit: 'データの保存に失敗しました' })
      }
    } catch (error) {
      console.error('データの保存に失敗しました:', error)
      setErrors({ submit: 'データの保存に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">音楽名刺を作成</h1>
            <p className="text-gray-600">あなたの音楽の好みを世界に発信しましょう</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">基本情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザー名 *
                  </label>
                  <input
                    type="text"
                    value={userProfile.username}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example_user"
                    required
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示名 *
                  </label>
                  <input
                    type="text"
                    value={userProfile.displayName}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="山田太郎"
                    required
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自己紹介
                </label>
                <textarea
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="音楽が大好きです！様々なジャンルを聴きます。"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    居住地
                  </label>
                  <input
                    type="text"
                    value={userProfile.location || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="東京都渋谷区"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    職業
                  </label>
                  <input
                    type="text"
                    value={userProfile.occupation || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, occupation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="エンジニア"
                  />
                </div>
              </div>
            </div>

            {/* アイコンとカラー設定 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">外観設定</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール画像
                </label>
                <IconUpload 
                  currentIcon={userProfile.icon} 
                  onIconChange={(icon) => setUserProfile(prev => ({ ...prev, icon }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ベースカラー選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ベースカラー
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    音楽名刺の基本となる背景色を選択してください。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {BASE_COLORS.map((baseColor) => (
                      <label key={baseColor.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="baseColor"
                          checked={userProfile.baseColor.id === baseColor.id}
                          onChange={() => setUserProfile(prev => ({ ...prev, baseColor: baseColor }))}
                          className="sr-only"
                        />
                        <div className={`relative p-3 rounded-lg border-2 transition-all ${
                          userProfile.baseColor.id === baseColor.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`w-full h-6 rounded-lg ${baseColor.background} mb-2`}></div>
                          <p className="text-sm font-medium text-gray-800">{baseColor.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* テーマカラー選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テーマカラー
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    アイコンの枠線やボタンの色に反映されます。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {THEME_COLORS.map((color) => (
                      <label key={color.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="themeColor"
                          checked={userProfile.themeColor.id === color.id}
                          onChange={() => setUserProfile(prev => ({ ...prev, themeColor: color }))}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 transition-all ${
                          userProfile.themeColor.id === color.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`w-full h-6 rounded-lg bg-gradient-to-r ${color.gradient} mb-2`}></div>
                          <p className="text-sm font-medium text-gray-800">{color.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SNSリンク */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">SNSリンク</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={userProfile.socialLinks.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={userProfile.socialLinks.instagram || ''}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spotify
                  </label>
                  <input
                    type="url"
                    value={userProfile.socialLinks.spotify || ''}
                    onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://open.spotify.com/user/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={userProfile.socialLinks.website || ''}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* 好きなジャンル */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">好きなジャンル</h2>
              <p className="text-gray-600 mb-4">最大5つまで選択できます</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {MUSIC_GENRES.map((genre) => (
                  <label key={genre} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.favoriteGenres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      disabled={!userProfile.favoriteGenres.includes(genre) && userProfile.favoriteGenres.length >= 5}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                      userProfile.favoriteGenres.includes(genre)
                        ? `border-${userProfile.themeColor.primary} bg-${userProfile.themeColor.primary}/10 text-${userProfile.themeColor.primary}`
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${
                      !userProfile.favoriteGenres.includes(genre) && userProfile.favoriteGenres.length >= 5
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}>
                      <p className="text-sm font-medium">{genre}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 楽曲リスト */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">お気に入りの楽曲</h2>
                <button
                  type="button"
                  onClick={addSong}
                  disabled={userProfile.songs.length >= 20}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userProfile.songs.length >= 20
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  楽曲を追加
                </button>
              </div>

              {errors.songs && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.songs}</p>
                </div>
              )}

              <div className="space-y-4">
                {userProfile.songs.map((song, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">楽曲 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSong(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                                         <MusicSearchAutocomplete
                       onSelect={(result) => handleMusicSelect(index, result)}
                       placeholder="曲名やアーティスト名を検索..."
                     />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ジャンル
                        </label>
                        <select
                          value={song.genre || ''}
                          onChange={(e) => updateSong(index, 'genre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">選択してください</option>
                          {MUSIC_GENRES.map((genre) => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          リリース年
                        </label>
                                                 <input
                           type="number"
                           value={song.releaseYear || ''}
                           onChange={(e) => {
                             const year = parseInt(e.target.value)
                             updateSong(index, 'releaseYear', isNaN(year) ? '' : year)
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="2023"
                           min="1900"
                           max={new Date().getFullYear()}
                         />
                      </div>
                    </div>

                    {song.jacket && (
                      <div className="mt-3">
                        <img 
                          src={song.jacket} 
                          alt={`${song.title} - ${song.artist}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {userProfile.songs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p>楽曲を追加してください</p>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="text-center">
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:scale-105'
                } shadow-lg hover:shadow-xl`}
              >
                {isSubmitting ? '作成中...' : '音楽名刺を作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 