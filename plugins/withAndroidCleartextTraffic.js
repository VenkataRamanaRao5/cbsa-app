/**
 * Expo config plugin: Allow cleartext (HTTP) traffic on Android.
 *
 * Android 9+ blocks all cleartext HTTP/WS traffic by default.  This
 * prevents the app from reaching local-network backends such as
 * http://192.168.x.x:8000 that the user configures at login time,
 * even though the same URL works fine in a phone browser.
 *
 * Setting android:usesCleartextTraffic="true" on the <application>
 * element permits — but never forces — cleartext.  HTTPS/WSS
 * connections to the production Azure backend are unaffected.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
