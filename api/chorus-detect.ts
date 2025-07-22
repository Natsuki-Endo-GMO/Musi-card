import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LightweightChorusDetector } from '../src/services/chorusDetector';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const file = req.query.file as string;
  if (!file) {
    return res.status(400).json({ error: 'file query required' });
  }
  try {
    const detector = new LightweightChorusDetector();
    const result = await detector.detectChorus(file);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
} 