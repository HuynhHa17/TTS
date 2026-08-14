# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TTS Master E2E >> should open add candidate editor and save
- Location: e2e\app.spec.ts:19:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Nguyễn Playwright Test')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Nguyễn Playwright Test')

```

```yaml
- banner:
  - text: 🇯🇵 TTS Master PRO
  - navigation:
    - button "Excel"
    - button "Danh Sách"
    - button "Templates"
  - button "GSheet"
  - button "📊 Excel"
  - button "Export"
  - button "Thêm Mới"
  - button "Phím tắt (Cmd/Ctrl + K)"
- main:
  - button "← Quay Lại"
  - heading "✨ Thêm Hồ Sơ Mới" [level=2]
  - text: draft
  - button "✨ Dịch Toàn Bộ"
  - button "💾 Lưu Hồ Sơ"
  - button "👤 Cá Nhân"
  - button "🏠 Gia Đình"
  - button "🪪 Giấy Tờ"
  - button "🎓 Học Vấn"
  - button "💼 Kinh Nghiệm"
  - button "❤️ Sức Khoẻ"
  - button "✨ Khác"
  - heading "Thể chất" [level=3]
  - text: Chiều cao (cm)
  - spinbutton "170": "175"
  - text: Cân nặng (kg)
  - spinbutton "65"
  - text: Nhóm máu
  - combobox:
    - option "-- Chọn --" [selected]
    - option "A"
    - option "B"
    - option "AB"
    - option "O"
  - text: Thị lực mắt trái
  - textbox "1.5"
  - text: Thị lực mắt phải
  - textbox "1.5"
  - text: Thuận tay
  - combobox:
    - option "-- Chọn --" [selected]
    - option "Phải"
    - option "Trái"
    - option "Hai tay"
  - heading "Tình trạng sức khoẻ" [level=3]
  - text: Sức khoẻ tổng thể
  - combobox:
    - option "-- Chọn --"
    - option "Tốt" [selected]
    - option "Bình thường"
    - option "Không tốt"
  - text: Thính lực
  - combobox:
    - option "-- Chọn --"
    - option "Bình thường" [selected]
    - option "Bất thường"
  - text: Điều trị nha khoa
  - combobox:
    - option "-- Chọn --"
    - option "Có"
    - option "Không" [selected]
  - text: Bệnh mãn tính
  - combobox:
    - option "-- Chọn --"
    - option "Có"
    - option "Không" [selected]
  - text: Tên bệnh mãn tính (nếu có)
  - textbox
  - heading "Lối sống" [level=3]
  - text: Hình xăm
  - combobox:
    - option "-- Chọn --"
    - option "Có"
    - option "Không" [selected]
  - text: Hút thuốc
  - combobox:
    - option "-- Chọn --"
    - option "Có"
    - option "Không" [selected]
  - text: Uống rượu bia
  - combobox:
    - option "-- Chọn --"
    - option "Không" [selected]
    - option "Thỉnh thoảng"
    - option "Thường xuyên"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('TTS Master E2E', () => {
  4  | 
  5  |   test('should load main dashboard', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Check header
  9  |     await expect(page.getByText('TTS Master')).toBeVisible();
  10 |     
  11 |     // Wait for data to load
  12 |     await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
  13 |     
  14 |     // Check action buttons in header
  15 |     await expect(page.getByRole('button', { name: 'Thêm Mới' })).toBeVisible();
  16 |     await expect(page.getByRole('button', { name: '📊 Excel' })).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should open add candidate editor and save', async ({ page }) => {
  20 |     await page.goto('/');
  21 |     
  22 |     // Wait for data to load
  23 |     await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
  24 |     
  25 |     // Click "Thêm Mới"
  26 |     await page.getByRole('button', { name: 'Thêm Mới' }).click();
  27 |     
  28 |     // Check if editor loaded
  29 |     await expect(page.getByRole('heading', { name: '✨ Thêm Hồ Sơ Mới' })).toBeVisible();
  30 |     
  31 |     // Fill basic fields in Personal tab
  32 |     await page.getByPlaceholder('VD: MRK001').fill('TEST-E2E-001');
  33 |     await page.getByPlaceholder('NGUYỄN VĂN A').fill('Nguyễn Playwright Test');
  34 |     
  35 |     // Switch to Health tab
  36 |     await page.getByRole('button', { name: '❤️ Sức Khoẻ' }).click();
  37 |     await page.getByPlaceholder('170').fill('175');
  38 |     
  39 |     // Dismiss alert "Lưu hồ sơ thành công vào SQLite Engine!"
  40 |     page.once('dialog', async dialog => {
  41 |       await dialog.accept();
  42 |     });
  43 |     
  44 |     // Save
  45 |     await page.getByRole('button', { name: '💾 Lưu Hồ Sơ' }).click();
  46 |     
  47 |     // Check if new candidate is in the list
> 48 |     await expect(page.getByText('Nguyễn Playwright Test')).toBeVisible();
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  49 |   });
  50 | 
  51 |   test('should open Excel config modal', async ({ page }) => {
  52 |     await page.goto('/');
  53 |     
  54 |     await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
  55 |     
  56 |     await page.getByRole('button', { name: '📊 Excel' }).click();
  57 |     
  58 |     await expect(page.getByRole('heading', { name: 'Cấu Hình Excel' })).toBeVisible();
  59 |     await expect(page.getByRole('button', { name: 'Import Excel → SQLite' })).toBeVisible();
  60 |     
  61 |     // Close modal
  62 |     await page.getByRole('button', { name: '✕' }).click();
  63 |     await expect(page.getByRole('heading', { name: 'Cấu Hình Excel' })).toBeHidden();
  64 |   });
  65 | 
  66 |   test('should open templates manager', async ({ page }) => {
  67 |     await page.goto('/');
  68 |     
  69 |     await expect(page.locator('text=Đang tải dữ liệu...')).toBeHidden({ timeout: 10000 });
  70 |     
  71 |     await page.getByRole('button', { name: 'Templates' }).click();
  72 |     
  73 |     // Verify template manager section exists
  74 |     await expect(page.getByRole('heading', { name: 'Quản Lý Template' })).toBeVisible();
  75 |   });
  76 | 
  77 | });
  78 | 
```