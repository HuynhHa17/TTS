import { test, expect } from '@playwright/test';

test.describe('TTS Master E2E', () => {

  test('should load main dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    await expect(page.getByText('TTS Master')).toBeVisible();
    
    // Wait for data to load
    await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
    
    // Check action buttons in header
    await expect(page.getByRole('button', { name: 'Thêm Mới' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📊 Excel' })).toBeVisible();
  });

  test('should open add candidate editor and save', async ({ page }) => {
    await page.goto('/');
    
    // Wait for data to load
    await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
    
    // Click "Thêm Mới"
    await page.getByRole('button', { name: 'Thêm Mới' }).click();
    
    // Check if editor loaded
    await expect(page.getByRole('heading', { name: '✨ Thêm Hồ Sơ Mới' })).toBeVisible();
    
    // Fill basic fields in Personal tab
    await page.getByPlaceholder('VD: MRK001').fill('TEST-E2E-001');
    await page.getByPlaceholder('NGUYỄN VĂN A').fill('Nguyễn Playwright Test');
    
    // Switch to Health tab
    await page.getByRole('button', { name: '❤️ Sức Khoẻ' }).click();
    await page.getByPlaceholder('170').fill('175');
    
    // Dismiss alert "Lưu hồ sơ thành công vào SQLite Engine!"
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Save
    await page.getByRole('button', { name: '💾 Lưu Hồ Sơ' }).click();
    
    // Check if new candidate is in the list
    await expect(page.getByText('Nguyễn Playwright Test')).toBeVisible();
  });

  test('should open Excel config modal', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
    
    await page.getByRole('button', { name: '📊 Excel' }).click();
    
    await expect(page.getByRole('heading', { name: 'Cấu Hình Excel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import Excel → SQLite' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: '✕' }).click();
    await expect(page.getByRole('heading', { name: 'Cấu Hình Excel' })).toBeHidden();
  });

  test('should open templates manager', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
    
    await page.getByRole('button', { name: 'Templates' }).click();
    
    // Verify template manager section exists
    await expect(page.getByRole('heading', { name: 'Quản Lý Template' })).toBeVisible();
  });

});
