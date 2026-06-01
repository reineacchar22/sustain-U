"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Slug = "breathing" | "name-it" | "tiny-action" | "connection" | "boundaries";

const PAGES: Record<Slug, { icon: string; title: string; subtitle: string }> = {
  breathing:    { icon: "🫁", title: "4-2-6 Breathing",      subtitle: "Extend your exhale to activate your parasympathetic nervous system and calm anxiety in under 2 minutes." },
  "name-it":    { icon: "🧠", title: "Name It to Tame It",   subtitle: "Labelling an emotion reduces its intensity. Putting words to feelings calms the amygdala." },
  "tiny-action":{ icon: "✅", title: "Take a Tiny Action",   subtitle: "Anxiety feeds on helplessness. Even the smallest step reconnects you to your sense of agency." },
  connection:   { icon: "🤝", title: "Reach Out & Connect",  subtitle: "Eco-anxiety shrinks when shared. You don't need answers — just being witnessed by someone who cares is enough." },
  boundaries:   { icon: "🛡️", title: "Set a Media Boundary", subtitle: "Staying informed matters, but your nervous system needs recovery time. Limits protect your capacity to keep caring." },
};

// ─── Shared nav ───────────────────────────────────────────────────────────────
function BackNav({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link
          href="/wellness/anxiety-checkin"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Check-in
        </Link>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <div className="w-16" />
      </div>
    </div>
  );
}

