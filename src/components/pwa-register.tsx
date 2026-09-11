import { useEffect } from "react";

/**
 * Home Screen auto-update: check for a new SW on load / focus / visibility,
 * then soft-reload once the new worker takes control.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;

    const check = () => {
      void registration?.update().catch(() => null);
    };

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;
        void reg.update().catch(() => null);
      })
      .catch(() => null);

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
