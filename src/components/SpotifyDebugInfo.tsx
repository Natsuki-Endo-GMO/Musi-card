import { spotifyAuth } from '../services/spotifyApi';

export default function SpotifyDebugInfo() {
  const debugInfo = {
    redirectUri: spotifyAuth.getCurrentRedirectUri(),
    environment: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
    port: typeof window !== 'undefined' ? window.location.port : 'unknown',
    envVar: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'not set'
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">🎵 Spotify Debug Info</h3>
      <div className="grid grid-cols-2 gap-2">
        <div><strong>Redirect URI:</strong></div>
        <div className="text-blue-600">{debugInfo.redirectUri}</div>
        
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
      </div>
    </div>
  );
} 