import { test, expect } from '@playwright/test';
import { setupTestUser } from './helpers/auth';
import path from 'path';

test.describe('画像アップロードテスト', () => {
  test('画像アップロード機能が利用可能（ログイン後）', async ({ page }) => {
    // テストユーザーでログイン
    const user = await setupTestUser(page, 0);
    
    // 画像アップロード要素が存在することを確認（hiddenクラスでも存在確認）
    const uploadInput = page.locator('input[type="file"]');
    await expect(uploadInput).toHaveCount(1);
  });

  test.skip('画像アップロードAPIが正常に動作する', async ({ page }) => {
    // テストユーザーでログイン
    const user = await setupTestUser(page, 0);
    
    // テスト用の画像ファイルを作成
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // 画像アップロードAPIをテスト
    const response = await page.request.post('/api/images?action=upload', {
      data: {
        imageData: testImageData,
        filename: 'test-image.png'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();
    expect(result.pathname).toBeTruthy();
  });

  test.skip('画像統計APIが正常に動作する', async ({ page }) => {
    const response = await page.request.get('/api/images?action=stats');
    expect(response.status()).toBe(200);
    
    const stats = await response.json();
    expect(stats.success).toBe(true);
    expect(stats.stats).toHaveProperty('totalImages');
    expect(stats.stats).toHaveProperty('totalSize');
    expect(stats.stats).toHaveProperty('imageTypes');
  });

  test.skip('画像削除APIが正常に動作する', async ({ page }) => {
    // まず画像をアップロード
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const uploadResponse = await page.request.post('/api/images?action=upload', {
      data: {
        imageData: testImageData,
        filename: 'test-delete.png'
      }
    });
    
    const uploadResult = await uploadResponse.json();
    const imageUrl = uploadResult.url;
    
    // 画像を削除
    const deleteResponse = await page.request.delete(`/api/images?action=delete&url=${encodeURIComponent(imageUrl)}`);
    expect(deleteResponse.status()).toBe(200);
    
    const deleteResult = await deleteResponse.json();
    expect(deleteResult.success).toBe(true);
  });

  test.skip('無効な画像データでエラーが返される', async ({ page }) => {
    const response = await page.request.post('/api/images?action=upload', {
      data: {
        imageData: 'invalid-data',
        filename: 'test.png'
      }
    });
    
    expect(response.status()).toBe(500);
  });

  test.skip('ファイル名なしでエラーが返される', async ({ page }) => {
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await page.request.post('/api/images?action=upload', {
      data: {
        imageData: testImageData
        // filename を省略
      }
    });
    
    expect(response.status()).toBe(400);
  });
}); 