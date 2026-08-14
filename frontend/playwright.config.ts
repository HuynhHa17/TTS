import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: 'd:\\TTS\\frontend'
    },
    {
      command: 'set FLASK_APP=d:\\TTS\\tts_app\\run.py && set FLASK_ENV=development && set FLASK_DEBUG=1 && python -m flask run -p 5000',
      url: 'http://127.0.0.1:5000/api/settings',
      reuseExistingServer: !process.env.CI,
      cwd: 'd:\\TTS\\tts_app'
    }
  ],
});
