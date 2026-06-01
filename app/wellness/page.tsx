"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PROMPTS = [
  "Find one small detail in nature you'd normally miss. Describe it in 2 sentences.",
  "What did you notice about the sky today — colour, movement, feeling?",
  "Write a 3-line 'weather report' for your mood.",
  "Name one place on campus that feels calm. What makes it feel that way?",
  "List 5 sounds you hear right now. Which one feels most comforting?",
  "If nature could text you today, what would it say?",
  "Describe a tree like it's a character in a story.",
  "Write one sentence starting with: 'Even though things feel heavy…'",
];

const NOTE_KEY   = "uofa_wellness_note_v1";
const YT_RESET   = "https://www.youtube-nocookie.com/embed/cCcZSeBJhUA";
const YT_TED     = "https://www.youtube-nocookie.com/embed/pBq31tsG2X4";
const PDF_URL    = "https://eopcn.ca/wp-content/uploads/2026/01/Managing-Eco_Anxiety-2026.pdf";
const FOLIO_URL  = "https://www.ualberta.ca/en/folio/2024/07/the-hidden-toll-of-climate-change.html";
const YOGA_URL   = "https://www.ualberta.ca/en/campus-community-recreation/special-events/unwind-your-mind.html";
const REPAIR_URL = "https://sites.google.com/ualberta.ca/hecolrepaircafe/resources?authuser=0";

export default function WellnessPage() {
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  const [note,      setNote]      = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(NOTE_KEY);
    if (saved) setNote(saved);
  }, []);

  const saveNote = () => {
    localStorage.setItem(NOTE_KEY, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-5xl mb-5 leading-none">🌿</div>
          <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">
            Climate Wellness Notebook
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            A calm space for climate emotions — reflection, grounding, and gentle action.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Quick links */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Tools
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/wellness/anxiety-checkin", icon: "🧠", label: "Eco-anxiety check-in",   sub: "Self-regulate in minutes" },
              { href: "/wellness/gratitude",        icon: "🙏", label: "Gratitude journalling", sub: "Ground yourself daily"    },
            ].map(t => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all no-underline"
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <div>
                  <div className="text-[14px] font-bold text-gray-900 leading-snug">{t.label}</div>
                  <div className="text-[12px] text-gray-400 mt-0.5">{t.sub}</div>
                </div>
                <div className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 group-hover:gap-1.5 transition-all mt-auto">
                  Open
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Daily reflection prompt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Today&apos;s prompt
          </p>
          <p className="text-[16px] text-gray-800 leading-relaxed font-medium">
            &ldquo;{prompt}&rdquo;
          </p>
        </div>

        {/* Write here */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Your reflection
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A few lines is enough…"
            rows={5}
            className="w-full text-[14px] text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 outline-none resize-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={saveNote}
            disabled={!note.trim()}
            className="mt-3 w-full py-3 rounded-xl font-bold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: noteSaved ? "#16a34a" : "#1a5c42",
              color: "white",
            }}
          >
            {noteSaved ? "✓ Saved locally" : "Save note"}
          </button>
        </div>

        {/* Videos */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Watch
          </p>
          <div className="space-y-4">
            {[
              { src: YT_RESET, title: "Gentle reset",                desc: "A short video to help you slow down and breathe." },
              { src: YT_TED,   title: "Eco-anxiety → optimism",      desc: "TED talk on turning climate anxiety into action." },
            ].map(v => (
              <div key={v.src} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <iframe
                  src={`${v.src}?rel=0&playsinline=1`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video border-none"
                />
                <div className="px-5 py-4">
                  <div className="text-[14px] font-bold text-gray-900">{v.title}</div>
                  <div className="text-[13px] text-gray-500 mt-0.5">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External resources */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Resources
          </p>
          <div className="space-y-3">
            {[
              { href: YOGA_URL,   icon: "🧘", label: "Yoga on Campus",         sub: "Unwind Your Mind — U of A Recreation" },
              { href: FOLIO_URL,  icon: "🎓", label: "UAlberta Folio article",  sub: "The hidden toll of climate change" },
              { href: REPAIR_URL, icon: "🧵", label: "H-ECOL Repair Café",      sub: "Community repair resources at U of A" },
            ].map(r => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all no-underline"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-800">{r.label}</div>
                    <div className="text-[12px] text-gray-400 mt-0.5">{r.sub}</div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* PDF */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Guide
            </p>
            <div className="text-[15px] font-bold text-gray-900">Managing Eco-Anxiety</div>
            <div className="text-[13px] text-gray-500 mt-0.5">EOPCN — 2026 edition</div>
          </div>
          <iframe
            src={PDF_URL}
            title="Managing Eco-Anxiety PDF"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full border-none border-t border-gray-100"
            style={{ height: 480 }}
          />
          <div className="px-5 py-4 border-t border-gray-100">
            <a
              href={PDF_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700 hover:text-emerald-600 no-underline transition-colors"
            >
              Open in new tab
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-400 pb-4">
          Your notes are saved locally on this device only.
        </p>

      </div>
    </div>
  );
}
