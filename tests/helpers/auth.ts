import { Page, expect } from '@playwright/test';

export async function createUser(page: Page, username: string, displayName?: string) {
  await page.goto('/login');
  
  // ユーザー作成フォームを入力
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="displayName"]', displayName || username);
  
  // ユーザー作成ボタンをクリック
  await page.click('button:has-text("作成")');
  
  // 作成完了を待機
  await page.waitForURL('/dashboard');
}

export async function loginUser(page: Page, username: string) {
  await page.goto('/login');
  
  // ログインフォームを入力
  await page.fill('input[name="username"]', username);
  
  // ログインボタンをクリック
  await page.click('button:has-text("ログイン")');
  
  // ログイン完了を待機
  await page.waitForURL('/dashboard');
}

export async function logoutUser(page: Page) {
  await page.goto('/dashboard');
  
  // ログアウトボタンをクリック
  await page.click('button:has-text("ログアウト")');
  
  // ログアウト完了を待機
  await page.waitForURL('/');
}

export async function setupTestUser(page: Page, username: string = 'testuser') {
  // テスト用ユーザーを作成
  await createUser(page, username, 'Test User');
  
  // ログイン状態を確認
  await expect(page.locator('text=Test User')).toBeVisible();
} 