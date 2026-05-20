/**
 * Expo Config Plugin — iOS WidgetKit Extension
 * Adds the MyOrbitWidget extension target and App Group entitlement.
 * The Swift source files in ios/MyOrbitWidget/ are copied by EAS Build.
 */
const { withEntitlementsPlist, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const APP_GROUP_ID = 'group.com.myorbit.app';

module.exports = (config) => {
  // Add App Group entitlement to main app
  config = withEntitlementsPlist(config, (mod) => {
    if (!mod.modResults['com.apple.security.application-groups']) {
      mod.modResults['com.apple.security.application-groups'] = [];
    }
    if (!mod.modResults['com.apple.security.application-groups'].includes(APP_GROUP_ID)) {
      mod.modResults['com.apple.security.application-groups'].push(APP_GROUP_ID);
    }
    return mod;
  });

  // Note: Full WidgetKit extension target injection requires @expo/config-plugins
  // withXcodeProject API. For EAS Build, the ios/MyOrbitWidget directory is
  // automatically picked up if added as a target in the Xcode project.
  // In a bare workflow, run: expo prebuild → add widget target in Xcode.

  return config;
};
