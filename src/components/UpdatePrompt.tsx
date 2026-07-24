import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

/** Registers the service worker and applies updates automatically. */
export function UpdatePrompt() {
  useEffect(() => {
    registerSW({ immediate: true });
  }, []);

  return null;
}
