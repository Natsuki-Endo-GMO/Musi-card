export interface Song {
  title: string
  artist: string
  jacket: string
  isGeneratedImage?: boolean
  spotify?: {
    id: string
    previewUrl: string | null
    spotifyUrl: string
  }
  youtube?: {
    videoId: string
    title: string
    channelTitle: string
    embedUrl: string
  }
  genre?: string
  releaseYear?: number
}

export interface ThemeColor {
  id: string
  name: string
  gradient: string
  primary: string
  secondary: string
}

export interface SocialLinks {
  twitter?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  spotify?: string
  website?: string
}

export interface UserProfile {
  username: string
  displayName: string
  bio: string
  icon?: string
  themeColor: ThemeColor
  socialLinks: SocialLinks
  location?: string
  occupation?: string
  birthdate?: string
  favoriteGenres: string[]
  songs: Song[]
  createdAt: string
  updatedAt: string
  viewCount: number
  isPublic: boolean
}

export interface UserStats {
  totalSongs: number
  genreDistribution: { [genre: string]: number }
  artistDistribution: { [artist: string]: number }
  decadeDistribution: { [decade: string]: number }
  averageReleaseYear: number
}

// テーマカラーの選択肢
export const THEME_COLORS: ThemeColor[] = [
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
    id: 'red',
    name: 'レッド',
    gradient: 'from-red-500 to-red-600',
    primary: 'red-500',
    secondary: 'red-100'
  },
  {
    id: 'indigo',
    name: 'インディゴ',
    gradient: 'from-indigo-500 to-indigo-600',
    primary: 'indigo-500',
    secondary: 'indigo-100'
  },
  {
    id: 'teal',
    name: 'ティール',
    gradient: 'from-teal-500 to-teal-600',
    primary: 'teal-500',
    secondary: 'teal-100'
  }
]

export const MUSIC_GENRES = [
  'J-POP', 'K-POP', 'ロック', 'メタル', 'パンク', 'オルタナティブ',
  'インディー', 'エレクトロニカ', 'テクノ', 'ハウス', 'ダブステップ',
  'ヒップホップ', 'R&B', 'ソウル', 'ファンク', 'ジャズ', 'ブルース',
  'フォーク', 'カントリー', 'レゲエ', 'クラシック', 'アニメ', 'ゲーム音楽',
  'ボサノヴァ', 'ラテン', 'ワールドミュージック', 'アンビエント', 'その他'
] 