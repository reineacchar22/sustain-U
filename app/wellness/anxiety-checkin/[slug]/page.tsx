"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";

// ─── Data ────────────────────────────────────────────────────────────────────

const PAGES = {
  breathing: {
    icon: "🫁",
    title: "2-Minute Breathing",
    subtitle: "An extended exhale activates your parasympathetic nervous system, shifting you out of fight-or-flight in under two minutes.",
  },
  "name-it": {
    icon: "🧠",
    title: "Name + Normalize",
    subtitle: "Naming an emotion reduces its intensity. Neuroscientists call it 'affect labelling' — putting words to feelings calms the amygdala.",
  },
  "tiny-action": {
    icon: "✅",
    title: "Take a Tiny Action",
    subtitle: "Anxiety feeds on helplessness. Even the smallest action breaks the cycle and reminds you that you have agency.",
  },
  connection: {
    icon: "🤝",
    title: "Reach Out & Connect",
    subtitle: "Eco-anxiety shrinks when shared. You don't have to have answers — just being witnessed by someone who cares is enough.",
  },
  boundaries: {
    icon: "🛡️",
    title: "Set Boundaries",
    subtitle: "Staying informed is important, but your nervous system needs recovery time. Boundaries protect your capacity to keep caring.",
  },
};

type Slug = keyof typeof PAGES;

// ─── Shared nav ──────────────────────────────────────────────────────────────

function BackNav() {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center">
        <Link
          href="/wellness/anxiety-checkin"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Check-in
        </Link>
      </div>
    </div>
  );
}

function Hero({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-5xl mb-5 leading-none">{icon}</div>
        <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{children}</p>;
}

// ─── Breathing ───────────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { name: "Inhale",  cue: "Breathe in…",  duration: 4, scale: 1.35 },
  { name: "Hold",    cue: "Hold…",         duration: 2, scale: 1.35 },
  { name: "Exhale",  cue: "Breathe out…", duration: 6, scale: 0.65 },
];

