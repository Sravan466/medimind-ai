const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// Don't override the default extensions, just use the defaults from Expo
// defaultConfig.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = defaultConfig;
