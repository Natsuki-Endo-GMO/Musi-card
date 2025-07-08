# MusiCard - 音楽名刺サービス

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.5-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

SNSのbioに好きな音楽のジャケット画像を含む自己紹介ページ（音楽名刺）を作成できるサービスです。

## 機能

### 🎵 音楽名刺の作成・管理
- ユーザーごとの音楽名刺ページ作成
- 好きな音楽の登録（曲名、アーティスト、ジャケット画像）
- 名刺の編集・削除機能

### 🔍 音楽検索・自動補完
- 曲名やアーティスト名でのリアルタイム検索
- 音楽データベースからの自動補完
- ジャケット画像の自動取得

### 🎨 美しいUI/UX
- モダンなダークテーマデザイン
- レスポンシブ対応
- スムーズなアニメーション効果
- Topsters風のグリッドレイアウト

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router DOM
- **HTTP クライアント**: Axios
- **音楽API**: Last.fm API

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
# .envファイルを作成
cp env.example .env
```

`.env`ファイルを編集して、Last.fm APIキーを設定してください：
```
VITE_LASTFM_API_KEY=your_lastfm_api_key_here
```

**⚠️ 注意**: `.env`ファイルはGitにコミットしないでください。機密情報が含まれています。

#### Last.fm APIキーの取得方法
1. [Last.fm API](https://www.last.fm/api/account/create)にアクセス
2. アカウントを作成またはログイン
3. APIキーを取得
4. `.env`ファイルに設定

### 3. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

## 使用方法

### 1. 名刺の作成
1. ホームページから「名刺を作成」をクリック
2. ユーザー名を入力
3. 音楽検索機能を使用して曲を追加
   - 検索ボックスに曲名やアーティスト名を入力
   - 候補から選択して自動入力
   - または手動で曲名・アーティスト名を入力
4. 必要に応じてジャケット画像URLを設定
5. 「名刺を作成」をクリック

### 2. 名刺の表示
- `/users/{username}` で名刺ページを表示
- グリッドレイアウトで音楽ジャケットを表示
- ホバーエフェクトで詳細情報を表示

### 3. 名刺の管理
- 管理画面からユーザー一覧を確認
- 名刺の編集・削除が可能

## 音楽検索機能について

### 現在対応しているAPI
- **Last.fm API**: 曲名・アーティスト名での検索
- **モックデータ**: APIキーがない場合のフォールバック

### 実装済み機能
- アルバム・トラック検索
- 自動補完機能
- ジャケット画像取得
- フォールバック画像生成

### 将来的な拡張予定
- Spotify API連携
- Apple Music API連携
- YouTube Music API連携
- プレイリストのインポート機能
- 音楽プレビュー機能

## 開発

### プロジェクト構造
```
src/
├── components/          # 再利用可能なコンポーネント
│   └── MusicSearchAutocomplete.tsx
├── pages/              # ページコンポーネント
│   ├── Home.tsx
│   ├── CreateUser.tsx
│   ├── EditUser.tsx
│   ├── ManageUsers.tsx
│   └── UserPage.tsx
├── services/           # APIサービス
│   └── musicSearch.ts
├── App.tsx
└── main.tsx
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## ライセンス

ISC License

## 貢献

プルリクエストやイシューの報告を歓迎します！

## デプロイ

### Vercel（推奨）
1. [Vercel](https://vercel.com)にサインアップ
2. GitHubリポジトリを連携
3. 環境変数を設定（VITE_LASTFM_API_KEY）
4. 自動デプロイ完了

### Netlify
1. [Netlify](https://netlify.com)にサインアップ
2. GitHubリポジトリを連携
3. 環境変数を設定
4. 自動デプロイ完了

### GitHub Pages
1. リポジトリのSettings > Pages
2. SourceをGitHub Actionsに設定
3. 自動デプロイ完了

## 今後の予定

- [ ] Spotify API連携
- [ ] プレイリストインポート機能
- [ ] 音楽プレビュー機能
- [ ] ソーシャル機能（いいね、シェア）
- [ ] テーマカスタマイズ機能
- [ ] モバイルアプリ版 