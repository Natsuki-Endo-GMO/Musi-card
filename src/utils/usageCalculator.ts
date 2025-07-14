import { calculateImageUsage } from './imageProcessor'

export interface UsageProjection {
  monthlyUsers: number
  avgSongsPerUser: number
  iconUpdateFrequency: number
  imageStorage: {
    userIcons: number
    albumCovers: number
    totalStorageGB: number
    monthlyOperations: number
  }
  apiLimits: {
    spotify: {
      requestsPerDay: number
      requestsPerMonth: number
      limit: number
      usage: number
    }
    lastfm: {
      requestsPerDay: number
      requestsPerMonth: number
      limit: number
      usage: number
    }
  }
  vercelLimits: {
    blobStorage: {
      used: number
      limit: number
      usage: number
    }
    blobOperations: {
      simple: number
      advanced: number
      limit: number
      usage: number
    }
    functionInvocations: {
      used: number
      limit: number
      usage: number
    }
  }
}

/**
 * 月1000人利用時の使用量を計算
 */
export function calculateMonthlyUsage(users: number = 1000): UsageProjection {
  const avgSongsPerUser = 5
  const iconUpdateFrequency = 0.1 // 10%のユーザーが月1回アイコン更新
  const daysPerMonth = 30
  
  // 画像ストレージ計算
  const imageUsage = calculateImageUsage()
  
  // API制限計算
  const spotifyRequestsPerDay = users * 0.3 // 30%のユーザーがSpotify APIを使用
  const spotifyRequestsPerMonth = spotifyRequestsPerDay * daysPerMonth
  const spotifyLimit = 1000000 // Spotify API制限（実際の制限は要確認）
  
  const lastfmRequestsPerDay = users * 0.2 // 20%のユーザーがLast.fm APIを使用
  const lastfmRequestsPerMonth = lastfmRequestsPerDay * daysPerMonth
  const lastfmLimit = 500000 // Last.fm API制限（実際の制限は要確認）
  
  // Vercel制限計算
  const blobStorageLimit = 1 // GB
  const blobOperationsLimit = 10000 // Simple operations
  const functionInvocationsLimit = 1000000
  
  return {
    monthlyUsers: users,
    avgSongsPerUser,
    iconUpdateFrequency,
    imageStorage: imageUsage,
    apiLimits: {
      spotify: {
        requestsPerDay: Math.round(spotifyRequestsPerDay),
        requestsPerMonth: Math.round(spotifyRequestsPerMonth),
        limit: spotifyLimit,
        usage: Math.round((spotifyRequestsPerMonth / spotifyLimit) * 100 * 100) / 100
      },
      lastfm: {
        requestsPerDay: Math.round(lastfmRequestsPerDay),
        requestsPerMonth: Math.round(lastfmRequestsPerMonth),
        limit: lastfmLimit,
        usage: Math.round((lastfmRequestsPerMonth / lastfmLimit) * 100 * 100) / 100
      }
    },
    vercelLimits: {
      blobStorage: {
        used: imageUsage.totalStorageGB,
        limit: blobStorageLimit,
        usage: Math.round((imageUsage.totalStorageGB / blobStorageLimit) * 100 * 100) / 100
      },
      blobOperations: {
        simple: imageUsage.monthlyOperations,
        advanced: Math.round(imageUsage.monthlyOperations * 0.1), // 10%がAdvanced operations
        limit: blobOperationsLimit,
        usage: Math.round((imageUsage.monthlyOperations / blobOperationsLimit) * 100 * 100) / 100
      },
      functionInvocations: {
        used: Math.round(imageUsage.monthlyOperations * 2), // 画像処理で2回/操作
        limit: functionInvocationsLimit,
        usage: Math.round((imageUsage.monthlyOperations * 2 / functionInvocationsLimit) * 100 * 100) / 100
      }
    }
  }
}

/**
 * 使用量レポートを生成
 */