function BreathingPage() {
  const [running,  setRunning]  = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count,    setCount]    = useState(BREATH_PHASES[0].duration);
  const [cycles,   setCycles]   = useState(0);
  const phaseRef = useRef(0);
  const countRef = useRef(BREATH_PHASES[0].duration);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      countRef.current -= 1;
      if (countRef.current <= 0) {
        const next = (phaseRef.current + 1) % BREATH_PHASES.length;
        if (next === 0) setCycles(c => c + 1);
        phaseRef.current = next;
        countRef.current = BREATH_PHASES[next].duration;
        setPhaseIdx(next);
      }
      setCount(countRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const start = () => {
    phaseRef.current = 0;
    countRef.current = BREATH_PHASES[0].duration;
    setPhaseIdx(0);
    setCount(BREATH_PHASES[0].duration);
    setCycles(0);
    setRunning(true);
  };

  const stop = () => setRunning(false);

  const phase = BREATH_PHASES[phaseIdx];
  const scale = running ? phase.scale : 0.75;
  const dur   = running ? phase.duration : 0.4;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      {/* Animated circle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
        <div
          style={{
            width: 160, height: 160, borderRadius: "50%",
            background: running ? "#e8f6ef" : "#f3f4f6",
            border: `3px solid ${running ? "#2a9d6e" : "#d1d5db"}`,
            transform: `scale(${scale})`,
            transition: `transform ${dur}s ease-in-out, background 0.4s, border-color 0.4s`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
          }}
        >
          <span className="text-[36px] font-bold tabular-nums text-gray-800" style={{ color: running ? "#1a5c42" : "#9ca3af" }}>
            {running ? count : ""}
          </span>
          {!running && <span className="text-[28px]">🫁</span>}
        </div>

        <p className="mt-6 text-[18px] font-semibold text-gray-700 h-7">
          {running ? phase.cue : "Ready when you are"}
        </p>
        {running && (
          <p className="mt-1 text-[13px] text-gray-400">{phase.name} · {phase.duration}s</p>
        )}
        {cycles > 0 && (
          <p className="mt-2 text-[13px] font-semibold text-emerald-600">{cycles} cycle{cycles !== 1 ? "s" : ""} complete</p>
        )}

        <div className="flex gap-3 mt-6">
          {!running ? (
            <button
              onClick={start}
              className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-8 py-3 rounded-xl bg-gray-100 text-gray-700 text-[14px] font-bold hover:bg-gray-200 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Pattern */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>The pattern</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {BREATH_PHASES.map(p => (
            <div key={p.name} className={[
              "rounded-xl p-3 text-center border transition-all",
              running && phaseIdx === BREATH_PHASES.indexOf(p)
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-50 border-gray-100",
            ].join(" ")}>
              <div className="text-[22px] font-bold tabular-nums text-gray-800">{p.duration}s</div>
              <div className="text-[12px] font-semibold text-gray-500 mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <SectionLabel>Why it works</SectionLabel>
        {[
          { icon: "📉", text: "A longer exhale than inhale triggers the vagus nerve, slowing your heart rate." },
          { icon: "🧠", text: "Counting gives your mind a simple anchor, interrupting the anxiety spiral." },
          { icon: "⏱️", text: "Six repetitions (≈ 72 seconds) is enough to measurably reduce cortisol." },
        ].map(i => (
          <div key={i.text} className="flex gap-3">
            <span className="text-lg flex-shrink-0">{i.icon}</span>
            <p className="text-[14px] text-gray-600 leading-relaxed">{i.text}</p>
          </div>
        ))}
      </div>

      {/* Box breathing tip */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest mb-2">Variation</p>
        <p className="text-[14px] text-emerald-900 leading-relaxed font-medium">
          Try <strong>box breathing</strong> (4–4–4–4) if you prefer a steady rhythm: inhale 4, hold 4, exhale 4, hold 4.
        </p>
      </div>
    </div>
  );
}

// ─── Name it ─────────────────────────────────────────────────────────────────

const ECO_FEELINGS = [
  { word: "Grief",       desc: "Mourning ecosystems, species, or futures that have been lost or are threatened." },
  { word: "Overwhelm",   desc: "Too much information, too fast — the scale of the crisis feels impossible to hold." },
  { word: "Helplessness",desc: "The gap between how big the problem is and how small any individual action feels." },
  { word: "Anger",       desc: "Frustration at inaction, denial, or injustice from individuals, corporations, or governments." },
  { word: "Guilt",       desc: "Awareness of your own footprint and complicity in a system you didn't design." },
  { word: "Hope",        desc: "Belief that change is still possible — often fragile, but powerful when found." },
];

const SCRIPTS = [
  "\"This is eco-anxiety. It's a normal response to a real threat.\"",
  "\"My feelings are information, not a verdict.\"",
  "\"I can be both upset about this AND capable of moving forward.\"",
  "\"Feeling this doesn't mean I'm broken — it means I care.\"",
];

function NameItPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      {/* 3 steps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>The 3-step process</SectionLabel>
        <div className="space-y-3">
          {[
            { step: "1", name: "Notice", desc: "Pause. Place one hand on your chest. Ask: what am I feeling right now?" },
            { step: "2", name: "Name it", desc: "Find a word for it. Grief, anger, guilt, overwhelm, helplessness, hope. The more specific, the better." },
            { step: "3", name: "Normalize it", desc: "Say out loud or in your head: 'This feeling makes sense. It's okay to feel this way.'" },
          ].map(s => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[14px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <div className="text-[14px] font-bold text-gray-900">{s.name}</div>
                <div className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feeling dictionary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>Eco-feeling dictionary</SectionLabel>
        <div className="space-y-3">
          {ECO_FEELINGS.map(f => (
            <div key={f.word} className="flex gap-3 items-start">
              <span className="text-[13px] font-bold text-emerald-700 w-24 flex-shrink-0 pt-0.5">{f.word}</span>
              <span className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scripts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>Scripts to say to yourself</SectionLabel>
        <div className="space-y-3">
          {SCRIPTS.map(s => (
            <div key={s} className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[14px] text-emerald-900 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tiny action ─────────────────────────────────────────────────────────────

const ACTIONS = [
  { time: "< 5 min",  items: ["Fill and carry a reusable bottle", "Share a climate resource with one person", "Turn off lights in unused rooms", "Take the stairs instead of the elevator"] },
  { time: "< 30 min", items: ["Take transit for one trip today", "Cook or order a plant-based meal", "Walk or bike somewhere you'd usually drive"] },
  { time: "Anytime",  items: ["Message a friend to walk together", "Follow a local climate group", "Write one thing you're grateful for in nature"] },
];

function TinyActionPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (item: string) =>
    setChecked(prev => { const n = new Set(prev); n.has(item) ? n.delete(item) : n.add(item); return n; });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      {/* Why it works */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest mb-2">Why this helps</p>
        <p className="text-[14px] text-emerald-900 leading-relaxed">
          Anxiety feeds on helplessness. Taking even the smallest action reconnects you to your sense of agency — it shifts you from passive worry to active participation.
        </p>
      </div>

      {/* Action lists */}
      {ACTIONS.map(group => (
        <div key={group.time} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionLabel>{group.time}</SectionLabel>
          <div className="space-y-2">
            {group.items.map(item => (
              <button
                key={item}
                onClick={() => toggle(item)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-gray-50"
              >
                <div className={[
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  checked.has(item) ? "bg-emerald-600 border-emerald-600" : "border-gray-300",
                ].join(" ")}>
                  {checked.has(item) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={[
                  "text-[14px] font-medium transition-all",
                  checked.has(item) ? "line-through text-gray-400" : "text-gray-700",
                ].join(" ")}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {checked.size > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 text-center">
          <p className="text-[15px] font-bold text-emerald-700">
            {checked.size} action{checked.size !== 1 ? "s" : ""} completed today
          </p>
          <p className="text-[13px] text-gray-400 mt-1">Every step counts.</p>
        </div>
      )}
    </div>
  );
}

// ─── Connection ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { label: "Low-key check-in",  text: "Hey — been feeling a lot about climate stuff lately. Want to take a short walk and talk sometime?" },
  { label: "Group chat opener", text: "Anyone else feeling the weight of the environmental news lately? I'd love to talk about it with people who get it." },
  { label: "Invite to act",     text: "I've been wanting to do something small but meaningful this week. Want to join me?" },
];

const STARTERS = [
  "\"What climate story has been sitting with you lately?\"",
  "\"What gives you hope about the environment?\"",
  "\"How do you take care of yourself when climate news feels heavy?\"",
  "\"Is there something small we could do together this week?\"",
];

function ConnectionPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      {/* Message templates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>Ready-to-send messages</SectionLabel>
        <div className="space-y-3">
          {TEMPLATES.map(t => (
            <div key={t.label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-gray-500">{t.label}</span>
                <button
                  onClick={() => copy(t.text, t.label)}
                  className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {copied === t.label ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation starters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>Conversation starters</SectionLabel>
        <div className="space-y-2.5">
          {STARTERS.map(s => (
            <div key={s} className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[14px] text-emerald-900 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Local groups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>Connect locally</SectionLabel>
        <div className="space-y-3">
          {[
            { name: "Climate Action UAlberta Coalition", url: "https://www.uaclimateaction.ca/" },
            { name: "Edmonton Youth for Climate",         url: "https://www.instagram.com/edmontonyouthforclimate/" },
            { name: "Climate Justice Edmonton",           url: "https://climatejusticeedmonton.com/" },
          ].map(g => (
            <a
              key={g.name}
              href={g.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50 transition-all no-underline"
            >
              <span className="text-[14px] font-semibold text-gray-800">{g.name}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Boundaries ───────────────────────────────────────────────────────────────

const ALTERNATIVES = [
  { icon: "🌿", text: "Step outside for 5 minutes" },
  { icon: "🫁", text: "Do the 4-2-6 breathing exercise" },
  { icon: "☕", text: "Make tea or a snack" },
  { icon: "🚶", text: "Walk around the block" },
  { icon: "📖", text: "Read a page of a book" },
  { icon: "🎵", text: "Put on a favourite song" },
];

function BoundariesPage() {
  const TIMER_SECS = 10 * 60;
  const [timeLeft,  setTimeLeft]  = useState(TIMER_SECS);
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setTimeLeft(TIMER_SECS);
    setFinished(false);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const pct  = ((TIMER_SECS - timeLeft) / TIMER_SECS) * 100;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
      {/* Timer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
        <SectionLabel>10-minute timer</SectionLabel>

        {/* Progress ring */}
        <div className="relative w-36 h-36 my-2">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx={60} cy={60} r={52} fill="none" stroke="#f3f4f6" strokeWidth={8} />
            <circle cx={60} cy={60} r={52} fill="none"
              stroke={finished ? "#16a34a" : running ? "#1a5c42" : "#d1d5db"}
              strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold tabular-nums text-gray-800">
              {finished ? "✓" : `${mins}:${secs}`}
            </span>
            {finished && <span className="text-[12px] font-semibold text-emerald-600 mt-0.5">Done!</span>}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {!running && !finished && (
            <button onClick={start} className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
              Start timer
            </button>
          )}
          {running && (
            <button onClick={stop} className="px-8 py-3 rounded-xl bg-gray-100 text-gray-700 text-[14px] font-bold hover:bg-gray-200 transition-colors">
              Stop
            </button>
          )}
          {finished && (
            <button onClick={start} className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
              Go again
            </button>
          )}
        </div>

        <p className="mt-4 text-[13px] text-gray-400 text-center max-w-xs leading-relaxed">
          Set a limit on news or social media. When this goes off — put the phone down.
        </p>
      </div>

      {/* What to do instead */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <SectionLabel>What to do instead</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {ALTERNATIVES.map(a => (
            <div key={a.text} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-lg flex-shrink-0">{a.icon}</span>
              <span className="text-[13px] font-medium text-gray-700 leading-snug">{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why it matters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <SectionLabel>Why it matters</SectionLabel>
        {[
          { icon: "📵", text: "Reading more bad news doesn't change it — but it does keep your nervous system in alarm mode." },
          { icon: "🔋", text: "Recovery time is what allows you to keep caring and acting over the long term." },
          { icon: "📰", text: "You can stay meaningfully informed with 1–2 intentional news checks per day." },
        ].map(i => (
          <div key={i.text} className="flex gap-3">
            <span className="text-lg flex-shrink-0">{i.icon}</span>
            <p className="text-[14px] text-gray-600 leading-relaxed">{i.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default function CopingStrategyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  if (!(slug in PAGES)) notFound();
  const page = PAGES[slug as Slug];

  const content: Record<Slug, React.ReactNode> = {
    breathing:     <BreathingPage />,
    "name-it":     <NameItPage />,
    "tiny-action": <TinyActionPage />,
    connection:    <ConnectionPage />,
    boundaries:    <BoundariesPage />,
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <BackNav />
      <Hero icon={page.icon} title={page.title} subtitle={page.subtitle} />
      {content[slug as Slug]}
    </div>
  );
}
