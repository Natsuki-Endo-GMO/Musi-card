// ストレージサービスの抽象化レイヤー
import { UserProfile } from '../types/user'
import { loadAllUsers, saveUser, loadUser as loadUserLocal, incrementViewCount as incrementViewCountLocal } from '../utils/userData'

// ストレージプロバイダーの種類
export type StorageProvider = 'localStorage' | 'vercelBlob'

// 環境変数でストレージプロバイダーを制御（切り戻し容易）
const STORAGE_PROVIDER: StorageProvider = 
  (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'localStorage'

// ストレージインターface
export interface StorageService {
  loadAllUsers(): Promise<Record<string, UserProfile>>
  loadUser(username: string): Promise<UserProfile | null>
  saveUser(userProfile: UserProfile): Promise<boolean>
  incrementViewCount(username: string): Promise<boolean>
  uploadImage?(file: File, path: string): Promise<string>
}

// ローカルストレージ実装（既存システム）
class LocalStorageService implements StorageService {
  async loadAllUsers(): Promise<Record<string, UserProfile>> {
    return Promise.resolve(loadAllUsers())
  }

  async loadUser(username: string): Promise<UserProfile | null> {
    return Promise.resolve(loadUserLocal(username))
  }

  async saveUser(userProfile: UserProfile): Promise<boolean> {
    return Promise.resolve(saveUser(userProfile))
  }

  async incrementViewCount(username: string): Promise<boolean> {
    return Promise.resolve(incrementViewCountLocal(username))
  }
}

// Vercel Blob実装（新システム）
class VercelBlobService implements StorageService {
  private fallback = new LocalStorageService()

  async loadAllUsers(): Promise<Record<string, UserProfile>> {
    try {
      // TODO: Vercel Blobからデータを取得
      console.log('🔄 Vercel Blob実装は準備中です。ローカルストレージにフォールバック中...')
      return await this.fallback.loadAllUsers()
    } catch (error) {
      console.error('Vercel Blobエラー、ローカルストレージにフォールバック:', error)
      return await this.fallback.loadAllUsers()
    }
  }

  async loadUser(username: string): Promise<UserProfile | null> {
    try {
      // TODO: Vercel Blobからユーザーデータを取得
      return await this.fallback.loadUser(username)
    } catch (error) {
      console.error('Vercel Blobエラー、ローカルストレージにフォールバック:', error)
      return await this.fallback.loadUser(username)
    }
  }

  async saveUser(userProfile: UserProfile): Promise<boolean> {
    try {
      // TODO: Vercel Blobにユーザーデータを保存
      return await this.fallback.saveUser(userProfile)
    } catch (error) {
      console.error('Vercel Blobエラー、ローカルストレージにフォールバック:', error)
      return await this.fallback.saveUser(userProfile)
    }
  }

  async incrementViewCount(username: string): Promise<boolean> {
    try {
      return await this.fallback.incrementViewCount(username)
    } catch (error) {
      console.error('Vercel Blobエラー、ローカルストレージにフォールバック:', error)
      return await this.fallback.incrementViewCount(username)
    }
  }

  async uploadImage(file: File, path: string): Promise<string> {
    try {
      // TODO: Vercel Blobに画像アップロード実装
      console.log(`🖼️ 画像アップロード準備中: ${path}`)
      
      // 現在は一時的にData URLを返す（フォールバック）
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('画像アップロードエラー:', error)
      throw error
    }
  }
}

// ストレージサービスのファクトリー
function createStorageService(): StorageService {
  switch (STORAGE_PROVIDER) {
    case 'vercelBlob':
      console.log('🚀 Vercel Blobストレージを使用中（フォールバック付き）')
      return new VercelBlobService()
    case 'localStorage':
    default:
      console.log('💾 ローカルストレージを使用中')
      return new LocalStorageService()
  }
}

// シングルトンストレージサービス
export const storageService = createStorageService()

// 切り戻し用ユーティリティ
export function switchStorageProvider(provider: StorageProvider) {
  console.log(`🔄 ストレージプロバイダーを${provider}に切り替えます`)
  console.log('ページをリロードして変更を適用してください')
  localStorage.setItem('OVERRIDE_STORAGE_PROVIDER', provider)
}

// デバッグ用関数
export function getStorageProviderInfo() {
  return {
    current: STORAGE_PROVIDER,
    available: ['localStorage', 'vercelBlob'] as StorageProvider[],
    override: localStorage.getItem('OVERRIDE_STORAGE_PROVIDER'),
    environment: import.meta.env.VITE_STORAGE_PROVIDER
  }
} 