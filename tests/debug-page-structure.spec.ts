import { test, expect } from '@playwright/test';

test.describe('ページ構造デバッグテスト', () => {
  test('ログインページの構造を確認', async ({ page }) => {
    await page.goto('/login');
    
    // ページのHTMLを取得して構造を確認
    const pageContent = await page.content();
    console.log('=== ログインページのHTML ===');
    console.log(pageContent);
    
    // ボタンの一覧を取得
    const buttons = await page.locator('button').all();
    console.log('=== ボタンの一覧 ===');
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`ボタン ${i + 1}: text="${text}", type="${type}"`);
    }
    
    // フォームの構造を確認
    const forms = await page.locator('form').all();
    console.log('=== フォームの構造 ===');
    for (let i = 0; i < forms.length; i++) {
      const formHtml = await forms[i].innerHTML();
      console.log(`フォーム ${i + 1}:`, formHtml);
    }
  });

  test('ログイン後のダッシュボード構造を確認', async ({ page }) => {
    await page.goto('/login');
    
    // ログイン実行
    await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', 'testuser');
    await page.fill('input[type="password"], input[name="password"]', 'testpass');
    await page.click('form button[type="submit"]:has-text("ログイン")');
    
    // ログイン完了を待機
    try {
      await page.waitForURL('/dashboard', { timeout: 10000 });
    } catch (error) {
      await page.waitForURL(/\/dashboard|\/home|\//, { timeout: 10000 });
    }
    
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('=== ログイン後のURL ===');
    console.log(currentUrl);
    
    // ページのHTMLを取得
    const pageContent = await page.content();
    console.log('=== ダッシュボードのHTML ===');
    console.log(pageContent);
    
    // ボタンの一覧を取得
    const buttons = await page.locator('button').all();
    console.log('=== ボタンの一覧 ===');
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`ボタン ${i + 1}: text="${text}", type="${type}"`);
    }
    
    // ユーザー名が表示されている要素を探す
    const userElements = await page.locator('*:has-text("testuser"), *:has-text("Test User")').all();
    console.log('=== ユーザー名関連の要素 ===');
    for (let i = 0; i < userElements.length; i++) {
      const tagName = await userElements[i].evaluate(el => el.tagName);
      const text = await userElements[i].textContent();
      console.log(`要素 ${i + 1}: <${tagName}>${text}</${tagName}>`);
    }
  });
}); 