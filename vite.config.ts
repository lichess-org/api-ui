import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.ASSET_PATH || '/',
  test: {
    environment: 'jsdom',
  },
});
