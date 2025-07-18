import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    username: string;
    isAdmin: boolean;
  };
}

export function requireAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const token = authHeader.substring(7);
    
    try {
      // 簡易的なトークン検証（実際の実装ではJWTなどを使用）
      const isProduction = process.env.NODE_ENV === 'production';
      const adminUsers = isProduction ? ['admin'] : (process.env.ADMIN_USERS || 'admin').split(',');
      
      // トークンが管理者リストに含まれているかチェック
      if (adminUsers.includes(token)) {
        req.user = {
          username: token,
          isAdmin: true
        };
      } else {
        // 一般ユーザーの場合（簡易実装）
        req.user = {
          username: token,
          isAdmin: false
        };
      }
      
      return await handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: '無効なトークンです' });
    }
  };
}

export function requireAdmin(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return requireAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: '管理者権限が必要です' });
      return;
    }
    
    await handler(req, res);
  });
} 