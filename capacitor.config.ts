import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.airplanesurvivor.game',
  appName: '太空战线幸存者',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#060a14',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#060a14',
    },
    CapacitorUpdater: {
      autoUpdate: false,
      resetWhenUpdate: true,
    },
  },
};

export default config;
