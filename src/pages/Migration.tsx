import React from 'react';
import DataMigration from '../components/DataMigration';
import { Link } from 'react-router-dom';
import { useAppConfig } from '../hooks/useAppConfig';

export default function Migration() {
  const { config, loading: configLoading } = useAppConfig();

  // 設定が読み込まれていない、または無効化されている場合は表示しない
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!config?.enableDataMigration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">アクセスできません</h1>
          <p className="text-gray-600">このページは現在利用できません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            データベースマイグレーション
          </h1>
          <p className="text-gray-600 mt-2">
            ローカルストレージのデータをNeonデータベースに移行します
          </p>
        </div>
        
        <DataMigration />
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• マイグレーションは一度だけ実行してください</li>
            <li>• 既存のローカルストレージデータは保持されます</li>
            <li>• 重複データは自動的にスキップされます</li>
            <li>• マイグレーション後もローカルストレージは引き続き使用可能です</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 