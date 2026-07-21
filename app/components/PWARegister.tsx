"use client";
import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Unregister all service workers in Capacitor (Android/iOS)
    const isCapacitor = window.location.protocol === "capacitor:" ||
                        (window.location.hostname === "localhost" &&
                        navigator.userAgent.includes("wv"));

    if (isCapacitor) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      return;
    }

    if (process.env.NODE_ENV !== "production") return;
    (async () => {
      try {
        await navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`);
      } catch (err) {
        console.error("Service worker registration failed:", err);
      }
    })();
  }, []);
  return null;
}
