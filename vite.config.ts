import { defineConfig } from 'vite';

/** 自定义域名用 '/'；若走 github.io/仓库名/ 路径则设为 '/airplane-survivor/' */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
});
