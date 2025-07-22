import { test, expect } from '@playwright/test';

test.describe('ダッシュボード構造デバッグテスト', () => {
  test('ログイン後のダッシュボード構造を確認', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.click('button:has-text("新規登録")');
    await page.fill('input[placeholder*="ユーザー名"]', 'debuguser');
    await page.fill('input[type="password"]', 'debugpass');
    await page.waitForSelector('form button[type="submit"]:not([disabled])', { timeout: 5000 });
    await page.click('form button[type="submit"]');
    
    // ダッシュボードに遷移するまで待機
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    console.log('=== ダッシュボードページの構造確認 ===');
    
    // 現在のURL
    console.log('URL:', page.url());
    
    // ページタイトル
    const title = await page.title();
    console.log('ページタイトル:', title);
    
    // すべてのテキスト要素を取得
    const allTexts = await page.locator('body').textContent();
    console.log('ページ全体のテキスト:', allTexts?.substring(0, 1000) + '...');
    
    // ボタンの一覧
    const buttons = await page.locator('button').all();
    console.log('=== ボタンの一覧 ===');
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`ボタン ${i + 1}: text="${text}", type="${type}"`);
    }
    
    // ユーザー名関連の要素を探す
    const userElements = await page.locator('*:has-text("debuguser"), *:has-text("Debug"), *:has-text("ユーザー"), *:has-text("user")').all();
    console.log('=== ユーザー名関連の要素 ===');
    for (let i = 0; i < userElements.length; i++) {
      const tagName = await userElements[i].evaluate(el => el.tagName);
      const text = await userElements[i].textContent();
      console.log(`要素 ${i + 1}: <${tagName}>${text}</${tagName}>`);
    }
    
    // ログアウト関連の要素を探す
    const logoutElements = await page.locator('*:has-text("ログアウト"), *:has-text("logout"), *:has-text("Logout")').all();
    console.log('=== ログアウト関連の要素 ===');
    for (let i = 0; i < logoutElements.length; i++) {
      const tagName = await logoutElements[i].evaluate(el => el.tagName);
      const text = await logoutElements[i].textContent();
      console.log(`要素 ${i + 1}: <${tagName}>${text}</${tagName}>`);
    }
    
    // ページのHTML構造（最初の1000文字）
    const pageContent = await page.content();
    console.log('=== ページのHTML構造 ===');
    console.log(pageContent.substring(0, 1000) + '...');
  });
}); 