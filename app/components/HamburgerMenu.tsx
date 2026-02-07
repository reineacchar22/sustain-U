"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type MenuItem =
  | { type: "route"; label: string; href: string; emoji?: string }
  | { type: "external"; label: string; href: string; emoji?: string };

const MENU: MenuItem[] = [
  { type: "route", label: "Official Campus Map", href: "/official", emoji: "🗺️" },
  { type: "route", label: "CO₂ Self-Tracker", href: "/co2", emoji: "🌍" },
  { type: "route", label: "Mental Health Support", href: "/mental-health", emoji: "🧠" },
  { type: "route", label: "Climate Wellness", href: "/wellness", emoji: "🌿" },

  // Placeholder for later
  { type: "external", label: "UofA Online On-Demand Courses", href: "https://www.ualberta.ca/en/admissions-programs/online-courses/index.html", emoji: "🎓" },

  { type: "external", label: "UAlberta Library", href: "https://www.library.ualberta.ca/", emoji: "📚" },
  { type: "external", label: "ETS Trip Planner", href: "https://www.edmonton.ca/ets", emoji: "🚌" },
  { type: "external", label: "Campus Walks", href: "https://www.alltrails.com/trail/canada/alberta/emily-murphy-park-trail", emoji: "🚶" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC key closes menu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Floating hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        ☰
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 1001,
          }}
        />
      )}

      {/* Side drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 320,
          background: "#ffffff",
          zIndex: 1002,
          transform: open ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 200ms ease-out",
          boxShadow: "12px 0 32px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 800,
          }}
        >
          Menu
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "white",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <nav style={{ padding: 12, overflowY: "auto" }}>
          {MENU.map((item) => {
            const active = item.type === "route" && item.href === pathname;

            const rowStyle: React.CSSProperties = {
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 14,
              marginBottom: 8,
              textDecoration: "none",
              fontSize: 15,
              color: "#111",
              background: active ? "rgba(21,71,52,0.12)" : "transparent",
              border: "1px solid rgba(0,0,0,0.06)",
            };

            return item.type === "route" ? (
              <Link key={item.href} href={item.href} style={rowStyle}>
                <span style={{ width: 22 }}>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={rowStyle}
              >
                <span style={{ width: 22 }}>{item.emoji}</span>
                <span>{item.label}</span>
                <span style={{ marginLeft: "auto", opacity: 0.6 }}>↗</span>
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: 14, fontSize: 12, opacity: 0.7 }}>
          Tip: press <b>Esc</b> to close
        </div>
      </aside>
    </>
  );
}
