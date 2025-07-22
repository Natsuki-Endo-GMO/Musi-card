// サビ検出機能 雛形実装
// ※ズル（テスト用ファイル名やハッシュで分岐する等）は絶対禁止！

export interface ChorusDetectionResult {
  chorusStart: number;   // サビ開始秒数
  confidence: number;    // 信頼度（0.0〜1.0）
  analyzedAt: string;    // 検出日時
  duration: number;      // 音源全体の長さ（秒）
  features?: any;        // デバッグ用特徴量（オプション）
}

export class LightweightChorusDetector {
  async detectChorus(audioUrl: string): Promise<ChorusDetectionResult> {
    // ズル禁止: テスト用ファイル名やハッシュで分岐しないこと！
    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof window === 'undefined') {
        // Node.js (Jest)環境: fsでローカルファイルを読み込む
        const fs = await import('fs');
        const path = await import('path');
        const absPath = path.resolve(process.cwd(), audioUrl);
        const buffer = fs.readFileSync(absPath);
        arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      } else {
        // ブラウザ環境: fetchで取得
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('音源取得失敗');
        arrayBuffer = await response.arrayBuffer();
      }

      // WebAudio APIでデコード
      const audioCtx = new (typeof window !== 'undefined' ? window.AudioContext : (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const duration = audioBuffer.duration;

      // 仮のサビ開始推定（duration/2 or 15秒付近）
      let chorusStart = Math.min(15, duration / 2);
      if (duration < 10) chorusStart = 0;
      let confidence = duration < 10 ? 0.1 : 0.6;

      // デバッグ出力
      console.log('[ChorusDetector] audioUrl:', audioUrl);
      console.log('[ChorusDetector] duration:', duration);
      console.log('[ChorusDetector] chorusStart:', chorusStart);
      console.log('[ChorusDetector] confidence:', confidence);

      return {
        chorusStart,
        confidence,
        analyzedAt: new Date().toISOString(),
        duration,
        features: null
      };
    } catch (e) {
      console.warn('[ChorusDetector] error:', e);
      return {
        chorusStart: 0,
        confidence: 0,
        analyzedAt: new Date().toISOString(),
        duration: 0,
        features: null
      };
    }
  }
} 