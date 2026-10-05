// Android stand-in for `@expo/ui/jetpack-compose`. Its only importer is expo-router's
// Stack.Toolbar / native header items, which this app doesn't use. Paired with excluding
// `@expo/ui` from Android autolinking, this keeps Jetpack Compose + Material3 out of the APK.
module.exports = require('./unavailable').unavailableModule('@expo/ui/jetpack-compose');
