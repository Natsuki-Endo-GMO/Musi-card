import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LightweightChorusDetector } from '../src/services/chorusDetector';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const file = req.query.file as string;
  if (!file) {
    return res.status(400).json({ error: 'file query required' });
  }
  try {
    // public配下のファイルパスに解決
    const safeFile = file.replace(/^\/+/, ''); // 先頭の/を除去
    const detector = new LightweightChorusDetector();
    // Node.js環境では public/ をルートにしてパス解決
    const result = await detector.detectChorus(`public/${safeFile}`);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
} 