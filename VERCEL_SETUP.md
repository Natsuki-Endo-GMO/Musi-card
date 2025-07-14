# Vercel Blob Storage 設定ガイド

## 概要

このドキュメントでは、MusicMEisiアプリでVercel Blob Storageを使用した画像ストレージシステムの設定手順を説明します。

## 1. Vercel Blob Storageの設定

### 1.1 Vercel CLIのインストール
```bash
npm i -g vercel
```

### 1.2 プロジェクトのリンク
```bash
vercel link
```

### 1.3 Blob Storageの有効化
1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. 「Storage」タブをクリック
4. 「Blob」を有効化

### 1.4 環境変数の設定

#### ローカル開発環境
`.env.local`ファイルを作成：
```env
BLOB_READ_WRITE_TOKEN=your_blob_read_write_token_here
```

#### 本番環境
Vercelダッシュボードで環境変数を設定：
1. プロジェクト設定 → 「Environment Variables」
2. 以下の変数を追加：
   - `BLOB_READ_WRITE_TOKEN`: Blob Storageの読み書きトークン

## 2. 画像ストレージシステムの機能

### 2.1 主要機能
- **ユーザーアイコンアップロード**: プロフィール画像の保存
- **アルバムジャケットキャッシュ**: Spotify/Last.fm画像の自動キャッシュ
- **画像圧縮**: sharpを使用した最適化
- **自動クリーンアップ**: 30日以上前の古い画像を自動削除

### 2.2 フォールバック機能
- Blob Storageが利用できない場合、ローカル保存に自動切り替え
- 外部画像キャッシュに失敗した場合、元のURLを使用

## 3. 使用量と制限

### 3.1 Vercel Blob Storage制限
- **無料枠**: 1GBストレージ、100GB転送
- **有料枠**: 100GBストレージ、1TB転送から

### 3.2 画像サイズ制限
- **最大ファイルサイズ**: 5MB
- **サポート形式**: JPEG, PNG, WebP
- **自動圧縮**: アイコン256px、ジャケット512px

### 3.3 キャッシュ設定
- **有効期限**: 30日
- **ローカルストレージ**: 永続化対応
- **自動クリーンアップ**: 60日以上前のキャッシュを削除

## 4. デバッグと監視

### 4.1 開発環境でのデバッグ
Dashboardページに`ImageStorageDebug`コンポーネントが表示されます：
- Blob Storage統計
- キャッシュ統計
- 設定状況確認
- 手動クリーンアップ機能

### 4.2 ログ監視
コンソールで以下のログを確認できます：
```
📤 ユーザーアイコンをアップロード: username (size bytes)
💾 外部画像をキャッシュ: url → cached_url
🗑️ 画像を削除: url
🧹 古い画像をX件削除しました
```

## 5. トラブルシューティング

### 5.1 よくある問題

#### Blob Storageが利用できない
```
⚠️ BLOB_READ_WRITE_TOKENが設定されていません。画像ストレージ機能が無効になります。
```
**解決方法**: 環境変数`BLOB_READ_WRITE_TOKEN`を設定

#### 画像アップロードエラー
```
⚠️ Blob Storageが利用できません。ローカル保存を使用します。
```
**解決方法**: Vercel Blob Storageの設定を確認

#### キャッシュエラー
```
画像キャッシュエラー: error
```
**解決方法**: ネットワーク接続とAPI制限を確認

### 5.2 パフォーマンス最適化

#### 画像圧縮設定
`src/utils/imageProcessor.ts`で圧縮設定を調整：
```typescript
export const IMAGE_PRESETS = {
  userIcon: {
    width: 256,
    height: 256,
    quality: 85,
    format: 'jpeg'
  },
  albumCover: {
    width: 512,
    height: 512,
    quality: 80,
    format: 'jpeg'
  }
}
```

#### キャッシュ設定
`src/services/externalImageCacheService.ts`でキャッシュ期間を調整：
```typescript
// 30日以内のキャッシュは有効
if (daysDiff < 30) {
  return cached.url
}
```

## 6. 本番環境での運用

### 6.1 デプロイ手順
1. 環境変数を設定
2. `vercel --prod`でデプロイ
3. Blob Storageの動作確認

### 6.2 監視項目
- ストレージ使用量
- 転送量
- エラー率
- レスポンス時間

### 6.3 バックアップ戦略
- 重要な画像は別途バックアップ
- 定期的なクリーンアップ実行
- 使用量監視とアラート設定

## 7. セキュリティ考慮事項

### 7.1 アクセス制御
- Blob Storageは公開アクセス設定
- 必要に応じて認証機能を追加

### 7.2 ファイル検証
- ファイル形式の検証
- ファイルサイズの制限
- マルウェアスキャン（必要に応じて）

### 7.3 データ保護
- 個人情報を含む画像の取り扱い注意
- GDPR準拠のためのデータ削除機能

## 8. 今後の拡張予定

### 8.1 機能拡張
- 画像編集機能
- バッチアップロード
- CDN統合

### 8.2 パフォーマンス改善
- 画像の遅延読み込み
- WebP形式の自動変換
- プログレッシブJPEG対応

### 8.3 監視強化
- リアルタイム使用量監視
- 自動スケーリング
- エラーアラート機能 