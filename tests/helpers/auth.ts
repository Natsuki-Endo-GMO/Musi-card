import { Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// テストユーザー設定を読み込み
function loadTestUsers() {
  try {
    const configPath = path.join(__dirname, '../config/test-users.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn('テストユーザー設定ファイルが見つかりません。デフォルト設定を使用します。');
    return {
      testUsers: [{
        username: 'testuser',
        password: 'testpass',
        displayName: 'Test User'
      }]
    };
  }
}

export async function loginUser(page: Page, username: string, password: string) {
  await page.goto('/login');
  
  // ユーザー名フィールドを入力
  await page.fill('input[placeholder*="ユーザー名"], input[name="username"]', username);
  
  // パスワードフィールドを入力
  await page.fill('input[type="password"], input[name="password"]', password);
  
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

export async function setupTestUser(page: Page, userIndex: number = 0) {
  const config = loadTestUsers();
  const user = config.testUsers[userIndex];
  
  if (!user) {
    throw new Error(`テストユーザー ${userIndex} が見つかりません`);
  }
  
  // テストユーザーでログイン
  await loginUser(page, user.username, user.password);
  
  // ログイン状態を確認
  await expect(page.locator(`text=${user.displayName}`)).toBeVisible();
  
  return user;
}

export async function setupAdminUser(page: Page) {
  const config = loadTestUsers();
  const admin = config.adminUser;
  
  if (!admin) {
    throw new Error('管理者ユーザーが見つかりません');
  }
  
  // 管理者ユーザーでログイン
  await loginUser(page, admin.username, admin.password);
  
  // ログイン状態を確認
  await expect(page.locator(`text=${admin.displayName}`)).toBeVisible();
  
  return admin;
} 