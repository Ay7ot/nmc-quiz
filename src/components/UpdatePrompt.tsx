import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { Icon } from "./Icon";

export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
    setUpdateSW(() => update);
  }, []);

  if (!needRefresh || !updateSW) return null;

  return (
    <div className="update-toast">
      <span>A new version is ready</span>
      <button type="button" className="update-toast-btn" onClick={() => void updateSW()}>
        <Icon icon={RefreshCw} size="sm" />
        Update
      </button>
    </div>
  );
}
