import { defineConfig } from 'vite';

/** 相对路径 base，兼容 GitHub Pages 子路径、Capacitor 与微信 web-view */
export default defineConfig({
  base: './',
});
