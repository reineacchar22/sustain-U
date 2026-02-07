"use client";

import { useEffect, useState } from "react";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const LS_PREFIX = "uofa_gratitude_v1_";

export default function GratitudePage() {
  const [dateISO, setDateISO] = useState(todayISO());
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(LS_PREFIX + dateISO);
    if (!raw) {
      setL1(""); setL2(""); setL3("");
      return;
    }
    try {
      const v = JSON.parse(raw);
      setL1(v.l1 ?? "");
      setL2(v.l2 ?? "");
      setL3(v.l3 ?? "");
    } catch {
      setL1(""); setL2(""); setL3("");
    }
  }, [dateISO]);

  const save = () => {
    localStorage.setItem(
      LS_PREFIX + dateISO,
      JSON.stringify({ l1, l2, l3, savedAt: Date.now() })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 900);
  };

  return (
    <div style={{ minHeight: "100vh", padding: 18 }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>🙏 Gratitude Journaling</h1>
        <p style={{ opacity: 0.75, marginTop: 6 }}>
          Three simple lines. Saved on your device.
        </p>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 800, fontSize: 13, opacity: 0.75 }}>
            Date
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              style={{
                marginLeft: 10,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "white",
              }}
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <Input value={l1} setValue={setL1} placeholder="1) Today I’m grateful for…" />
          <Input value={l2} setValue={setL2} placeholder="2) Something small that helped me…" />
          <Input value={l3} setValue={setL3} placeholder="3) A person/place/moment I appreciate…" />
        </div>

        <button
          onClick={save}
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(21,71,52,0.22)",
            background: "rgba(21,71,52,0.14)",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          {saved ? "✅ Saved" : "💾 Save"}
        </button>
      </div>
    </div>
  );
}

function Input(props: {
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={props.value}
      onChange={(e) => props.setValue(e.target.value)}
      placeholder={props.placeholder}
      style={{
        width: "100%",
        padding: "12px 12px",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.14)",
        background: "rgba(255,255,255,0.92)",
        outline: "none",
      }}
    />
  );
}
