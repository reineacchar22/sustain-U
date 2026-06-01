"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NOTE_KEY = "uofa_gratitude_note_v1";

const PROMPTS = [
  "Name three small things in nature you noticed today.",
  "What moment today made you feel most alive?",
  "Who helped the environment in a small way today — including you?",
  "What do you appreciate about where you live right now?",
  "Write one sentence starting with: 'Even though things feel heavy, I'm grateful for…'",
];

export default function GratitudePage() {
  const [note, setNote]         = useState("");
  const [saved, setSaved]       = useState(false);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    const s = localStorage.getItem(NOTE_KEY);
    if (s) setNote(s);
  }, []);

  const save = () => {
    localStorage.setItem(NOTE_KEY, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">
          <Link
            href="/wellness"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Wellness
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="text-4xl mb-4 leading-none">🙏</div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Gratitude Journalling</h1>
          <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
            Ground yourself in what&apos;s good. Even small moments of gratitude shift your nervous system out of anxiety mode.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

        {/* Today's prompt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Today&apos;s prompt</p>
          <p className="text-[16px] font-semibold text-gray-800 leading-relaxed">&ldquo;{prompt}&rdquo;</p>
        </div>

        {/* Journal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Your reflection</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A few lines is enough…"
            rows={6}
            className="w-full text-[14px] text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={save}
            disabled={!note.trim()}
            className="mt-3 w-full py-3.5 rounded-xl font-bold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: saved ? "#16a34a" : "#1a5c42", color: "white" }}
          >
            {saved ? "✓ Saved" : "Save note"}
          </button>
        </div>

        {/* Why it helps */}
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-2.5">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest">Why this helps</p>
          <p className="text-[13px] text-emerald-900 leading-relaxed">
            Gratitude practice activates the brain&apos;s reward circuit, counteracting the negativity bias that makes eco-anxiety spiral.
            Even two minutes a day measurably reduces cortisol within two weeks.
          </p>
        </div>

        <p className="text-center text-[12px] text-gray-400 pb-2">Notes are saved locally on this device only.</p>
      </div>
    </div>
  );
}
