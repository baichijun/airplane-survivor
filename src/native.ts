import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/** 原生壳初始化：竖屏、沉浸、Splash、返回键 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await ScreenOrientation.lock({ orientation: 'portrait' });

  if (Capacitor.getPlatform() === 'android') {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#060a14' });
    await StatusBar.hide();
  }

  await SplashScreen.hide();

  // 隐藏状态栏后视口高度可能变化，触发画布重新适配
  window.dispatchEvent(new Event('resize'));

  let lastBackPress = 0;
  App.addListener('backButton', () => {
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      void App.exitApp();
      return;
    }
    lastBackPress = now;
  });
}
