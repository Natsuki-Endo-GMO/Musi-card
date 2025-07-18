import React, { useState } from 'react';
import { loadAllUsers } from '../utils/userData';

interface MigrationResult {
  success: boolean;
  message: string;
  migrated: {
    users: number;
    songs: number;
  };
  sources: string[];
  stats: {
    users: string;
    songs: string;
    sessions: string;
  };
}

export default function DataMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // ローカルストレージからデータを取得
      const localStorageData = loadAllUsers();
      
      if (Object.keys(localStorageData).length === 0) {
        setError('ローカルストレージにデータが見つかりません');
        return;
      }

      console.log('📦 マイグレーション対象データ:', localStorageData);

      // マイグレーションAPIを呼び出し
      const response = await fetch('/api/db/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localStorageData: localStorageData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ マイグレーション完了:', data);
      } else {
        setError(data.error || 'マイグレーションに失敗しました');
      }
    } catch (err) {
      console.error('❌ マイグレーションエラー:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalStorageStats = () => {
    const data = loadAllUsers();
    const userCount = Object.keys(data).length;
    const songCount = Object.values(data).reduce((total, user) => total + (user.songs?.length || 0), 0);
    
    return { userCount, songCount };
  };

  const stats = getLocalStorageStats();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📦 データマイグレーション
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">ローカルストレージの状況</h3>
        <div className="text-sm text-blue-700">
          <p>ユーザー数: {stats.userCount}人</p>
          <p>楽曲数: {stats.songCount}曲</p>
        </div>
      </div>

      {stats.userCount === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>マイグレーション対象のデータがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleMigration}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                マイグレーション中...
              </span>
            ) : (
              '🚀 データベースにマイグレーション'
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">エラー</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ マイグレーション完了</p>
              <div className="text-green-700 text-sm space-y-1 mt-2">
                <p>移行されたユーザー: {result.migrated.users}人</p>
                <p>移行された楽曲: {result.migrated.songs}曲</p>
                <p>データソース: {result.sources.join(', ')}</p>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="font-semibold">データベース統計:</p>
                  <p>ユーザー: {result.stats.users}人</p>
                  <p>楽曲: {result.stats.songs}曲</p>
                  <p>セッション: {result.stats.sessions}件</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 