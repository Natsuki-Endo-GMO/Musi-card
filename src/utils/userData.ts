import { UserProfile, GRID_LAYOUTS, BASE_COLORS, THEME_COLORS } from '../types/user'

// LocalStorageのキー
const STORAGE_KEY = 'musicmeisi_users'
const BACKUP_KEY = 'musicmeisi_users_backup'

// ユーザーデータの型
export interface UserDataStore {
  [username: string]: UserProfile
}

// エラーハンドリング付きでLocalStorageからデータを読み込み
export const loadAllUsers = (): UserDataStore => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) {
      console.log('📂 ユーザーデータが見つかりません。新しいストレージを初期化します')
      return {}
    }

    const users = JSON.parse(storedData) as UserDataStore
    console.log(`📂 ${Object.keys(users).length}人のユーザーデータを読み込みました`)
    
    // データ構造の検証
    const validUsers: UserDataStore = {}
    for (const [username, userData] of Object.entries(users)) {
      if (isValidUserProfile(userData)) {
        validUsers[username] = userData
      } else {
        console.warn(`⚠️ 無効なユーザーデータをスキップ: ${username}`)
      }
    }
    
    return validUsers
  } catch (error) {
    console.error('❌ ユーザーデータの読み込みに失敗:', error)
    return {}
  }
}

// 特定のユーザーデータを読み込み（マイグレーション処理付き）
export const loadUser = (username: string): UserProfile | null => {
  try {
    const allUsers = loadAllUsers()
    const userData = allUsers[username]
    
    if (!userData) {
      return null
    }
    
    // マイグレーション: 新しいプロパティの確認と更新
    let needsMigration = false
    let migratedData = { ...userData }
    
    // baseColorプロパティの追加
    if (!userData.baseColor) {
      migratedData.baseColor = BASE_COLORS[0] // ライトベースをデフォルトに
      needsMigration = true
      console.log(`🔄 ユーザー「${username}」: baseColorを追加`)
    }
    
    // gridLayoutプロパティの確認と更新
    if (!userData.gridLayout) {
      // gridLayoutが存在しない場合はデフォルト値を設定
      migratedData.gridLayout = GRID_LAYOUTS[1] // デフォルトは4x4（Dashboard.tsxと統一）
      needsMigration = true
      console.log(`🔄 ユーザー「${username}」: gridLayoutを追加`)
    } else if (userData.gridLayout && 'centerPosition' in userData.gridLayout) {
      // 古いcenterPositionプロパティから新しいcenterPositionsに移行
      const oldLayout = userData.gridLayout as any
      const newLayout = GRID_LAYOUTS.find(layout => layout.size === oldLayout.size) || GRID_LAYOUTS[1]
      migratedData.gridLayout = newLayout
      needsMigration = true
      console.log(`🔄 ユーザー「${username}」: centerPosition → centerPositions に更新`)
    }
    
    if (needsMigration) {
      // マイグレーション後のデータを保存
      saveUser(migratedData)
      console.log(`✅ ユーザー「${username}」のデータマイグレーションが完了しました`)
      return migratedData
    }
    
    return userData
  } catch (error) {
    console.error(`❌ ユーザー「${username}」の読み込みに失敗:`, error)
    return null
  }
}

// ユーザーデータを保存
export const saveUser = (userProfile: UserProfile): boolean => {
  try {
    // 既存データを読み込み
    const allUsers = loadAllUsers()
    
    // バックアップを作成
    createBackup(allUsers)
    
    // 新しいユーザーデータを追加/更新
    allUsers[userProfile.username] = {
      ...userProfile,
      updatedAt: new Date().toISOString()
    }
    
    // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers))
    
    console.log(`💾 ユーザー「${userProfile.username}」のデータを保存しました`)
    console.log(`📊 現在の総ユーザー数: ${Object.keys(allUsers).length}人`)
    
    return true
  } catch (error) {
    console.error(`❌ ユーザー「${userProfile.username}」の保存に失敗:`, error)
    return false
  }
}

// ユーザーデータを削除
export const deleteUser = (username: string): boolean => {
  try {
    const allUsers = loadAllUsers()
    
    if (!allUsers[username]) {
      console.warn(`⚠️ ユーザー「${username}」は存在しません`)
      return false
    }
    
    // バックアップを作成
    createBackup(allUsers)
    
    // ユーザーデータを削除
    delete allUsers[username]
    
    // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers))
    
    console.log(`🗑️ ユーザー「${username}」のデータを削除しました`)
    console.log(`📊 現在の総ユーザー数: ${Object.keys(allUsers).length}人`)
    
    return true
  } catch (error) {
    console.error(`❌ ユーザー「${username}」の削除に失敗:`, error)
    return false
  }
}

