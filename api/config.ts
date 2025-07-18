import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query;
    const isProduction = process.env.NODE_ENV === 'production';

    // 設定タイプに応じてレスポンスを変更
    switch (type) {
      case 'admin':
        // 管理者設定
        const adminUsers = isProduction 
          ? ['admin'] 
          : (process.env.ADMIN_USERS || 'admin').split(',');
        
        return res.status(200).json({
          adminUsers: adminUsers,
          isProduction: isProduction
        });

      case 'spotify':
        // Spotify設定
        return res.status(200).json({
          clientId: process.env.SPOTIFY_CLIENT_ID || '',
          redirectUri: process.env.SPOTIFY_REDIRECT_URI || '',
          lastfmApiKey: process.env.LASTFM_API_KEY || '',
          environment: process.env.NODE_ENV || 'development',
          isProduction: isProduction
        });

      default:
        // デフォルト設定
        const config = {
          // 本番環境では基本的に無効、環境変数で明示的に有効化された場合のみ有効
          enableDebugPanels: !isProduction || process.env.ENABLE_DEBUG_PANELS === 'true',
          enableDataMigration: !isProduction || process.env.ENABLE_DATA_MIGRATION === 'true',
          enableAdminPanel: !isProduction || process.env.ENABLE_ADMIN_PANEL === 'true',
          enableDataSourceIndicator: !isProduction || process.env.ENABLE_DATA_SOURCE_INDICATOR === 'true',
          
          // 管理者設定（本番環境では制限）
          adminUsers: isProduction ? ['admin'] : (process.env.ADMIN_USERS || 'admin').split(','),
          
          // 環境情報（セキュリティ上問題ない情報のみ）
          environment: process.env.NODE_ENV || 'development',
          isProduction: isProduction
        };

        return res.status(200).json(config);
    }
  } catch (error) {
    console.error('設定取得エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 