import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manofwhitebrown.scatterly',
  appName: 'Scatterly',
  webDir: 'dist',
  backgroundColor: '#2b2230',
  android: { allowMixedContent: false },
};

export default config;
