const { withAndroidStyles } = require('expo/config-plugins');

/**
 * The Material 3 date picker (`design="material"`) requires the Android app
 * theme to inherit from a Material3 theme; Expo defaults to AppCompat.
 */
module.exports = function withMaterial3Theme(config) {
  return withAndroidStyles(config, (config) => {
    const appTheme = config.modResults.resources.style?.find((s) => s.$.name === 'AppTheme');
    if (appTheme) appTheme.$.parent = 'Theme.Material3.DayNight.NoActionBar';
    return config;
  });
};
