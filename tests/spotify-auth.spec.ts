import { test, expect } from '@playwright/test';
import { setupTestUser } from './helpers/auth';

test.describe('Spotify認証テスト', () => {
  test('Spotify認証ボタンが表示される（ログイン後）', async ({ page }) => {
    // テストユーザーでログイン
    const user = await setupTestUser(page, 0);
    
    // Spotify認証ボタンが表示されることを確認
    const spotifyButton = page.locator('button:has-text("Spotify")');
    await expect(spotifyButton).toBeVisible();
  });

  test('Spotify認証URLが正しく生成される（ログイン後）', async ({ page }) => {
    // テストユーザーでログイン
    const user = await setupTestUser(page, 0);
    
    // Spotify認証ボタンをクリック
    const spotifyButton = page.locator('button:has-text("Spotify")');
    await spotifyButton.click();
    
    // 認証URLが正しい形式であることを確認
    await expect(page).toHaveURL(/accounts\.spotify\.com\/authorize/);
    
    // 必要なパラメータが含まれていることを確認
    const url = page.url();
    expect(url).toContain('client_id=');
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('state=');
  });

  test('Spotify設定が正しく取得される', async ({ page }) => {
    // Spotify設定APIをテスト
    const response = await page.request.get('/api/config?type=spotify');
    expect(response.status()).toBe(200);
    
    const config = await response.json();
    
    // 必要な設定が含まれていることを確認
    expect(config.clientId).toBeTruthy();
    expect(config.redirectUri).toBeTruthy();
    expect(config.environment).toBeTruthy();
    
    // リダイレクトURIが正しい形式であることを確認
    expect(config.redirectUri).toMatch(/^https?:\/\/.+\/callback$/);
  });

  test('認証フローでエラーが発生しない', async ({ page }) => {
    await page.goto('/');
    
    // コンソールエラーを監視
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Spotify認証ボタンをクリック
    const spotifyButton = page.locator('button:has-text("Spotify")');
    await spotifyButton.click();
    
    // 少し待機してエラーを確認
    await page.waitForTimeout(3000);
    
    // 認証関連のエラーがないことを確認
    const authErrors = consoleErrors.filter(error => 
      error.includes('Spotify') || 
      error.includes('auth') || 
      error.includes('token')
    );
    
    expect(authErrors).toHaveLength(0);
  });
}); 