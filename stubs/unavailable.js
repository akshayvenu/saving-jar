/**
 * Builds a stand-in for a native-backed export that has been stripped from the Android build
 * (see metro.config.js). Importing it is harmless; rendering or calling it throws, so accidental
 * use fails loudly instead of silently rendering nothing.
 */
function unavailable(pkg, name) {
  function Unavailable() {
    throw new Error(
      `${pkg} "${name}" is stripped from the Android build to keep the APK small. ` +
        `Remove it from the stubs in metro.config.js (and from expo.autolinking.android.exclude in package.json) to use it.`
    );
  }
  // Nested access (e.g. `DropdownMenu.Trigger`, `EnterTransition.scaleIn`) yields further stand-ins.
  return new Proxy(Unavailable, {
    get: (target, key) =>
      typeof key === 'symbol' || key in target ? target[key] : unavailable(pkg, `${name}.${key}`),
  });
}

/** A module whose every named export is an `unavailable` stand-in. */
function unavailableModule(pkg) {
  return new Proxy(
    { __esModule: true },
    {
      get: (target, key) =>
        typeof key === 'symbol' || key in target || key === 'then'
          ? target[key]
          : unavailable(pkg, key),
    }
  );
}

module.exports = { unavailable, unavailableModule };
