import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { Icon } from "./Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("nmc-pwa-install-dismissed") === "1",
  );
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

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

    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
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
    localStorage.setItem("nmc-pwa-install-dismissed", "1");
  };

  return (
    <>
      {offline && (
        <div className="status-chip status-offline" role="status">
          <Icon icon={WifiOff} size="sm" />
          <span>Offline — your progress is saved locally</span>
        </div>
      )}

      {!installed && deferred && !dismissed && (
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
    </>
  );
}