function Hero({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="text-4xl mb-4 leading-none">{icon}</div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── BREATHING ────────────────────────────────────────────────────────────────
const PHASES = [
  { name: "Inhale",  cue: "Breathe in slowly…",   secs: 4,  scale: 1.35, color: "#059669" },
  { name: "Hold",    cue: "Hold gently…",          secs: 2,  scale: 1.35, color: "#0891b2" },
  { name: "Exhale",  cue: "Breathe out fully…",   secs: 6,  scale: 0.68, color: "#7c3aed" },
];
const TOTAL_ROUNDS = 6;

function BreathingExercise() {
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount]       = useState(PHASES[0].secs);
  const [rounds, setRounds]     = useState(0);

  const phaseRef  = useRef(0);
  const countRef  = useRef(PHASES[0].secs);
  const roundsRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      countRef.current -= 1;
      setCount(countRef.current);
      if (countRef.current <= 0) {
        const next = (phaseRef.current + 1) % PHASES.length;
        if (next === 0) {
          roundsRef.current += 1;
          setRounds(roundsRef.current);
          if (roundsRef.current >= TOTAL_ROUNDS) {
            clearInterval(id);
            setRunning(false);
            setDone(true);
            return;
          }
        }
        phaseRef.current = next;
        countRef.current = PHASES[next].secs;
        setPhaseIdx(next);
        setCount(PHASES[next].secs);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    phaseRef.current = 0; countRef.current = PHASES[0].secs; roundsRef.current = 0;
    setPhaseIdx(0); setCount(PHASES[0].secs); setRounds(0);
    setDone(false); setRunning(true);
  };

  const stop = () => setRunning(false);

  const phase = PHASES[phaseIdx];
  const scale = running ? phase.scale : 0.78;
  const dur   = running ? phase.secs  : 0.4;

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

      {/* Circle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
        <div style={{
          width: 170, height: 170, borderRadius: "50%",
          background: done ? "#f0fdf4" : running ? "#ecfdf5" : "#f9fafb",
          border: `3px solid ${done ? "#16a34a" : running ? phase.color : "#e5e7eb"}`,
          transform: `scale(${scale})`,
          transition: `transform ${dur}s ease-in-out, border-color 0.5s, background 0.5s`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          {done ? (
            <>
              <span style={{ fontSize: 36 }}>✓</span>
              <span className="text-[13px] font-bold text-emerald-700">Complete!</span>
            </>
          ) : running ? (
            <>
              <span style={{ fontSize: 44, fontWeight: 800, color: phase.color, fontVariantNumeric: "tabular-nums" }}>{count}</span>
              <span className="text-[12px] font-semibold text-gray-400">{phase.name}</span>
            </>
          ) : (
            <span className="text-[15px] font-semibold text-gray-400 text-center px-4">Ready when you are</span>
          )}
        </div>

        <p className="mt-6 text-[17px] font-semibold text-gray-700 text-center h-6">
          {done ? "Wonderful. Take a moment to notice how you feel." : running ? phase.cue : ""}
        </p>

        {/* Round dots */}
        {!done && (
          <div className="flex gap-2 mt-4">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-colors" style={{ background: i < rounds ? "#16a34a" : "#e5e7eb" }} />
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {done ? (
            <button onClick={start} className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
              Go again
            </button>
          ) : !running ? (
            <button onClick={start} className="px-10 py-3 rounded-xl bg-emerald-700 text-white text-[15px] font-bold hover:bg-emerald-600 transition-colors">
              Start
            </button>
          ) : (
            <button onClick={stop} className="px-10 py-3 rounded-xl bg-gray-100 text-gray-700 text-[15px] font-bold hover:bg-gray-200 transition-colors">
              Pause
            </button>
          )}
        </div>
      </div>

      {/* Phase guide */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">The pattern</p>
        <div className="grid grid-cols-3 gap-3">
          {PHASES.map((p, i) => (
            <div key={p.name} className="rounded-xl p-3 text-center border transition-all"
              style={{ background: running && phaseIdx === i ? p.color + "15" : "#f9fafb", borderColor: running && phaseIdx === i ? p.color + "60" : "#f3f4f6" }}>
              <div className="text-[22px] font-bold" style={{ color: running && phaseIdx === i ? p.color : "#374151" }}>{p.secs}s</div>
              <div className="text-[11px] font-semibold text-gray-500 mt-0.5">{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why it works */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-2.5">
        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest">Why this works</p>
        {[
          "A longer exhale (6s) than inhale (4s) activates the vagus nerve, slowing your heart rate.",
          "Counting anchors attention, interrupting the anxiety thought loop.",
          "Six full rounds takes about 72 seconds — measurable cortisol reduction.",
        ].map(t => (
          <p key={t} className="text-[13px] text-emerald-900 leading-relaxed">{t}</p>
        ))}
      </div>
    </div>
  );
}

// ─── NAME IT ─────────────────────────────────────────────────────────────────
const FRAMES = [
  { label: "Name the feeling", prompt: "What are you feeling right now? Try to name it precisely.", placeholder: "e.g. dread, helplessness, guilt, anger, grief…" },
  { label: "Validate it",      prompt: "Write: 'It makes sense that I feel this because…'", placeholder: "e.g. because the news was heavy and I care deeply…" },
  { label: "Separate self",    prompt: "Finish this: 'I am feeling this, but I am not overwhelmed forever. Right now…'", placeholder: "e.g. I am sitting safely, I have people around me…" },
];

const AFFIRMATIONS = [
  "Feeling this doesn't mean I'm broken — it means I care.",
  "My feelings are information, not a verdict.",
  "I can be both worried AND capable of moving forward.",
  "This is eco-anxiety. It is a normal response to a real threat.",
];

function NameItExercise() {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [done, setDone]       = useState(false);
  const [affirm] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);

  const update = (val: string) => setAnswers(a => { const n = [...a]; n[step] = val; return n; });

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

      {!done ? (
        <>
          {/* Progress */}
          <div className="flex gap-2">
            {FRAMES.map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                style={{ background: i <= step ? "#059669" : "#e5e7eb" }} />
            ))}
          </div>

          {/* Current step */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-bold flex items-center justify-center">{step + 1}</span>
              <span className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wider">{FRAMES[step].label}</span>
            </div>
            <p className="text-[15px] font-semibold text-gray-800 mb-4 leading-relaxed">{FRAMES[step].prompt}</p>
            <textarea
              value={answers[step]}
              onChange={e => update(e.target.value)}
              placeholder={FRAMES[step].placeholder}
              rows={4}
              className="w-full text-[14px] text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <div className="flex justify-between mt-4">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                  ← Back
                </button>
              ) : <div />}
              <button
                onClick={() => step < FRAMES.length - 1 ? setStep(s => s + 1) : setDone(true)}
                disabled={!answers[step].trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step < FRAMES.length - 1 ? "Next →" : "Finish"}
              </button>
            </div>
          </div>

          {/* Previous answers */}
          {step > 0 && answers.slice(0, step).map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{FRAMES[i].label}</p>
              <p className="text-[13px] text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Done */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="text-[17px] font-bold text-gray-900 mb-2">Well done</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed">You named it. That takes courage.</p>
          </div>

          {/* Affirmation */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-3">Carry this with you</p>
            <p className="text-[17px] font-bold text-emerald-900 leading-relaxed italic">&ldquo;{affirm}&rdquo;</p>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            {FRAMES.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-[13px] text-gray-700 leading-relaxed">{answers[i]}</p>
              </div>
            ))}
          </div>

          <button onClick={() => { setStep(0); setAnswers(["","",""]); setDone(false); }}
            className="w-full py-3.5 rounded-2xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
            Start again
          </button>
        </>
      )}
    </div>
  );
}

// ─── TINY ACTION ─────────────────────────────────────────────────────────────
const ACTIONS = [
  { time: "2 min",  text: "Refill and carry a reusable bottle today",         pts: 10 },
  { time: "2 min",  text: "Share one climate resource with a friend",          pts: 10 },
  { time: "2 min",  text: "Turn off lights in rooms you're not using",         pts: 5  },
  { time: "5 min",  text: "Write down one thing you're grateful for in nature",pts: 15 },
  { time: "5 min",  text: "Look up one local climate group or event",          pts: 15 },
  { time: "10 min", text: "Choose plant-based for your next meal",             pts: 20 },
  { time: "10 min", text: "Walk or bike for one trip instead of driving",      pts: 20 },
  { time: "10 min", text: "Message someone to take a walk together",           pts: 20 },
  { time: "Today",  text: "Take transit instead of a car for one journey",     pts: 25 },
  { time: "Today",  text: "Bring your own bag to the next store run",          pts: 10 },
];

function TinyActionExercise() {
  const [selected, setSelected] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

      {!committed ? (
        <>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
            <p className="text-[13px] text-emerald-900 leading-relaxed font-medium">
              Pick <strong>one</strong> action below that feels doable today. Small steps break the anxiety cycle and rebuild your sense of agency.
            </p>
          </div>

          <div className="space-y-2.5">
            {ACTIONS.map((a, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
                style={{
                  borderColor: selected === i ? "#059669" : "#f3f4f6",
                  background:  selected === i ? "#f0fdf4" : "white",
                }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: selected === i ? "#059669" : "#d1d5db", background: selected === i ? "#059669" : "white" }}>
                  {selected === i && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-800 leading-snug">{a.text}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{a.time} · +{a.pts} pts</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => selected !== null && setCommitted(true)}
            disabled={selected === null}
            className="w-full py-4 rounded-2xl bg-emerald-700 text-white text-[15px] font-bold transition-colors disabled:opacity-35 disabled:cursor-not-allowed hover:bg-emerald-600"
          >
            I commit to this →
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-7 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Committed!</h2>
            <p className="text-[15px] text-gray-500 mb-4">Your action:</p>
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
              <p className="text-[15px] font-bold text-emerald-900">{ACTIONS[selected!].text}</p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-2">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest">Remember</p>
            <p className="text-[14px] text-emerald-900 leading-relaxed">
              You don&apos;t have to fix the climate today. You just have to do <strong>one thing</strong>. That one thing shifts you from helpless to active — and that shift changes everything.
            </p>
          </div>

          <button onClick={() => { setSelected(null); setCommitted(false); }}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-[14px] font-bold hover:border-emerald-300 hover:text-emerald-700 transition-colors">
            Choose a different action
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CONNECTION ───────────────────────────────────────────────────────────────
const SCRIPTS = [
  {
    label: "Low-key check-in",
    msg:   "Hey — I've been feeling a lot about climate stuff lately. Would you be up for a short walk and a chat sometime?",
  },
  {
    label: "Group chat opener",
    msg:   "Anyone else feeling heavy after reading the news lately? I'd love to talk with people who get it.",
  },
  {
    label: "Invite to act",
    msg:   "I've been wanting to do something small but meaningful. Want to join me for [action] this week?",
  },
  {
    label: "Simple share",
    msg:   "Thinking of you. Climate stuff has been weighing on me — how are you holding up?",
  },
];

const STARTERS = [
  '“What climate story has been sitting with you lately?”',
  '“What gives you hope about the environment right now?”',
  '“How do you take care of yourself when the news feels heavy?”',
  '“Is there one small thing we could do together this week?”',
];

function ConnectionExercise() {
  const [copied, setCopied]   = useState<string | null>(null);
  const [reached, setReached] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
        <p className="text-[13px] text-emerald-900 leading-relaxed">
          You don&apos;t need to have answers or solutions. Just reaching out — saying &quot;me too&quot; — is enough to make eco-anxiety feel less isolating.
        </p>
      </div>

      {/* Scripts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Ready-to-send messages — tap to copy</p>
        <div className="space-y-3">
          {SCRIPTS.map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-gray-50 border border-gray-100 transition-all hover:border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</span>
                <button
                  onClick={() => copy(s.msg, s.label)}
                  className="flex items-center gap-1.5 text-[12px] font-bold transition-colors"
                  style={{ color: copied === s.label ? "#059669" : "#6b7280" }}
                >
                  {copied === s.label ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{s.msg}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation starters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Conversation starters</p>
        <div className="space-y-2.5">
          {STARTERS.map(s => (
            <div key={s} className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[14px] text-emerald-900 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commit */}
      {!reached ? (
        <button onClick={() => setReached(true)}
          className="w-full py-4 rounded-2xl bg-emerald-700 text-white text-[15px] font-bold hover:bg-emerald-600 transition-colors">
          I reached out ✓
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 text-center">
          <p className="text-3xl mb-2">🤝</p>
          <p className="text-[16px] font-bold text-gray-900 mb-1">That took courage.</p>
          <p className="text-[13px] text-gray-500 leading-relaxed">Connection is one of the most powerful antidotes to eco-anxiety. Well done.</p>
        </div>
      )}
    </div>
  );
}

// ─── BOUNDARIES ───────────────────────────────────────────────────────────────
const TIMER_SECS = 10 * 60;

function BoundariesExercise() {
  const [timeLeft, setTimeLeft]   = useState(TIMER_SECS);
  const [running, setRunning]     = useState(false);
  const [finished, setFinished]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setTimeLeft(TIMER_SECS); setFinished(false); setRunning(true);
  }, []);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    pause(); setTimeLeft(TIMER_SECS); setFinished(false);
  }, [pause]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setRunning(false); setFinished(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins  = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs  = (timeLeft % 60).toString().padStart(2, "0");
  const pct   = ((TIMER_SECS - timeLeft) / TIMER_SECS) * 100;
  const r     = 52;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * (1 - pct / 100);
  const color = finished ? "#16a34a" : running ? "#0891b2" : "#d1d5db";

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

      {/* Timer card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-5">10-minute media limit</p>

        {/* SVG ring */}
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx={60} cy={60} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
            <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold tabular-nums" style={{ color: finished ? "#16a34a" : "#111827" }}>
              {finished ? "✓" : `${mins}:${secs}`}
            </span>
            {finished && <span className="text-[12px] font-bold text-emerald-600 mt-1">Time&apos;s up!</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          {!running && !finished && (
            <button onClick={start} className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
              Start timer
            </button>
          )}
          {running && (
            <>
              <button onClick={pause} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-[14px] font-bold hover:bg-gray-200 transition-colors">
                Pause
              </button>
              <button onClick={reset} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-[14px] font-bold hover:bg-gray-200 transition-colors">
                Reset
              </button>
            </>
          )}
          {finished && (
            <button onClick={start} className="px-8 py-3 rounded-xl bg-emerald-700 text-white text-[14px] font-bold hover:bg-emerald-600 transition-colors">
              Start again
            </button>
          )}
          {!running && !finished && timeLeft < TIMER_SECS && (
            <button onClick={reset} className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-[14px] font-bold hover:bg-gray-200 transition-colors">
              Reset
            </button>
          )}
        </div>

        <p className="mt-4 text-[13px] text-gray-400 text-center max-w-xs leading-relaxed">
          {finished
            ? "Put the phone down. Your nervous system will thank you."
            : "When this goes off, close the news or social media — no exceptions."}
        </p>
      </div>

      {/* What to do instead */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">After the timer — try one of these</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["🌿", "Step outside for 5 min"],
            ["🫁", "Do the 4-2-6 breathing"],
            ["☕", "Make tea or a snack"],
            ["🚶", "Walk around the block"],
            ["📖", "Read a page of a book"],
            ["🎵", "Put on a favourite song"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="text-[12px] font-medium text-gray-700 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why it matters */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-2.5">
        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest">Why limits help</p>
        {[
          "Reading more bad news doesn't change it — but it keeps your nervous system in alarm mode.",
          "Recovery time is what lets you keep caring and acting over the long term.",
          "1–2 intentional news checks per day is enough to stay meaningfully informed.",
        ].map(t => (
          <p key={t} className="text-[13px] text-emerald-900 leading-relaxed">{t}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function AnxietyCheckinClient({ slug }: { slug: string }) {
  if (!(slug in PAGES)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Exercise not found.</p>
      </div>
    );
  }
  const page = PAGES[slug as Slug];

  const content: Record<Slug, React.ReactNode> = {
    breathing:     <BreathingExercise />,
    "name-it":     <NameItExercise />,
    "tiny-action": <TinyActionExercise />,
    connection:    <ConnectionExercise />,
    boundaries:    <BoundariesExercise />,
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <BackNav title={page.title} />
      <Hero icon={page.icon} title={page.title} subtitle={page.subtitle} />
      {content[slug as Slug]}
    </div>
  );
}
