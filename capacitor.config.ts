import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manofwhitebrown.scatterly',
  appName: 'Scatterly',
  webDir: 'dist',
  backgroundColor: '#1f3a40',
  android: { allowMixedContent: false },
};

export default config;
