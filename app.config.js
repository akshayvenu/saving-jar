// Lets an EAS profile tune the Android build via env vars (see eas.json):
// - ANDROID_BUILD_ARCHS narrows the ABIs. A universal APK with all four ABIs is ~4x larger
//   than one built for arm64-v8a only.
// - ANDROID_COMPACT_APK=1 compresses the native libraries and the Hermes bundle inside the
//   APK. That shrinks a sideloaded APK by several MB at the cost of slightly slower startup
//   and a larger installed footprint. Leave it off for Play Store (AAB) builds: Play already
//   compresses the download and prefers uncompressed libs on device.
module.exports = ({ config }) => {
  const archs = process.env.ANDROID_BUILD_ARCHS;
  const compact = process.env.ANDROID_COMPACT_APK === '1';
  if (!archs && !compact) return config;

  const overrides = {
    ...(archs && { buildArchs: archs.split(',') }),
    ...(compact && { useLegacyPackaging: true, enableBundleCompression: true }),
  };

  return {
    ...config,
    plugins: config.plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? [plugin[0], { ...plugin[1], android: { ...plugin[1].android, ...overrides } }]
        : plugin
    ),
  };
};
