/**
 * Expo Config Plugin — Android Health Connect
 * Adds the health permissions and Health Connect intent filter to AndroidManifest.xml.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const HEALTH_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.READ_HYDRATION',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.READ_DISTANCE',
];

module.exports = (config) => {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // Add permissions
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    for (const perm of HEALTH_PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm,
      );
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    // Add Health Connect intent filter to the main activity
    const app = manifest.application?.[0];
    const mainActivity = app?.activity?.find((a) =>
      a['intent-filter']?.some((f) =>
        f.action?.some((ac) => ac.$?.['android:name'] === 'android.intent.action.MAIN'),
      ),
    );

    if (mainActivity) {
      if (!mainActivity['intent-filter']) mainActivity['intent-filter'] = [];
      const hcFilterExists = mainActivity['intent-filter'].some((f) =>
        f.action?.some((a) => a.$?.['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'),
      );
      if (!hcFilterExists) {
        mainActivity['intent-filter'].push({
          action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
        });
      }
    }

    return mod;
  });
};
