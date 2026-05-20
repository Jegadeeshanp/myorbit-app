/**
 * Expo Config Plugin — Apple HealthKit
 * Adds NSHealthShareUsageDescription + HealthKit entitlement to the iOS build.
 */
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const HEALTH_SHARE_MSG =
  'MyOrbit reads your health data (steps, sleep, heart rate, workouts) to show it in your dashboard.';

module.exports = (config) => {
  // Info.plist permissions
  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSHealthShareUsageDescription  = HEALTH_SHARE_MSG;
    mod.modResults.NSHealthUpdateUsageDescription = HEALTH_SHARE_MSG;
    return mod;
  });

  // Entitlements
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.healthkit'] = true;
    mod.modResults['com.apple.developer.healthkit.access'] = ['health-records'];
    return mod;
  });

  return config;
};
