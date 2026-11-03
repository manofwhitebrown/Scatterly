import { defineConfig } from '@playwright/test';

const PORT = 4174;
const exe = process.env.SHOTS_CHROMIUM; // optional: path to a local Chromium when Playwright's download is blocked

export default defineConfig({
  testDir: 'tests/shots',
  testMatch: '**/*.spec.ts',
  timeout: 300_000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      ...(exe ? { executablePath: exe } : {}),
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
    },
  },
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
