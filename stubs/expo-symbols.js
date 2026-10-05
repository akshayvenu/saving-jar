// Android stand-in for `expo-symbols`. Its only importer is expo-router's NativeTabs icon
// converter, which this app doesn't use. The real module bundles a ~1 MB Material Symbols font.
module.exports = require('./unavailable').unavailableModule('expo-symbols');
