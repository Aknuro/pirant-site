import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В разработке запросы /api и /uploads уходят на бэкенд (npm run dev в папке server).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } },
});
