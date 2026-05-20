/**
 * Expo Config Plugin — Android Home Screen Widget
 * Registers MyOrbit widget receivers and metadata in AndroidManifest.xml
 * for react-native-android-widget.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const WIDGETS = [
  { name: 'SmallWidget',  label: 'MyOrbit Small',  minWidth: 2, minHeight: 2 },
  { name: 'MediumWidget', label: 'MyOrbit Medium', minWidth: 4, minHeight: 2 },
  { name: 'LargeWidget',  label: 'MyOrbit Large',  minWidth: 4, minHeight: 4 },
];

module.exports = (config) => {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;

    if (!app.receiver) app.receiver = [];

    for (const widget of WIDGETS) {
      const exists = app.receiver.some(
        (r) => r.$?.['android:name'] === `.widget.${widget.name}`,
      );
      if (exists) continue;

      app.receiver.push({
        $: {
          'android:name': `.widget.${widget.name}`,
          'android:exported': 'true',
          'android:label': widget.label,
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': `@xml/${widget.name.toLowerCase()}_info`,
            },
          },
        ],
      });
    }

    return mod;
  });
};
