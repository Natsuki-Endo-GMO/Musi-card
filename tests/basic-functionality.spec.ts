import { test, expect } from '@playwright/test';
import { setupTestUser } from './helpers/auth';

test.describe('基本機能テスト', () => {
  test('ホームページが正常に表示される', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認（実際のタイトルに合わせて修正）
    await expect(page).toHaveTitle(/MusiCard/);
    
    // 主要な要素が表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // コンソールエラーがないことを確認
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors).toHaveLength(0);
  });

  test('ユーザー登録・ログインが正常に動作する', async ({ page }) => {
    const testUsername = `testuser_${Date.now()}`;
    
    // ユーザー登録
    await page.goto('/login');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="displayName"]', 'Test User');
    await page.click('button:has-text("作成")');
    
    // ダッシュボードに遷移することを確認
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
    
    // ログアウト
    await page.click('button:has-text("ログアウト")');
    await page.waitForURL('/');
    
    // 再ログイン
    await page.goto('/login');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('ナビゲーションが正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // 各ページへのナビゲーションをテスト
    const navLinks = [
      { text: 'ホーム', path: '/' },
      { text: 'ダッシュボード', path: '/dashboard' },
      { text: 'ユーザー管理', path: '/manage-users' },
    ];
    
    for (const link of navLinks) {
      if (await page.locator(`text=${link.text}`).isVisible()) {
        await page.click(`text=${link.text}`);
        await expect(page).toHaveURL(new RegExp(link.path));
      }
    }
  });

  test('API設定エンドポイントが正常に動作する', async ({ page }) => {
    // 設定APIのテスト
    const response = await page.request.get('/api/config');
    expect(response.status()).toBe(200);
    
    const config = await response.json();
    expect(config).toHaveProperty('environment');
    expect(config).toHaveProperty('isProduction');
  });

  test('Spotify設定APIが正常に動作する', async ({ page }) => {
    const response = await page.request.get('/api/config?type=spotify');
    expect(response.status()).toBe(200);
    
    const config = await response.json();
    expect(config).toHaveProperty('clientId');
    expect(config).toHaveProperty('redirectUri');
  });

  test('データベース統計APIが正常に動作する', async ({ page }) => {
    const response = await page.request.get('/api/db?action=stats');
    expect(response.status()).toBe(200);
    
    const stats = await response.json();
    expect(stats).toHaveProperty('source');
    expect(stats).toHaveProperty('stats');
  });
}); 