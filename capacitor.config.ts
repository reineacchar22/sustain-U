import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoclubsualberta.sustainu',
  appName: 'Sustain-U',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
};

export default config;
