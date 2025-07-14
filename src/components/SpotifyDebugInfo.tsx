import { spotifyAuth } from '../services/spotifyApi';

export default function SpotifyDebugInfo() {
  const debugInfo = {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    redirectUri: spotifyAuth.getCurrentRedirectUri(),
    environment: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
    port: typeof window !== 'undefined' ? window.location.port : 'unknown',
    envVar: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'not set',
    hasCodeVerifier: typeof window !== 'undefined' ? !!localStorage.getItem('spotify_code_verifier') : false,
    hasSavedState: typeof window !== 'undefined' ? !!localStorage.getItem('spotify_auth_state') : false,
    codeVerifierTimestamp: typeof window !== 'undefined' ? localStorage.getItem('spotify_code_verifier_timestamp') : null,
    currentState: typeof window !== 'undefined' ? localStorage.getItem('spotify_current_state') : null,
    newAuthCount: typeof window !== 'undefined' ? Object.keys(localStorage).filter(key => key.startsWith('spotify_auth_')).length : 0
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">🎵 Spotify Debug Info</h3>
      <div className="grid grid-cols-2 gap-2">
        <div><strong>Client ID:</strong></div>
        <div className="text-blue-600 break-all">{debugInfo.clientId || '❌ 未設定'}</div>
        
        <div><strong>Redirect URI:</strong></div>
        <div className="text-blue-600 break-all">{debugInfo.redirectUri}</div>
        
        <div><strong>Environment:</strong></div>
        <div>{debugInfo.environment}</div>
        
        <div><strong>Is Production:</strong></div>
        <div>{debugInfo.isProd ? 'Yes' : 'No'}</div>
        
        <div><strong>Hostname:</strong></div>
        <div>{debugInfo.hostname}</div>
        
        <div><strong>Protocol:</strong></div>
        <div>{debugInfo.protocol}</div>
        
        <div><strong>Port:</strong></div>
        <div>{debugInfo.port}</div>
        
        <div><strong>Env Variable:</strong></div>
        <div className={debugInfo.envVar === 'not set' ? 'text-red-600' : 'text-green-600'}>
          {debugInfo.envVar}
        </div>

        <div><strong>Code Verifier:</strong></div>
        <div className={debugInfo.hasCodeVerifier ? 'text-green-600' : 'text-red-600'}>
          {debugInfo.hasCodeVerifier ? '✅ 存在' : '❌ なし'}
        </div>

        <div><strong>Saved State:</strong></div>
        <div className={debugInfo.hasSavedState ? 'text-green-600' : 'text-red-600'}>
          {debugInfo.hasSavedState ? '✅ 存在' : '❌ なし'}
        </div>

        <div><strong>Verifier作成時刻:</strong></div>
        <div className={debugInfo.codeVerifierTimestamp ? 'text-blue-600' : 'text-gray-500'}>
          {debugInfo.codeVerifierTimestamp 
            ? new Date(parseInt(debugInfo.codeVerifierTimestamp)).toLocaleTimeString()
            : 'なし'
          }
        </div>

        <div><strong>現在のState:</strong></div>
        <div className={debugInfo.currentState ? 'text-blue-600' : 'text-gray-500'}>
          {debugInfo.currentState 
            ? debugInfo.currentState.substring(0, 10) + '...'
            : 'なし'
          }
        </div>

        <div><strong>認証セッション数:</strong></div>
        <div className={debugInfo.newAuthCount > 0 ? 'text-green-600' : 'text-gray-500'}>
          {debugInfo.newAuthCount}個
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-xs">
          <strong>🔍 Spotify Dashboard確認項目:</strong><br/>
          1. Redirect URI: <code className="bg-yellow-100 px-1 rounded">{debugInfo.redirectUri}</code><br/>
          2. Client ID: <code className="bg-yellow-100 px-1 rounded">{debugInfo.clientId}</code><br/>
          3. App Type: Web Application
        </p>
      </div>

      {debugInfo.newAuthCount > 1 && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
          <p className="text-orange-800 text-xs">
            <strong>⚠️ 複数タブ警告:</strong><br/>
            {debugInfo.newAuthCount}個の認証セッションが存在しています。<br/>
            他のタブで認証中の場合、code_verifier不一致エラーが発生する可能性があります。
          </p>
        </div>
      )}
    </div>
  );
} 