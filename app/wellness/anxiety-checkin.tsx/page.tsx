"use client";

import { useEffect, useMemo, useState } from "react";

const COPING = [
  { label: "2-minute breathing", text: "Breathe in 4, hold 2, out 6. Repeat 6 times." },
  { label: "Name + normalize", text: "“This is eco-anxiety. It’s a normal response to a real issue.”" },
  { label: "Tiny action", text: "Pick one small action in the next 24h (refill bottle, transit once, share a resource)." },
  { label: "Connection", text: "Text a friend: “Want to take a short walk and talk?”" },
  { label: "Boundaries", text: "Limit doomscrolling: set a 10-minute timer → stop when time’s up." }
];

export default function AnxietyCheckin() {
  const storageKey = "uofa_wellness_anxiety_checkin_v1";

  const [rating, setRating] = useState(4);
  const [trigger, setTrigger] = useState("");
  const [body, setBody] = useState("");
  const [thought, setThought] = useState("");
  const [nextStep, setNextStep] = useState(COPING[0].label);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setRating(s.rating ?? 4);
      setTrigger(s.trigger ?? "");
      setBody(s.body ?? "");
      setThought(s.thought ?? "");
      setNextStep(s.nextStep ?? COPING[0].label);
    } catch {}
  }, []);

  const tip = useMemo(() => COPING.find((c) => c.label === nextStep)?.text ?? "", [nextStep]);

  const save = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ rating, trigger, body, thought, nextStep, savedAt: Date.now() })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div style={page()}>
      <h1 style={h1()}>🧠 Eco-anxiety check-in</h1>
      <p style={sub()}>
        A quick self-check to help you regulate and choose one gentle next step.
      </p>

      <div style={card()}>
        <label style={label()}>
          How intense is it right now? <b>{rating}/10</b>
          <input type="range" min={0} max={10} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        </label>

        <label style={label()}>
          What triggered it? (optional)
          <input style={input()} value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="e.g., news, class topic, social media" />
        </label>

        <label style={label()}>
          Where do you feel it in your body? (optional)
          <input style={input()} value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g., tight chest, restless, headache" />
        </label>

        <label style={label()}>
          What’s the loudest thought? (optional)
          <input style={input()} value={thought} onChange={(e) => setThought(e.target.value)} placeholder="e.g., “Nothing I do matters”" />
        </label>

        <label style={label()}>
          Pick a next step
          <select style={input()} value={nextStep} onChange={(e) => setNextStep(e.target.value)}>
            {COPING.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div style={tipBox()}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Suggested script</div>
          <div style={{ lineHeight: 1.4 }}>{tip}</div>
        </div>

        <button onClick={save} style={btn()}>
          {saved ? "✅ Saved" : "💾 Save check-in"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
          If you feel unsafe or overwhelmed, consider reaching out to campus supports or someone you trust.
        </div>
      </div>
    </div>
  );
}

function page(): React.CSSProperties {
  return {
    minHeight: "100vh",
    padding: 18,
    fontFamily: "system-ui",
    background:
      "radial-gradient(900px 500px at 20% 0%, rgba(21,71,52,0.14), transparent 55%), linear-gradient(180deg, rgba(245,247,246,1), rgba(235,240,238,1))"
  };
}
function h1(): React.CSSProperties {
  return { fontSize: 26, fontWeight: 1000, maxWidth: 900, margin: "0 auto" };
}
function sub(): React.CSSProperties {
  return { opacity: 0.75, marginTop: 6, maxWidth: 900, marginLeft: "auto", marginRight: "auto" };
}
function card(): React.CSSProperties {
  return {
    maxWidth: 900,
    margin: "16px auto 0",
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "grid",
    gap: 12
  };
}
function label(): React.CSSProperties {
  return { display: "grid", gap: 6, fontWeight: 900, opacity: 0.9 };
}
function input(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", background: "white" };
}
function tipBox(): React.CSSProperties {
  return { padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" };
}
function btn(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(21,71,52,0.22)",
    background: "rgba(21,71,52,0.14)",
    cursor: "pointer",
    fontWeight: 1000
  };
}
