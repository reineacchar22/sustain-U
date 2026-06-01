"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const COPING = [
  { label: "2-min breathing", icon: "💨", slug: "breathing",   text: "Breathe in 4 counts, hold 2, out 6. Repeat 6 times." },
  { label: "Name it",         icon: "🧠", slug: "name-it",     text: "Say: This is eco-anxiety. It is a normal response to a real issue." },
  { label: "Tiny action",     icon: "✅", slug: "tiny-action", text: "Pick one small action in the next 24 h: refill a bottle, take transit, or share a resource." },
  { label: "Connection",      icon: "🤝", slug: "connection",  text: "Text a friend: Want to take a short walk and talk?" },
  { label: "Boundaries",      icon: "🛡️", slug: "boundaries", text: "Set a 10-minute timer for news or social media and stop when it goes off." },
];

const intensityColor = (r: number) =>
  r <= 3 ? "#16a34a" : r <= 6 ? "#d97706" : "#dc2626";

const intensityLabel = (r: number) =>
  r <= 2 ? "Low" : r <= 4 ? "Mild" : r <= 6 ? "Moderate" : r <= 8 ? "High" : "Intense";

export default function AnxietyCheckin() {
  const storageKey = "uofa_wellness_anxiety_checkin_v1";

  const [rating,   setRating]   = useState(4);
  const [trigger,  setTrigger]  = useState("");
  const [body,     setBody]     = useState("");
  const [thought,  setThought]  = useState("");
  const [selected, setSelected] = useState(COPING[0].label);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setRating(s.rating ?? 4);
      setTrigger(s.trigger ?? "");
      setBody(s.body ?? "");
      setThought(s.thought ?? "");
      setSelected(s.nextStep ?? COPING[0].label);
    } catch {}
  }, []);

  const coping = useMemo(
    () => COPING.find((c) => c.label === selected) ?? COPING[0],
    [selected]
  );

  const save = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ rating, trigger, body, thought, nextStep: selected, savedAt: Date.now() })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const color = intensityColor(rating);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/mental-health"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Mental Health
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-5xl mb-5 leading-none">🧠</div>
          <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">
            Eco-anxiety check-in
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            A quick self-check to help you regulate and choose one gentle next step.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        {/* Intensity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Intensity right now
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-semibold mr-1" style={{ color }}>
                {intensityLabel(rating)}
              </span>
              <span className="text-[32px] font-bold tabular-nums leading-none" style={{ color }}>
                {rating}
              </span>
              <span className="text-[14px] text-gray-400 font-medium">/10</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, ${color} ${rating * 10}%, #e5e7eb ${rating * 10}%)`,
              accentColor: color,
            }}
          />
          <div className="flex justify-between mt-2.5 text-[11px] text-gray-400 font-medium">
            <span>None</span>
            <span>Moderate</span>
            <span>Intense</span>
          </div>
        </div>

        {/* Reflection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Reflection{" "}
            <span className="normal-case font-medium text-gray-400">(optional)</span>
          </p>
          {[
            { label: "What triggered it?", value: trigger, set: setTrigger, placeholder: "e.g. news article, class topic, social media" },
            { label: "Where do you feel it in your body?", value: body, set: setBody, placeholder: "e.g. tight chest, restless, headache" },
            { label: "What is the loudest thought?", value: thought, set: setThought, placeholder: "e.g. Nothing I do matters" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                {f.label}
              </label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3.5 py-2.5 text-[14px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          ))}
        </div>

        {/* Coping strategy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Pick a next step
          </p>

          <div className="space-y-2">
            {COPING.map((c) => (
              <button
                key={c.label}
                onClick={() => setSelected(c.label)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                  selected === c.label
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white",
                ].join(" ")}
              >
                <span className="text-xl flex-shrink-0">{c.icon}</span>
                <span
                  className={[
                    "text-[14px] font-semibold flex-1",
                    selected === c.label ? "text-emerald-800" : "text-gray-700",
                  ].join(" ")}
                >
                  {c.label}
                </span>
                {selected === c.label && (
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Suggested script */}
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-2">
              Suggested script
            </p>
            <p className="text-[14px] text-emerald-900 leading-relaxed">{coping.text}</p>
            <Link
              href={`/wellness/anxiety-checkin/${coping.slug}`}
              className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-bold text-emerald-700 hover:text-emerald-600 transition-colors no-underline"
            >
              Start full exercise
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className="w-full py-4 rounded-2xl font-bold text-[15px] tracking-tight transition-all active:scale-[0.99] shadow-sm"
          style={{ background: saved ? "#16a34a" : "#1a5c42", color: "white" }}
        >
          {saved ? "Saved" : "Save check-in"}
        </button>

        <p className="text-center text-[12px] text-gray-400 leading-relaxed pb-6">
          If you feel unsafe or overwhelmed, please reach out to campus supports or someone you trust.
        </p>

      </div>
    </div>
  );
}
