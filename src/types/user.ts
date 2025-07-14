export interface Song {
  id?: string
  title: string
  artist: string
  jacket?: string
  isGeneratedImage?: boolean
  previewUrl?: string | null
  addedAt?: string
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

export interface BaseColor {
  id: string
  name: string
  background: string
  textPrimary: string
  textSecondary: string
  surface: string
  surfaceHover: string
  border: string
}

export interface ThemeColor {
  id: string
  name: string
  gradient: string
  primary: string
  secondary: string
  primaryHex: string
  secondaryHex: string
}

export interface SocialLinks {
  twitter?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  spotify?: string
  website?: string
}

export interface GridLayout {
  id: string
  name: string
  size: number // 3x3, 4x4, 5x5など
  totalCells: number
  centerPositions: number[] // 中央に配置するセルの位置配列（1マスまたは4マス）
}

export interface UserProfile {
  username: string
  displayName: string
  bio: string
  icon?: string
  baseColor: BaseColor
  themeColor: ThemeColor
  socialLinks: SocialLinks
  location?: string
  occupation?: string
  birthdate?: string
  favoriteGenres: string[]
  songs: Song[]
  gridLayout: GridLayout
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

// ベースカラーの選択肢
export const BASE_COLORS: BaseColor[] = [
  {
    id: 'light',
    name: 'ライト',
    background: 'bg-gradient-to-br from-gray-50 to-gray-100',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-600',
    surface: 'bg-white/80',
    surfaceHover: 'bg-gray-100',
    border: 'border-gray-300'
  },
  {
    id: 'dark',
    name: 'ダーク',
    background: 'bg-black',
    textPrimary: 'text-white',
    textSecondary: 'text-white/80',
    surface: 'bg-white/10',
    surfaceHover: 'bg-white/20',
    border: 'border-white/20'
  }
]

// テーマカラーの選択肢
export const THEME_COLORS: ThemeColor[] = [
  {
    id: 'blue',
    name: 'ブルー',
    gradient: 'from-blue-500 to-blue-600',
    primary: 'blue-500',
    secondary: 'blue-100',
    primaryHex: '#3B82F6',
    secondaryHex: '#DBEAFE'
  },
  {
    id: 'purple',
    name: 'パープル',
    gradient: 'from-purple-500 to-purple-600',
    primary: 'purple-500',
    secondary: 'purple-100',
    primaryHex: '#8B5CF6',
    secondaryHex: '#EDE9FE'
  },
  {
    id: 'green',
    name: 'グリーン',
    gradient: 'from-green-500 to-green-600',
    primary: 'green-500',
    secondary: 'green-100',
    primaryHex: '#10B981',
    secondaryHex: '#DCFCE7'
  },
  {
    id: 'pink',
    name: 'ピンク',
    gradient: 'from-pink-500 to-pink-600',
    primary: 'pink-500',
    secondary: 'pink-100',
    primaryHex: '#EC4899',
    secondaryHex: '#FCE7F3'
  },
  {
    id: 'orange',
    name: 'オレンジ',
    gradient: 'from-orange-500 to-orange-600',
    primary: 'orange-500',
    secondary: 'orange-100',
    primaryHex: '#F97316',
    secondaryHex: '#FED7AA'
  },
  {
    id: 'red',
    name: 'レッド',
    gradient: 'from-red-500 to-red-600',
    primary: 'red-500',
    secondary: 'red-100',
    primaryHex: '#EF4444',
    secondaryHex: '#FEE2E2'
  },
  {
    id: 'indigo',
    name: 'インディゴ',
    gradient: 'from-indigo-500 to-indigo-600',
    primary: 'indigo-500',
    secondary: 'indigo-100',
    primaryHex: '#6366F1',
    secondaryHex: '#E0E7FF'
  },
  {
    id: 'teal',
    name: 'ティール',
    gradient: 'from-teal-500 to-teal-600',
    primary: 'teal-500',
    secondary: 'teal-100',
    primaryHex: '#14B8A6',
    secondaryHex: '#CCFBF1'
  }
]

export const GRID_LAYOUTS: GridLayout[] = [
  {
    id: '3x3',
    name: '3×3 (9セル)',
    size: 3,
    totalCells: 9,
    centerPositions: [4] // 中央1マス (奇数グリッド)
  },
  {
    id: '4x4',
    name: '4×4 (16セル)',
    size: 4,
    totalCells: 16,
    centerPositions: [5, 6, 9, 10] // 中央4マス (偶数グリッド)
  },
  {
    id: '5x5',
    name: '5×5 (25セル)',
    size: 5,
    totalCells: 25,
    centerPositions: [12] // 中央1マス (奇数グリッド)
  },
  {
    id: '6x6',
    name: '6×6 (36セル)',
    size: 6,
    totalCells: 36,
    centerPositions: [14, 15, 20, 21] // 中央4マス (偶数グリッド)
  }
]

export const MUSIC_GENRES = [
  'J-POP', 'K-POP', 'ロック', 'メタル', 'パンク', 'オルタナティブ',
  'インディー', 'エレクトロニカ', 'テクノ', 'ハウス', 'ダブステップ',
  'ヒップホップ', 'R&B', 'ソウル', 'ファンク', 'ジャズ', 'ブルース',
  'フォーク', 'カントリー', 'レゲエ', 'クラシック', 'アニメ', 'ゲーム音楽',
  'ボサノヴァ', 'ラテン', 'ワールドミュージック', 'アンビエント', 'その他'
] 