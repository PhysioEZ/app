import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.physioez.app',
  appName: 'PhysioEZ',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
