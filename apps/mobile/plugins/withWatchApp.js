/**
 * Expo Config Plugin — Watch Connectivity
 * Adds WKCompanionAppBundleIdentifier to the main app's Info.plist (iOS)
 * and enables background modes required for watch communication.
 */
const { withInfoPlist } = require('@expo/config-plugins');

module.exports = (config) => {
  return withInfoPlist(config, (mod) => {
    // Required for Watch app pairing
    mod.modResults.WKCompanionAppBundleIdentifier = config.ios?.bundleIdentifier ?? '';

    // Background modes: watch connectivity + background fetch
    if (!mod.modResults.UIBackgroundModes) {
      mod.modResults.UIBackgroundModes = [];
    }
    const modes = ['watch-background-complication', 'fetch', 'remote-notification'];
    for (const mode of modes) {
      if (!mod.modResults.UIBackgroundModes.includes(mode)) {
        mod.modResults.UIBackgroundModes.push(mode);
      }
    }

    return mod;
  });
};
