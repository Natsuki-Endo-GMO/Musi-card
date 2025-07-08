import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MusicSearchAutocomplete from '../components/MusicSearchAutocomplete'
import IconUpload from '../components/IconUpload'
import { SearchResult } from '../services/musicSearch'

interface Song {
  title: string
  artist: string
  jacket: string
  isGeneratedImage?: boolean
}

// テーマカラーの選択肢
interface ThemeColor {
  id: string
  name: string
  gradient: string
  primary: string
  secondary: string
}

const THEME_COLORS: ThemeColor[] = [
  {
    id: 'blue',
    name: 'ブルー',
    gradient: 'from-blue-500 to-blue-600',
    primary: 'blue-500',
    secondary: 'blue-100'
  },
  {
    id: 'purple',
    name: 'パープル',
    gradient: 'from-purple-500 to-purple-600',
    primary: 'purple-500',
    secondary: 'purple-100'
  },
  {
    id: 'green',
    name: 'グリーン',
    gradient: 'from-green-500 to-green-600',
    primary: 'green-500',
    secondary: 'green-100'
  },
  {
    id: 'pink',
    name: 'ピンク',
    gradient: 'from-pink-500 to-pink-600',
    primary: 'pink-500',
    secondary: 'pink-100'
  },
  {
    id: 'orange',
    name: 'オレンジ',
    gradient: 'from-orange-500 to-orange-600',
    primary: 'orange-500',
    secondary: 'orange-100'
  },
  {
    id: 'indigo',
    name: 'インディゴ',
    gradient: 'from-indigo-500 to-indigo-600',
    primary: 'indigo-500',
    secondary: 'indigo-100'
  }
]

export default function CreateUser() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [userIcon, setUserIcon] = useState<string>('')
  const [themeColor, setThemeColor] = useState<ThemeColor>(THEME_COLORS[0]) // デフォルトはブルー
  const [songs, setSongs] = useState<Song[]>([{ title: '', artist: '', jacket: '' }])

  const addSong = () => {
    setSongs([...songs, { title: '', artist: '', jacket: '' }])
  }

  const removeSong = (index: number) => {
    if (songs.length > 1) {
      setSongs(songs.filter((_, i) => i !== index))
    }
  }

  const updateSong = (index: number, field: keyof Song, value: string | boolean) => {
    const newSongs = [...songs]
    newSongs[index] = { ...newSongs[index], [field]: value }
    setSongs(newSongs)
  }

  const handleMusicSelect = (index: number, result: SearchResult) => {
    const newSongs = [...songs]
    newSongs[index] = {
      title: result.name,
      artist: result.artist,
      jacket: result.image || '',
      isGeneratedImage: result.isGeneratedImage
    }
    setSongs(newSongs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      alert('ユーザー名を入力してください')
      return
    }

    const validSongs = songs.filter(song => song.title.trim() && song.artist.trim())
    
    if (validSongs.length === 0) {
      alert('少なくとも1つの楽曲情報を入力してください')
      return
    }

    try {
      const userData = {
        [username]: {
          username,
          icon: userIcon,
          themeColor: themeColor, // テーマカラー情報を追加
          songs: validSongs,
          createdAt: new Date().toISOString()
        }
      }
      
      // 既存のデータを取得
      const existingData = JSON.parse(localStorage.getItem('musicmeisi_users') || '{}')
      const updatedData = { ...existingData, ...userData }
      
      localStorage.setItem('musicmeisi_users', JSON.stringify(updatedData))
      
      alert('名刺が作成されました！')
      navigate(`/users/${username}`)
    } catch (error) {
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }

  // URLの形式をチェックするヘルパー関数
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-blue-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-900">名刺を作成</h1>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              トップに戻る
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* User Info */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">基本情報</h2>
              
              {/* アイコンアップロード */}
              <div className="mb-6">
                <label className="block text-blue-700 text-sm font-medium mb-2">
                  プロフィールアイコン
                </label>
                <IconUpload
                  onIconChange={setUserIcon}
                  currentIcon={userIcon}
                  className="text-blue-900"
                />
                <p className="text-blue-600 text-sm mt-2">
                  アイコンは任意です。設定しない場合はデフォルトアイコンが表示されます。
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="username" className="block text-blue-700 text-sm font-medium mb-2">
                  ユーザー名 *
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="あなたのユーザー名"
                />
                <p className="text-blue-600 text-sm mt-2">
                  この名前で名刺ページが作成されます: /users/{username || 'yourname'}
                </p>
              </div>

              {/* テーマカラー選択 */}
              <div>
                <label className="block text-blue-700 text-sm font-medium mb-3">
                  名刺テーマカラー
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setThemeColor(color)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                        themeColor.id === color.id
                          ? 'border-blue-500 shadow-lg scale-105'
                          : 'border-blue-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-full h-8 bg-gradient-to-r ${color.gradient} rounded-lg mb-2`}></div>
                      <span className="text-sm text-blue-700 font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-blue-600 text-sm mt-2">
                  選択したカラーが名刺のアクセントカラーとして使用されます
                </p>
              </div>
            </div>

            {/* Songs */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-900">好きな音楽</h2>
                <button
                  type="button"
                  onClick={addSong}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                >
                  曲を追加
                </button>
              </div>

              <div className="space-y-6">
                {songs.map((song, index) => (
                  <div key={index} className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-blue-900 font-medium">曲 {index + 1}</h3>
                      {songs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSong(index)}
                          className="text-red-500 hover:text-red-600 transition-colors duration-300"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* 音楽検索 */}
                      <div>
                        <label className="block text-blue-700 text-sm font-medium mb-2">
                          音楽を検索
                        </label>
                        <MusicSearchAutocomplete
                          onSelect={(result) => handleMusicSelect(index, result)}
                          placeholder="曲名やアーティスト名で検索..."
                          className="mb-3"
                        />
                        <p className="text-blue-600 text-xs">
                          検索して自動入力するか、下記のフィールドに直接入力してください
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-blue-700 text-sm font-medium mb-2">
                            曲名 *
                          </label>
                          <input
                            type="text"
                            value={song.title}
                            onChange={(e) => updateSong(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="曲名を入力"
                          />
                        </div>
                        <div>
                          <label className="block text-blue-700 text-sm font-medium mb-2">
                            アーティスト *
                          </label>
                          <input
                            type="text"
                            value={song.artist}
                            onChange={(e) => updateSong(index, 'artist', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="アーティスト名を入力"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-blue-700 text-sm font-medium mb-2">
                        ジャケット画像URL（任意）
                      </label>
                      <input
                        type="text"
                        value={song.jacket}
                        onChange={(e) => updateSong(index, 'jacket', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-blue-600 text-xs mt-1">
                        未入力の場合はランダム画像が使用されます
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                名刺を作成
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-white text-blue-600 border border-blue-200 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 