// ユーザーリストを取得
export const getUserList = (): Array<{ username: string; displayName: string; songCount: number; viewCount: number; updatedAt: string }> => {
  try {
    const allUsers = loadAllUsers()
    
    return Object.entries(allUsers).map(([username, userData]) => ({
      username,
      displayName: userData.displayName || username,
      songCount: userData.songs?.length || 0,
      viewCount: userData.viewCount || 0,
      updatedAt: userData.updatedAt || userData.createdAt || ''
    })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error('❌ ユーザーリストの取得に失敗:', error)
    return []
  }
}

// 訪問者数を増加
export const incrementViewCount = (username: string): boolean => {
  try {
    const allUsers = loadAllUsers()
    
    if (!allUsers[username]) {
      console.warn(`⚠️ ユーザー「${username}」は存在しません`)
      return false
    }
    
    allUsers[username].viewCount = (allUsers[username].viewCount || 0) + 1
    allUsers[username].updatedAt = new Date().toISOString()
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers))
    
    return true
  } catch (error) {
    console.error(`❌ 訪問者数の更新に失敗:`, error)
    return false
  }
}

// バックアップを作成
export const createBackup = (data?: UserDataStore): boolean => {
  try {
    const backupData = data || loadAllUsers()
    const backup = {
      data: backupData,
      timestamp: new Date().toISOString(),
      userCount: Object.keys(backupData).length
    }
    
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    console.log(`💾 バックアップを作成しました (${backup.userCount}人のユーザー)`)
    
    return true
  } catch (error) {
    console.error('❌ バックアップの作成に失敗:', error)
    return false
  }
}

// バックアップから復元
export const restoreFromBackup = (): boolean => {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY)
    if (!backupData) {
      console.warn('⚠️ バックアップデータが見つかりません')
      return false
    }
    
    const backup = JSON.parse(backupData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.data))
    
    console.log(`🔄 バックアップから復元しました (${backup.userCount}人のユーザー)`)
    console.log(`📅 バックアップ作成日時: ${new Date(backup.timestamp).toLocaleString()}`)
    
    return true
  } catch (error) {
    console.error('❌ バックアップからの復元に失敗:', error)
    return false
  }
}

// ユーザーデータをエクスポート
export const exportUserData = (): string => {
  try {
    const allUsers = loadAllUsers()
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userCount: Object.keys(allUsers).length,
      users: allUsers
    }
    
    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    console.error('❌ データのエクスポートに失敗:', error)
    return ''
  }
}

// ユーザーデータをインポート
export const importUserData = (jsonData: string): boolean => {
  try {
    const importData = JSON.parse(jsonData)
    
    if (!importData.users || typeof importData.users !== 'object') {
      throw new Error('無効なデータ形式です')
    }
    
    // 既存データのバックアップを作成
    createBackup()
    
    // インポートデータを保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(importData.users))
    
    console.log(`📥 データをインポートしました (${Object.keys(importData.users).length}人のユーザー)`)
    
    return true
  } catch (error) {
    console.error('❌ データのインポートに失敗:', error)
    return false
  }
}

// ユーザープロフィールの有効性を検証
const isValidUserProfile = (userData: any): userData is UserProfile => {
  if (!userData || typeof userData !== 'object') return false
  
  const required = ['username', 'displayName', 'songs', 'createdAt']
  return required.every(field => field in userData)
}

// 統計情報を取得
export const getStorageStats = () => {
  try {
    const allUsers = loadAllUsers()
    const totalUsers = Object.keys(allUsers).length
    let totalSongs = 0
    let totalViews = 0
    
    Object.values(allUsers).forEach(user => {
      totalSongs += user.songs?.length || 0
      totalViews += user.viewCount || 0
    })
    
    const storageSize = new Blob([JSON.stringify(allUsers)]).size
    
    return {
      totalUsers,
      totalSongs,
      totalViews,
      storageSizeBytes: storageSize,
      storageSizeKB: Math.round(storageSize / 1024 * 100) / 100
    }
  } catch (error) {
    console.error('❌ 統計情報の取得に失敗:', error)
    return {
      totalUsers: 0,
      totalSongs: 0,
      totalViews: 0,
      storageSizeBytes: 0,
      storageSizeKB: 0
    }
  }
} 