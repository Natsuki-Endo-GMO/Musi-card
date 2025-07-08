// 音楽検索機能テストコード
import { 
  searchMusic, 
  getLastSearchStatus, 
  clearSearchStatus, 
  getCurrentProvider, 
  setMusicProvider,
  getAvailableProviders,
  getSpotifyAccessToken,
  SearchResult 
} from './musicSearch'

// テスト結果の型定義
interface TestResult {
  testName: string
  success: boolean
  results: SearchResult[]
  searchStatus: any[]
  provider: string
  errorDetails?: string
  duration: number
}

// 環境情報を取得
const getEnvironmentInfo = () => {
  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY
  const spotifyToken = getSpotifyAccessToken()
  
  return {
    spotifyClientId: spotifyClientId ? '設定済み' : '未設定',
    lastfmApiKey: lastfmApiKey && lastfmApiKey !== 'YOUR_LASTFM_API_KEY' ? '設定済み' : '未設定',
    spotifyToken: spotifyToken ? `設定済み (${spotifyToken.substring(0, 20)}...)` : '未設定',
    availableProviders: getAvailableProviders(),
    currentProvider: getCurrentProvider()
  }
}

// 単一テストの実行
const runSingleTest = async (testName: string, query: string, provider?: string): Promise<TestResult> => {
  console.group(`🧪 テスト開始: ${testName}`)
  
  const startTime = Date.now()
  clearSearchStatus()
  
  if (provider) {
    setMusicProvider(provider as any)
    console.log(`📋 プロバイダーを ${provider.toUpperCase()} に変更`)
  }
  
  try {
    console.log(`🔍 検索クエリ: "${query}"`)
    const results = await searchMusic(query)
    const searchStatus = getLastSearchStatus()
    const currentProvider = getCurrentProvider()
    const duration = Date.now() - startTime
    
    const testResult: TestResult = {
      testName,
      success: results.length > 0,
      results,
      searchStatus,
      provider: currentProvider,
      duration
    }
    
    console.log(`✅ テスト完了: ${results.length}件の結果 (${duration}ms)`)
    console.log('📊 検索結果:', results.map(r => `${r.name} - ${r.artist} (${r.provider})`))
    
    console.groupEnd()
    return testResult
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    const searchStatus = getLastSearchStatus()
    
    const testResult: TestResult = {
      testName,
      success: false,
      results: [],
      searchStatus,
      provider: getCurrentProvider(),
      errorDetails: error.message,
      duration
    }
    
    console.error(`❌ テスト失敗: ${error.message} (${duration}ms)`)
    console.groupEnd()
    return testResult
  }
}

