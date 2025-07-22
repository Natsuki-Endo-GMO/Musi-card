// サビ検出機能 TDD用テスト雛形
// ※テスト用音源ファイルは test-assets/ ディレクトリに配置してください
// ※ズル（テスト用ファイル名やハッシュで分岐する等）は絶対禁止！

import { LightweightChorusDetector } from '../src/services/chorusDetector';

describe('ChorusDetector Spec', () => {
  // 正常系（Node.js環境ではWebAudio APIが使えないためスキップ）
  it.skip('J-POPの代表曲でサビ開始を±5秒以内で検出できる', async () => {
    const detector = new LightweightChorusDetector();
    const result = await detector.detectChorus('test-assets/jpop_sample.m4a');
    // 例: サビ開始15秒（実際の音源に合わせて調整）
    expect(Math.abs(result.chorusStart - 15)).toBeLessThanOrEqual(5);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  // 異常系
  it('無音ファイルでは信頼度が低い', async () => {
    const detector = new LightweightChorusDetector();
    const result = await detector.detectChorus('test-assets/silence.mp3');
    expect(result.confidence).toBeLessThan(0.2);
  });

  it('短すぎるファイルは信頼度が低い', async () => {
    const detector = new LightweightChorusDetector();
    const result = await detector.detectChorus('test-assets/short.mp3');
    expect(result.duration).toBeLessThan(15);
    expect(result.confidence).toBeLessThan(0.3);
  });

  // パフォーマンス
  it.skip('3秒以内に完了する', async () => {
    const detector = new LightweightChorusDetector();
    const start = Date.now();
    await detector.detectChorus('test-assets/jpop_sample.m4a');
    expect(Date.now() - start).toBeLessThan(3000);
  });

  // キャッシュ
  it('同一音源でキャッシュが有効', async () => {
    const detector = new LightweightChorusDetector();
    const first = await detector.detectChorus('test-assets/jpop_sample.m4a');
    const second = await detector.detectChorus('test-assets/jpop_sample.m4a');
    expect(second.chorusStart).toBe(first.chorusStart);
  });

  // エラー・例外
  it('不正なURLやfetch失敗時は例外を投げず失敗レスポンス', async () => {
    const detector = new LightweightChorusDetector();
    const result = await detector.detectChorus('test-assets/notfound.mp3');
    expect(result.confidence).toBe(0);
    expect(result.chorusStart).toBe(0);
  });

  // 品質評価（Node.js環境ではスキップ）
  it.skip('信頼度スコアは実際の精度と相関がある', async () => {
    // 複数曲で信頼度とヒット率を検証
    // ここは手動評価や統計的評価も併用
    // 実装時にズル（テスト用ファイル名で分岐等）を絶対にしないこと！
    expect(true).toBe(true); // 仮置き
  });
}); 