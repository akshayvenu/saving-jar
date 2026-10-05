// Lets an EAS profile narrow the Android ABIs via ANDROID_BUILD_ARCHS (see eas.json).
// A universal APK with all four ABIs is ~4x larger than one built for arm64-v8a only.
module.exports = ({ config }) => {
  const archs = process.env.ANDROID_BUILD_ARCHS;
  if (!archs) return config;

  return {
    ...config,
    plugins: config.plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? [
            plugin[0],
            {
              ...plugin[1],
              android: { ...plugin[1].android, buildArchs: archs.split(',') },
            },
          ]
        : plugin
    ),
  };
};
