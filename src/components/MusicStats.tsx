import React from 'react'
import { Song, UserStats } from '../types/user'

interface MusicStatsProps {
  songs: Song[]
  className?: string
}

export default function MusicStats({ songs, className = '' }: MusicStatsProps) {
  // 統計データを計算
  const calculateStats = (): UserStats => {
    const totalSongs = songs.length
    const genreDistribution: { [genre: string]: number } = {}
    const artistDistribution: { [artist: string]: number } = {}
    const decadeDistribution: { [decade: string]: number } = {}
    let totalReleaseYear = 0
    let songsWithYear = 0

    songs.forEach(song => {
      // ジャンル分布
      if (song.genre) {
        genreDistribution[song.genre] = (genreDistribution[song.genre] || 0) + 1
      }

      // アーティスト分布
      artistDistribution[song.artist] = (artistDistribution[song.artist] || 0) + 1

      // 年代分布
      if (song.releaseYear) {
        const decade = `${Math.floor(song.releaseYear / 10) * 10}年代`
        decadeDistribution[decade] = (decadeDistribution[decade] || 0) + 1
        totalReleaseYear += song.releaseYear
        songsWithYear++
      }
    })

    const averageReleaseYear = songsWithYear > 0 ? Math.round(totalReleaseYear / songsWithYear) : 0

    return {
      totalSongs,
      genreDistribution,
      artistDistribution,
      decadeDistribution,
      averageReleaseYear
    }
  }

  const stats = calculateStats()

  // 上位項目を取得
  const getTopItems = (distribution: { [key: string]: number }, limit: number = 5) => {
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
  }

  const topGenres = getTopItems(stats.genreDistribution)
  const topArtists = getTopItems(stats.artistDistribution)
  const topDecades = getTopItems(stats.decadeDistribution)

  // パーセンテージを計算
  const calculatePercentage = (count: number, total: number): number => {
    return total > 0 ? Math.round((count / total) * 100) : 0
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        音楽統計
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本統計 */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">基本情報</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">総楽曲数</span>
              <span className="text-sm font-semibold text-blue-600">{stats.totalSongs}曲</span>
            </div>
            {stats.averageReleaseYear > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">平均リリース年</span>
                <span className="text-sm font-semibold text-blue-600">{stats.averageReleaseYear}年</span>
              </div>
            )}
          </div>
        </div>

        {/* 好きなジャンル */}
        {topGenres.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-2">好きなジャンル</h4>
            <div className="space-y-2">
              {topGenres.map(([genre, count]) => (
                <div key={genre} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{genre}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-purple-200 rounded-full">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${calculatePercentage(count, stats.totalSongs)}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-600 font-medium w-8 text-right">
                      {calculatePercentage(count, stats.totalSongs)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 好きなアーティスト */}
        {topArtists.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">好きなアーティスト</h4>
            <div className="space-y-2">
              {topArtists.map(([artist, count]) => (
                <div key={artist} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate mr-2">{artist}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-green-200 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${calculatePercentage(count, stats.totalSongs)}%` }}
                      />
                    </div>
                    <span className="text-xs text-green-600 font-medium w-8 text-right">
                      {calculatePercentage(count, stats.totalSongs)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 好きな年代 */}
        {topDecades.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-800 mb-2">好きな年代</h4>
            <div className="space-y-2">
              {topDecades.map(([decade, count]) => (
                <div key={decade} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{decade}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-orange-200 rounded-full">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${calculatePercentage(count, stats.totalSongs)}%` }}
                      />
                    </div>
                    <span className="text-xs text-orange-600 font-medium w-8 text-right">
                      {calculatePercentage(count, stats.totalSongs)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 統計が少ない場合のメッセージ */}
      {stats.totalSongs < 3 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 楽曲を追加するとより詳細な統計が表示されます
          </p>
        </div>
      )}
    </div>
  )
} 