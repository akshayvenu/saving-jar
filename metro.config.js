const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-router eagerly imports these on Android for features this app doesn't use
// (Stack.Toolbar, NativeTabs). Swapping them for throwing stubs drops their JS and the
// ~1 MB Material Symbols font from the bundle. See stubs/ for details.
const androidStubs = {
  '@expo/ui/jetpack-compose': path.resolve(__dirname, 'stubs/expo-ui-jetpack-compose.js'),
  'expo-symbols': path.resolve(__dirname, 'stubs/expo-symbols.js'),
};

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'android' && androidStubs[moduleName]) {
    return { type: 'sourceFile', filePath: androidStubs[moduleName] };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