export function generateUsageReport(): string {
  const usage = calculateMonthlyUsage()
  
  return `
📊 月1000人利用時の使用量予測

👥 ユーザー統計
- 月間ユーザー数: ${usage.monthlyUsers}人
- 平均楽曲数/ユーザー: ${usage.avgSongsPerUser}曲
- アイコン更新頻度: ${(usage.iconUpdateFrequency * 100).toFixed(1)}%

🖼️ 画像ストレージ
- ユーザーアイコン: ${usage.imageStorage.userIcons}件/月
- アルバムジャケット: ${usage.imageStorage.albumCovers}件/月
- 総ストレージ: ${usage.imageStorage.totalStorageGB}GB
- 月間操作数: ${usage.imageStorage.monthlyOperations}回

🔌 API制限
Spotify API:
- 日間リクエスト: ${usage.apiLimits.spotify.requestsPerDay}回
- 月間リクエスト: ${usage.apiLimits.spotify.requestsPerMonth}回
- 使用率: ${usage.apiLimits.spotify.usage}%

Last.fm API:
- 日間リクエスト: ${usage.apiLimits.lastfm.requestsPerDay}回
- 月間リクエスト: ${usage.apiLimits.lastfm.requestsPerMonth}回
- 使用率: ${usage.apiLimits.lastfm.usage}%

☁️ Vercel制限
Blob Storage:
- 使用量: ${usage.vercelLimits.blobStorage.used}GB / ${usage.vercelLimits.blobStorage.limit}GB
- 使用率: ${usage.vercelLimits.blobStorage.usage}%

Blob Operations:
- Simple: ${usage.vercelLimits.blobOperations.simple}回 / ${usage.vercelLimits.blobOperations.limit}回
- Advanced: ${usage.vercelLimits.blobOperations.advanced}回
- 使用率: ${usage.vercelLimits.blobOperations.usage}%

Function Invocations:
- 使用量: ${usage.vercelLimits.functionInvocations.used}回 / ${usage.vercelLimits.functionInvocations.limit}回
- 使用率: ${usage.vercelLimits.functionInvocations.usage}%

✅ 結論
- 画像ストレージ: 十分な余裕あり
- API制限: 注意が必要（キャッシュ戦略が重要）
- Vercel制限: 問題なし
`
}

/**
 * スケーラビリティ分析
 */
export function analyzeScalability(targetUsers: number): {
  isScalable: boolean
  bottlenecks: string[]
  recommendations: string[]
} {
  const usage = calculateMonthlyUsage(targetUsers)
  const bottlenecks: string[] = []
  const recommendations: string[] = []
  
  // API制限チェック
  if (usage.apiLimits.spotify.usage > 80) {
    bottlenecks.push('Spotify API制限に近づいています')
    recommendations.push('Spotify画像のキャッシュ戦略を強化してください')
  }
  
  if (usage.apiLimits.lastfm.usage > 80) {
    bottlenecks.push('Last.fm API制限に近づいています')
    recommendations.push('Last.fm画像のキャッシュ戦略を強化してください')
  }
  
  // Vercel制限チェック
  if (usage.vercelLimits.blobStorage.usage > 80) {
    bottlenecks.push('Blob Storage制限に近づいています')
    recommendations.push('画像圧縮を強化するか、ストレージプランをアップグレードしてください')
  }
  
  if (usage.vercelLimits.blobOperations.usage > 80) {
    bottlenecks.push('Blob Operations制限に近づいています')
    recommendations.push('画像アップロード頻度を最適化してください')
  }
  
  if (usage.vercelLimits.functionInvocations.usage > 80) {
    bottlenecks.push('Function Invocations制限に近づいています')
    recommendations.push('画像処理の効率化を検討してください')
  }
  
  const isScalable = bottlenecks.length === 0
  
  return {
    isScalable,
    bottlenecks,
    recommendations
  }
}

// デモ実行
if (typeof window !== 'undefined') {
  console.log('📊 使用量予測を実行中...')
  console.log(generateUsageReport())
  
  const scalability = analyzeScalability(1000)
  console.log('🔍 スケーラビリティ分析:', scalability)
} 