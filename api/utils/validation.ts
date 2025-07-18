export function validateFilename(filename: string): boolean {
  // ファイル名の検証
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(filename) && filename.length <= 255;
}

export function validateImageData(imageData: string): boolean {
  // Base64画像データの検証
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  return base64Pattern.test(imageData) && imageData.length < 10 * 1024 * 1024; // 10MB制限
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateUsername(username: string): boolean {
  // ユーザー名の検証
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(username) && username.length >= 3 && username.length <= 50;
}

export function sanitizeString(input: string): string {
  // 基本的なサニタイゼーション
  return input.replace(/[<>]/g, '').trim();
} 