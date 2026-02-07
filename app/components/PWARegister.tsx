"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Don't register service worker during development
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.error("Service worker registration failed:", err);
      }
    })();
  }, []);

  return null;
}
