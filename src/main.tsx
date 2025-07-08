import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 開発環境でのみテスト機能を読み込み
if (import.meta.env.DEV) {
  import('./services/musicSearchTest.ts').then(module => {
    console.log('🎯 音楽検索テスト機能が読み込まれました')
    console.log('使用方法:')
    console.log('  musicSearchTest.runAllTests() - 包括的テスト実行')
    console.log('  musicSearchTest.testSpotify("クエリ") - Spotify単体テスト')
    console.log('  musicSearchTest.testLastfm("クエリ") - Last.fm単体テスト')
    console.log('  musicSearchTest.showEnv() - 環境情報表示')
  }).catch(error => {
    console.warn('テスト機能の読み込みに失敗:', error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
) 