// 包括的テストスイートの実行
export const runMusicSearchTests = async (): Promise<void> => {
  console.clear()
  console.log('🎵 音楽検索機能 - 詳細テスト開始')
  console.log('='.repeat(60))
  
  // 環境情報の表示
  console.group('🔧 環境情報')
  const envInfo = getEnvironmentInfo()
  Object.entries(envInfo).forEach(([key, value]) => {
    console.log(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  })
  console.groupEnd()
  
  console.log('\n')
  
  const testResults: TestResult[] = []
  
  // テストケース定義
  const testCases = [
    { name: 'Spotify - 人気楽曲', query: 'Bohemian Rhapsody Queen', provider: 'spotify' },
    { name: 'Spotify - 日本語楽曲', query: '紅蓮華 LiSA', provider: 'spotify' },
    { name: 'Spotify - 短いクエリ', query: 'Beatles', provider: 'spotify' },
    { name: 'Spotify - 長いクエリ', query: 'Stairway to Heaven Led Zeppelin', provider: 'spotify' },
    { name: 'Last.fm - 人気楽曲', query: 'Bohemian Rhapsody Queen', provider: 'lastfm' },
    { name: 'Last.fm - 日本語楽曲', query: '紅蓮華 LiSA', provider: 'lastfm' },
    { name: 'Last.fm - 短いクエリ', query: 'Beatles', provider: 'lastfm' },
    { name: 'デフォルト - プロバイダー自動選択', query: 'Imagine John Lennon', provider: undefined },
    { name: 'エラーテスト - 空クエリ', query: '', provider: undefined },
    { name: 'エラーテスト - 特殊文字', query: '!@#$%^&*()', provider: undefined }
  ]
  
  // 各テストケースを実行
  for (const testCase of testCases) {
    const result = await runSingleTest(testCase.name, testCase.query, testCase.provider)
    testResults.push(result)
    
    // テスト間に少し間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 結果サマリーの表示
  console.log('\n')
  console.group('📊 テスト結果サマリー')
  
  const successfulTests = testResults.filter(r => r.success)
  const failedTests = testResults.filter(r => !r.success)
  
  console.log(`✅ 成功: ${successfulTests.length}/${testResults.length}`)
  console.log(`❌ 失敗: ${failedTests.length}/${testResults.length}`)
  console.log(`⏱️ 平均実行時間: ${Math.round(testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length)}ms`)
  
  // 失敗したテストの詳細
  if (failedTests.length > 0) {
    console.group('❌ 失敗したテスト詳細')
    failedTests.forEach(test => {
      console.group(`🔍 ${test.testName}`)
      console.log(`プロバイダー: ${test.provider}`)
      console.log(`エラー: ${test.errorDetails || 'Unknown'}`)
      console.log('検索状況:', test.searchStatus)
      console.groupEnd()
    })
    console.groupEnd()
  }
  
  // プロバイダー別の成功率
  console.group('📈 プロバイダー別成功率')
  const providerStats: Record<string, { total: number; success: number }> = testResults.reduce((stats, result) => {
    const provider = result.provider
    if (!stats[provider]) {
      stats[provider] = { total: 0, success: 0 }
    }
    stats[provider].total++
    if (result.success) {
      stats[provider].success++
    }
    return stats
  }, {} as Record<string, { total: number; success: number }>)
  
  Object.entries(providerStats).forEach(([provider, stats]) => {
    const rate = Math.round((stats.success / stats.total) * 100)
    console.log(`${provider.toUpperCase()}: ${stats.success}/${stats.total} (${rate}%)`)
  })
  console.groupEnd()
  
  // 検索状況の詳細分析
  console.group('🔍 検索状況詳細分析')
  const allStatuses = testResults.flatMap(r => r.searchStatus)
  const statusByProvider: Record<string, { success: number; failure: number; errors: string[] }> = allStatuses.reduce((stats, status) => {
    const provider = status.provider
    if (!stats[provider]) {
      stats[provider] = { success: 0, failure: 0, errors: [] }
    }
    if (status.success) {
      stats[provider].success++
    } else {
      stats[provider].failure++
      if (status.error) {
        stats[provider].errors.push(status.error)
      }
    }
    return stats
  }, {} as Record<string, { success: number; failure: number; errors: string[] }>)
  
  Object.entries(statusByProvider).forEach(([provider, stats]) => {
    console.group(`📊 ${provider.toUpperCase()} 統計`)
    console.log(`成功: ${stats.success}回`)
    console.log(`失敗: ${stats.failure}回`)
    if (stats.errors.length > 0) {
      console.log('主なエラー:')
      const uniqueErrors = [...new Set(stats.errors)]
      uniqueErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
    console.groupEnd()
  })
  console.groupEnd()
  
  console.groupEnd()
  
  console.log('\n🎯 テスト完了！上記の結果から問題の原因を特定できます。')
  console.log('💡 主な確認ポイント:')
  console.log('   • Spotify API のエラーメッセージ')
  console.log('   • フォールバック理由')
  console.log('   • 環境変数の設定状況')
  console.log('   • プロバイダー別の成功率')
}

// 個別のプロバイダーテスト
export const testSpotifyOnly = async (query: string = 'Beatles') => {
  console.group('🎧 Spotify 専用テスト')
  await runSingleTest('Spotify専用テスト', query, 'spotify')
  console.groupEnd()
}

export const testLastfmOnly = async (query: string = 'Beatles') => {
  console.group('🎵 Last.fm 専用テスト')
  await runSingleTest('Last.fm専用テスト', query, 'lastfm')
  console.groupEnd()
}

// 環境情報のみ表示
export const showEnvironmentInfo = () => {
  console.group('🔧 現在の環境情報')
  const envInfo = getEnvironmentInfo()
  Object.entries(envInfo).forEach(([key, value]) => {
    const icon = key.includes('spotify') ? '🟢' : key.includes('lastfm') ? '🔴' : '⚙️'
    console.log(`${icon} ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  })
  console.groupEnd()
}

/**
 * Spotify設定状況を詳細に診断
 */
export function diagnosSpotifySetup() {
  console.group('🔍 Spotify設定診断')
  
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback'
  
  console.log('📋 環境変数設定状況:')
  console.log(`   VITE_SPOTIFY_CLIENT_ID: ${clientId ? '✅ 設定済み' : '❌ 未設定'}`)
  console.log(`   VITE_SPOTIFY_CLIENT_SECRET: ${clientSecret ? '✅ 設定済み' : '❌ 未設定'}`)
  console.log(`   VITE_SPOTIFY_REDIRECT_URI: ${redirectUri}`)
  
  // 現在のURL確認
  console.log(`   現在のOrigin: ${window.location.origin}`)
  console.log(`   設定されたRedirect URI: ${redirectUri}`)
  
  // プロトコル確認
  const isHttps = window.location.protocol === 'https:'
  const isLoopback = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  console.log(`   プロトコル: ${window.location.protocol}`)
  console.log(`   ホスト: ${window.location.hostname} ${isLoopback ? '✅ ループバック' : ''}`)
  
  if (isLoopback && !isHttps) {
    console.log('✅ ループバックアドレス(127.0.0.1)使用でHTTPでも登録可能')
  }
  
  if (!clientId || clientId === 'your_spotify_client_id_here') {
    console.error('❌ Client IDが未設定です')
    console.log('📝 設定手順:')
    console.log('   1. プロジェクトルートに .env ファイルを作成')
    console.log('   2. VITE_SPOTIFY_CLIENT_ID=実際のClientID を追記')
    console.log('   3. VITE_SPOTIFY_CLIENT_SECRET=実際のClientSecret を追記')
    console.log('   4. VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback を追記')
    console.log('   5. npm run dev または npm run dev:local で開発サーバーを起動')
  } else if (!clientSecret || clientSecret === 'your_spotify_client_secret_here') {
    console.error('❌ Client Secretが未設定です（Authorization Code Flowに必要）')
  } else {
    console.log('✅ Client ID・Secret設定済み')
    
    // 認証URLをテスト生成
    try {
      const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: 'user-read-private user-read-email user-top-read',
        redirect_uri: redirectUri,
        show_dialog: 'true',
        state: 'test_state'
      }).toString()}`
      
      console.log('🔗 認証URL (テスト用):')
      console.log(`   ${authUrl}`)
      console.log('💡 上記URLをブラウザで開いてテスト可能')
      
      // ローカルストレージ確認
      const accessToken = localStorage.getItem('spotify_access_token')
      const refreshToken = localStorage.getItem('spotify_refresh_token')
      const expiresAt = localStorage.getItem('spotify_token_expires')
      
      console.log('🔑 保存されたトークン情報:')
      console.log(`   Access Token: ${accessToken ? '✅ あり' : '❌ なし'}`)
      console.log(`   Refresh Token: ${refreshToken ? '✅ あり' : '❌ なし'}`)
      
      if (expiresAt) {
        const expirationDate = new Date(parseInt(expiresAt))
        const isExpired = Date.now() >= parseInt(expiresAt)
        console.log(`   Token有効期限: ${expirationDate.toLocaleString()} ${isExpired ? '⚠️ 期限切れ' : '✅ 有効'}`)
      }
      
    } catch (error) {
      console.error('❌ 認証URL生成エラー:', error)
    }
  }
  
  console.log('\n🎯 Spotify Developer Dashboard設定確認事項:')
  console.log('   • 「App settings」→「Redirect URIs」')
  console.log(`   • Redirect URIに "${redirectUri}" が正確に登録されている`)
  console.log('   • ループバックアドレス(127.0.0.1)ならHTTPでも登録可能')
  console.log('   • プロトコル、ホスト、ポート番号まで完全一致')
  
  console.log('\n🚀 開発サーバーの起動方法:')
  console.log('   • 標準: npm run dev')
  console.log('   • 127.0.0.1指定: npm run dev:local')
  console.log('   • アクセスURL: http://127.0.0.1:5173')
  
  console.groupEnd()
}

// グローバルに関数をエクスポート（ブラウザコンソールから使用可能）
if (typeof window !== 'undefined') {
  (window as any).musicSearchTest = {
    runAllTests: runMusicSearchTests,
    testSpotify: testSpotifyOnly,
    testLastfm: testLastfmOnly,
    showEnv: showEnvironmentInfo,
    diagnosSpotifySetup
  }
  
  console.log('🎯 テスト関数をグローバルに登録しました:')
  console.log('   • musicSearchTest.runAllTests() - 全テスト実行')
  console.log('   • musicSearchTest.testSpotify("query") - Spotify単体テスト')
  console.log('   • musicSearchTest.testLastfm("query") - Last.fm単体テスト')
  console.log('   • musicSearchTest.showEnv() - 環境情報表示')
  console.log('   • musicSearchTest.diagnosSpotifySetup() - Spotify設定診断')
} 