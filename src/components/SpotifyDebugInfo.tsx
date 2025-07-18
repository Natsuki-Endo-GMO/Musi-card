import { spotifyAuth } from '../services/spotifyApi';
import React from 'react';

// Spotify設定情報（API経由で取得）
const getSpotifyConfig = async () => {
  try {
    const response = await fetch('/api/config?type=spotify');
    const config = await response.json();
    return {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      environment: config.environment,
      isProduction: config.isProduction
    };
  } catch (error) {
    console.error('Spotify設定の取得に失敗:', error);
    return {
      clientId: '取得失敗',
      redirectUri: '取得失敗',
      environment: 'unknown',
      isProduction: false
    };
  }
};

export default function SpotifyDebugInfo() {
  const [config, setConfig] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConfig = async () => {
      const spotifyConfig = await getSpotifyConfig();
      setConfig(spotifyConfig);
      setLoading(false);
    };
    loadConfig();
  }, []);

  if (loading) {
    return <div>Spotify設定を読み込み中...</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Spotify設定情報</h3>
      <div className="space-y-2 text-sm">
        <div>Client ID: {config?.clientId ? '✅ 設定済み' : '❌ 未設定'}</div>
        <div>Redirect URI: {config?.redirectUri || 'not set'}</div>
        <div>Environment: {config?.environment}</div>
        <div>Production: {config?.isProduction ? 'Yes' : 'No'}</div>
        <div>Current Redirect URI: {spotifyAuth.getCurrentRedirectUri()}</div>
      </div>
    </div>
  );
}; 