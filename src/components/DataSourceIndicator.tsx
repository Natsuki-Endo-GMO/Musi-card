import React, { useState, useEffect } from 'react';
import { loadAllUsers } from '../utils/userData';

interface DataSourceInfo {
  localStorage: {
    hasData: boolean;
    userCount: number;
    songCount: number;
  };
  database: {
    hasData: boolean;
    userCount: number;
    songCount: number;
    error?: string;
  };
  currentSource: 'localStorage' | 'database' | 'unknown';
}

export default function DataSourceIndicator() {
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    setIsLoading(true);
    
    try {
      // ローカルストレージの確認
      const localStorageData = loadAllUsers();
      const localStorageInfo = {
        hasData: Object.keys(localStorageData).length > 0,
        userCount: Object.keys(localStorageData).length,
        songCount: Object.values(localStorageData).reduce((total, user) => total + (user.songs?.length || 0), 0)
      };

      // データベースの確認
      let databaseInfo: {
        hasData: boolean;
        userCount: number;
        songCount: number;
        error?: string;
      } = {
        hasData: false,
        userCount: 0,
        songCount: 0
      };

      try {
        const response = await fetch('/api/db/users');
        if (response.ok) {
          const data = await response.json();
          databaseInfo = {
            hasData: data.totalUsers > 0,
            userCount: data.totalUsers,
            songCount: data.users?.reduce((total: number, user: any) => total + (parseInt(user.song_count) || 0), 0) || 0
          };
        }
      } catch (error) {
        console.error('データベース確認エラー:', error);
        databaseInfo.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // 現在のデータソースを判定
      let currentSource: 'localStorage' | 'database' | 'unknown' = 'unknown';
      
      if (localStorageInfo.hasData && !databaseInfo.hasData) {
        currentSource = 'localStorage';
      } else if (!localStorageInfo.hasData && databaseInfo.hasData) {
        currentSource = 'database';
      } else if (localStorageInfo.hasData && databaseInfo.hasData) {
        // 両方にデータがある場合は、より多くのデータがある方を優先
        const localStorageTotal = localStorageInfo.userCount + localStorageInfo.songCount;
        const databaseTotal = databaseInfo.userCount + databaseInfo.songCount;
        currentSource = localStorageTotal >= databaseTotal ? 'localStorage' : 'database';
      }

      setDataSourceInfo({
        localStorage: localStorageInfo,
        database: databaseInfo,
        currentSource
      });
    } catch (error) {
      console.error('データソース確認エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">データソース確認中...</span>
        </div>
      </div>
    );
  }

  if (!dataSourceInfo) {
    return null;
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'localStorage':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'database':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'localStorage':
        return '💾';
      case 'database':
        return '🗄️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">データソース</h3>
        <button
          onClick={checkDataSources}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          🔄
        </button>
      </div>

      {/* 現在のデータソース */}
      <div className={`mb-3 p-2 rounded border ${getSourceColor(dataSourceInfo.currentSource)}`}>
        <div className="flex items-center space-x-2">
          <span>{getSourceIcon(dataSourceInfo.currentSource)}</span>
          <span className="font-medium">
            {dataSourceInfo.currentSource === 'localStorage' && 'ローカルストレージ'}
            {dataSourceInfo.currentSource === 'database' && 'データベース'}
            {dataSourceInfo.currentSource === 'unknown' && 'データなし'}
          </span>
        </div>
      </div>

      {/* ローカルストレージ情報 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center space-x-1">
            <span>💾</span>
            <span>ローカルストレージ</span>
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            dataSourceInfo.localStorage.hasData ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {dataSourceInfo.localStorage.userCount}ユーザー / {dataSourceInfo.localStorage.songCount}曲
          </span>
        </div>
      </div>

      {/* データベース情報 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center space-x-1">
            <span>🗄️</span>
            <span>データベース</span>
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            dataSourceInfo.database.hasData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {dataSourceInfo.database.userCount}ユーザー / {dataSourceInfo.database.songCount}曲
          </span>
        </div>
      </div>

      {/* エラー表示 */}
      {dataSourceInfo.database.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          DB接続エラー: {dataSourceInfo.database.error}
        </div>
      )}

      {/* マイグレーションリンク */}
      {(dataSourceInfo.localStorage.hasData && dataSourceInfo.database.hasData) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a
            href="/migration"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            📦 データマイグレーション
          </a>
        </div>
      )}
    </div>
  );
} 