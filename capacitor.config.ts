import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barakahflow.app',
  appName: 'BarakaFlow',
  webDir: 'public',
  server: {
    url: 'https://barakah-flow.vercel.app',
    cleartext: true
  }
};

export default config;
