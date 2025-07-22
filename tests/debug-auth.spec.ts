import { test, expect } from '@playwright/test';

test.describe('認証デバッグテスト', () => {
  test('実際のユーザーでログインを試行', async ({ page }) => {
    await page.goto('/login');
    
    // フォームが有効になるまで待機
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    
    // 実際のユーザーでログイン試行
    await page.fill('input[placeholder*="ユーザー名"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    
    // ログインボタンが有効かチェック
    const loginButton = page.locator('button[type="submit"]');
    const isDisabled = await loginButton.getAttribute('disabled');
    console.log('ログインボタンの無効状態:', isDisabled);
    
    if (!isDisabled) {
      await loginButton.click();
      
      // ログイン結果を確認
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('ログイン後のURL:', currentUrl);
      
      // エラーメッセージがあるかチェック
      const errorMessages = await page.locator('*:has-text("エラー"), *:has-text("error"), *:has-text("失敗")').all();
      if (errorMessages.length > 0) {
        console.log('エラーメッセージ:');
        for (const error of errorMessages) {
          const text = await error.textContent();
          console.log('-', text);
        }
      }
      
      // 成功メッセージがあるかチェック
      const successMessages = await page.locator('*:has-text("成功"), *:has-text("success"), *:has-text("ようこそ")').all();
      if (successMessages.length > 0) {
        console.log('成功メッセージ:');
        for (const success of successMessages) {
          const text = await success.textContent();
          console.log('-', text);
        }
      }
    } else {
      console.log('ログインボタンが無効です');
    }
  });

  test('ゲストユーザーでアクセス', async ({ page }) => {
    // Aliceの名刺にアクセス
    await page.goto('/');
    await page.click('button:has-text("Aliceの名刺")');
    
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Aliceの名刺ページのURL:', currentUrl);
    
    // ページの内容を確認
    const pageContent = await page.content();
    console.log('Aliceの名刺ページのHTML:', pageContent.substring(0, 1000) + '...');
  });
}); 