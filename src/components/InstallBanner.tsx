import { useEffect, useState } from "react";
import { Download, Share, WifiOff, X } from "lucide-react";
import { isIOS, isIOSSafari, isStandalone } from "../lib/pwa";
import { Icon } from "./Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nmc-pwa-install-dismissed";

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );
  const [installed, setInstalled] = useState(isStandalone);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [iosDevice] = useState(isIOS);
  const [iosSafari] = useState(isIOSSafari);

  useEffect(() => {
    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const onDisplayMode = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.matchMedia("(display-mode: standalone)").addEventListener("change", onDisplayMode);

    setInstalled(isStandalone());

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", onDisplayMode);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setDeferred(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const showAndroidInstall = !installed && deferred && !dismissed;
  const showIOSInstall = !installed && iosDevice && !dismissed;

  return (
    <>
      {offline && (
        <div className="status-chip status-offline" role="status">
          <Icon icon={WifiOff} size="sm" />
          <span>Offline — your progress is saved locally</span>
        </div>
      )}

      {showAndroidInstall && (
        <div className="install-banner">
          <div className="install-banner-icon">
            <Icon icon={Download} size="lg" />
          </div>
          <div className="install-banner-copy">
            <strong>Install app</strong>
            <span>Add to home screen for full-screen practice</span>
          </div>
          <button type="button" className="install-banner-cta" onClick={handleInstall}>
            Install
          </button>
          <button
            type="button"
            className="install-banner-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>
      )}

      {showIOSInstall && !showAndroidInstall && (
        <div className="install-banner install-banner-ios">
          <div className="install-banner-icon">
            <Icon icon={Share} size="lg" />
          </div>
          <div className="install-banner-copy">
            <strong>Add to Home Screen</strong>
            {iosSafari ? (
              <span>
                Tap <strong>Share</strong> below, then <strong>Add to Home Screen</strong>
              </span>
            ) : (
              <span>
                Open this page in <strong>Safari</strong>, then Share → Add to Home Screen
              </span>
            )}
          </div>
          <button
            type="button"
            className="install-banner-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>
      )}
    </>
  );
}
