/** True when running as an installed PWA (home screen / standalone). */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone, iPad, or iPadOS reporting as Mac with touch. */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Safari on iOS — the only browser that supports Add to Home Screen as a PWA. */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}
