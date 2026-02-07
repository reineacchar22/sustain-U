"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const PROMPTS = [
  "Find one small detail in nature you’d normally miss. Describe it in 2 sentences.",
  "What did you notice about the sky today (color, movement, feeling)?",
  "Write a 3-line “weather report” for your mood.",
  "Name one place on campus that feels calm. What makes it feel that way?",
  "List 5 sounds you hear right now. Which one feels most comforting?",
  "If nature could text you today, what would it say?",
  "Describe a tree like it’s a character in a story—what’s its personality?",
  "Write one sentence that begins with: “Even though things feel heavy, I can still…”",
  "Notice one texture (wind, sleeve fabric, bench, bark). Describe it like poetry.",
  "What’s one thing in nature that’s steady—even when you’re not?"
];

type PromptHistoryItem = {
  dateISO: string;
  prompt: string;
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// deterministic hash so the "Daily prompt" is stable
function hashToIndex(str: string, mod: number) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % mod;
}

const LS_PROMPT_HISTORY = "uofa_wellness_prompt_history_v1";
const LS_NOTE_PREFIX = "uofa_wellness_note_v1_"; // per date

const PDF_URL = "https://eopcn.ca/wp-content/uploads/2026/01/Managing-Eco_Anxiety-2026.pdf";
const FOLIO_URL = "https://www.ualberta.ca/en/folio/2024/07/the-hidden-toll-of-climate-change.html";
const YT_VIDEO_1 = "https://www.youtube-nocookie.com/embed/cCcZSeBJhUA"; // your first video
const YT_VIDEO_2 = "https://www.youtube-nocookie.com/embed/pBq31tsG2X4"; // TEDx eco-anxiety optimism

export default function WellnessPage() {
  const [dateISO, setDateISO] = useState(todayISO());

  // prompt card + animation
  const [prompt, setPrompt] = useState<string>("");
  const [flipKey, setFlipKey] = useState(0);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);

  // write-here note
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // load history
    const raw = localStorage.getItem(LS_PROMPT_HISTORY);
    let parsed: PromptHistoryItem[] = [];
    if (raw) {
      try {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) parsed = v;
      } catch {}
    }
    setHistory(parsed);

    // choose today's prompt deterministically by date
    const idx = hashToIndex(dateISO, PROMPTS.length);
    const dailyPrompt = PROMPTS[idx];
    setPrompt(dailyPrompt);

    // ensure today's prompt exists in history (only once)
    const exists = parsed.some((h) => h.dateISO === dateISO);
    if (!exists) {
      const next = [{ dateISO, prompt: dailyPrompt }, ...parsed].slice(0, 30);
      setHistory(next);
      localStorage.setItem(LS_PROMPT_HISTORY, JSON.stringify(next));
    }

    // load note for this date
    const noteKey = LS_NOTE_PREFIX + dateISO;
    setNote(localStorage.getItem(noteKey) ?? "");
  }, [dateISO]);

  const historyToShow = useMemo(() => history.slice(0, 10), [history]);

  const setNewPromptNow = () => {
    let next = prompt;
    for (let i = 0; i < 8 && next === prompt; i++) {
      next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    }
    setPrompt(next);
    setFlipKey((k) => k + 1);

    const updated: PromptHistoryItem[] = [
      { dateISO, prompt: next },
      ...history.filter((h) => h.dateISO !== dateISO)
    ].slice(0, 30);

    setHistory(updated);
    localStorage.setItem(LS_PROMPT_HISTORY, JSON.stringify(updated));
  };

  const saveNote = () => {
    const noteKey = LS_NOTE_PREFIX + dateISO;
    localStorage.setItem(noteKey, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div style={page()}>
      <div style={paper()}>
        {/* Header */}
        <div style={headerRow()}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: -0.4 }}>
              🌿 Climate Wellness Notebook
            </div>
            <div style={{ opacity: 0.7, marginTop: 6, lineHeight: 1.4 }}>
              Reflection, grounding, and gentle action — without overwhelm.
            </div>
          </div>

          <div style={tab()}>
            <div style={{ fontWeight: 1000 }}>Daily</div>
            <div style={{ opacity: 0.75, fontSize: 12 }}>{dateISO}</div>
          </div>
        </div>

        <div style={grid()}>
          {/* LEFT COLUMN */}
          <div style={{ display: "grid", gap: 14 }}>
            {/* Video 1 */}
            <section style={section()}>
              <div style={sectionTitle()}>📺 Watch and Reset </div>
              <div style={videoFrame()}>
                <iframe
                  width="100%"
                  height="100%"
                  src={YT_VIDEO_1}
                  title="Climate wellness video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </div>
              <div style={smallNote()}>
                Tip: treat this like a reset, not homework.
              </div>
            </section>

            {/* Video 2 */}
            <section style={section()}>
              <div style={sectionTitle()}>🎤 Eco-anxiety → optimism (TEDx)</div>
              <div style={videoFrame()}>
                <iframe
                  width="100%"
                  height="100%"
                  src={YT_VIDEO_2}
                  title="Eco-anxiety to climate optimism (TEDx)"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </div>
              <div style={smallNote()}>
                If you’re spiraling, this one is great for “hope + practical steps.”
              </div>
            </section>

            {/* Prompt card */}
            <section style={sticky()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 1000 }}>✨ Today’s prompt</div>
                <button onClick={setNewPromptNow} style={miniBtn()}>
                  New prompt ↻
                </button>
              </div>

              <div key={flipKey} style={flipCard()}>
                <div style={{ fontSize: 16, lineHeight: 1.45 }}>{prompt}</div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                  View date:
                  <input
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    style={dateInput()}
                  />
                </label>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Changing date loads that day’s prompt + your note.
                </div>
              </div>
            </section>

            {/* Write here note */}
            <section style={section()}>
              <div style={sectionTitle()}>📝 Write here (saved on your device)</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                placeholder="A few lines is enough. Example: what you’re feeling, what you noticed, or one gentle next step."
                style={noteBox()}
              />

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                <button onClick={saveNote} style={primaryBtn()}>
                  {saved ? "✅ Saved" : "💾 Save note"}
                </button>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Stored locally (no account, no upload).
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "grid", gap: 14 }}>
            {/* Tools + links */}
            <section style={section()}>
              <div style={sectionTitle()}> Tools & resources</div>

              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/wellness/anxiety-checkin" style={toolCard()}>
                  <div style={{ fontSize: 22 }}>🧠</div>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Eco-anxiety check-in</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      Name it → rate it → choose one coping step
                    </div>
                  </div>
                  <div style={arrow()}>→</div>
                </Link>

                <Link href="/wellness/gratitude" style={toolCard()}>
                  <div style={{ fontSize: 22 }}>🙏</div>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Gratitude journalling</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      Three lines a day (saved locally)
                    </div>
                  </div>
                  <div style={arrow()}>→</div>
                </Link>

                <a
                  href="https://natureconservancy.ca/nature-writing-prompts-to/"
                  target="_blank"
                  rel="noreferrer"
                  style={toolCard()}
                >
                  <div style={{ fontSize: 22 }}>✍️</div>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Nature writing prompts (NCC)</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      Creativity + connection prompts ↗
                    </div>
                  </div>
                  <div style={arrow()}>↗</div>
                </a>

                <a
                  href="https://www.ualberta.ca/en/campus-community-recreation/special-events/unwind-your-mind.html"
                  target="_blank"
                  rel="noreferrer"
                  style={toolCard()}
                >
                  <div style={{ fontSize: 22 }}>🧘</div>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Yoga on Campus</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      Unwind Your Mind ↗
                    </div>
                  </div>
                  <div style={arrow()}>↗</div>
                </a>
                <a
                href="https://sites.google.com/ualberta.ca/hecolrepaircafe/resources?authuser=0"
                target="_blank"
                rel="noreferrer"
                style={toolCard()}
                >
                <div style={{ fontSize: 22 }}>🧵</div>
                <div>
                    <div style={{ fontWeight: 1000 }}>H-ECOL Repair Café — Resources</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                    Practical sustainability skills + community repair ↗
                    </div>
                </div>
                <div style={arrow()}>↗</div>
                </a>

                <a href={FOLIO_URL} target="_blank" rel="noreferrer" style={toolCard()}>
                  <div style={{ fontSize: 22 }}>🎓</div>
                  <div>
                    <div style={{ fontWeight: 1000 }}>UAlberta Folio: The hidden toll of climate change</div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      Mental health + climate impacts ↗
                    </div>
                  </div>
                  <div style={arrow()}>↗</div>
                </a>
              </div>
            </section>

            {/* PDF embed */}
            <section style={section()}>
              <div style={sectionTitle()}>📄 Managing Eco-Anxiety (PDF)</div>

              <div style={pdfFrame()}>
                <object data={PDF_URL} type="application/pdf" width="100%" height="100%">
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 1000, marginBottom: 6 }}>
                      Your browser didn’t load the PDF inline.
                    </div>
                    <a href={PDF_URL} target="_blank" rel="noreferrer" style={{ fontWeight: 900 }}>
                      Open the PDF in a new tab ↗
                    </a>
                  </div>
                </object>
              </div>

              <div style={smallNote()}>
                If the PDF area is blank, use “Open the PDF” (some browsers block inline PDFs).
              </div>
            </section>

            {/* Prompt history */}
            <section style={section()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={sectionTitle()}>📚 Prompt history</div>
                <button
                  onClick={() => {
                    if (confirm("Clear prompt history (notes stay)?")) {
                      localStorage.removeItem(LS_PROMPT_HISTORY);
                      setHistory([]);
                    }
                  }}
                  style={miniBtn()}
                >
                  Clear
                </button>
              </div>

              {historyToShow.length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  No history yet. Your daily prompt will appear here.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {historyToShow.map((h) => (
                    <button
                      key={h.dateISO}
                      onClick={() => setDateISO(h.dateISO)}
                      style={historyRow(h.dateISO === dateISO)}
                      title="Click to view that day"
                    >
                      <div style={{ fontWeight: 1000 }}>{h.dateISO}</div>
                      <div style={{ opacity: 0.75, fontSize: 12, lineHeight: 1.35 }}>
                        {h.prompt}
                      </div>
                    </button>
                  ))}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Click a date to load that day’s prompt + your note.
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div style={footer()}>
          <div style={{ opacity: 0.8 }}>
            🌱 Notes + prompt history save on your device (localStorage). Nothing is uploaded.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pageFlipSoft {
          0% { transform: perspective(900px) rotateY(0deg); opacity: 1; }
          35% { transform: perspective(900px) rotateY(-18deg); opacity: 0.70; }
          70% { transform: perspective(900px) rotateY(12deg); opacity: 0.92; }
          100% { transform: perspective(900px) rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** --- notebook styles --- **/
function page(): React.CSSProperties {
  return {
    minHeight: "100vh",
    padding: 18,
    background:
      "radial-gradient(1000px 600px at 20% 0%, rgba(21,71,52,0.14), transparent 55%), radial-gradient(900px 600px at 90% 10%, rgba(30,120,180,0.10), transparent 55%), linear-gradient(180deg, rgba(245,247,246,1), rgba(235,240,238,1))"
  };
}

function paper(): React.CSSProperties {
  return {
    maxWidth: 1040,
    margin: "0 auto",
    padding: 18,
    borderRadius: 22,
    border: "1px solid rgba(0,0,0,0.10)",
    background:
      "linear-gradient(transparent 23px, rgba(30,120,180,0.10) 24px), linear-gradient(90deg, rgba(180,60,60,0.12) 0 2px, transparent 2px), rgba(255,255,255,0.92)",
    backgroundSize: "100% 26px, 100% 100%",
    boxShadow: "0 18px 50px rgba(0,0,0,0.10)"
  };
}

function headerRow(): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap"
  };
}

function tab(): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)"
  };
}

function grid(): React.CSSProperties {
  return {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14
  };
}

function section(): React.CSSProperties {
  return {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.90)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  };
}

function sectionTitle(): React.CSSProperties {
  return { fontWeight: 1000, marginBottom: 10, letterSpacing: 0.2 };
}

function videoFrame(): React.CSSProperties {
  return {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(0,0,0,0.04)"
  };
}

function pdfFrame(): React.CSSProperties {
  return {
    width: "100%",
    height: 520,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.60)"
  };
}

function sticky(): React.CSSProperties {
  return {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "linear-gradient(180deg, rgba(255,245,180,0.95), rgba(255,245,180,0.80))",
    boxShadow: "0 12px 28px rgba(0,0,0,0.08)"
  };
}

function flipCard(): React.CSSProperties {
  return {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.55)",
    animation: "pageFlipSoft 520ms ease-in-out"
  };
}

function toolCard(): React.CSSProperties {
  return {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.92)",
    textDecoration: "none",
    color: "#111"
  };
}

function arrow(): React.CSSProperties {
  return { marginLeft: "auto", fontWeight: 1000, opacity: 0.6 };
}

function smallNote(): React.CSSProperties {
  return { marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.4 };
}

function footer(): React.CSSProperties {
  return {
    marginTop: 14,
    paddingTop: 10,
    borderTop: "1px dashed rgba(0,0,0,0.15)",
    fontSize: 12
  };
}

function miniBtn(): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12
  };
}

function primaryBtn(): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(21,71,52,0.22)",
    background: "rgba(21,71,52,0.14)",
    cursor: "pointer",
    fontWeight: 1000
  };
}

function noteBox(): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.92)",
    outline: "none",
    resize: "vertical",
    fontFamily: "system-ui",
    lineHeight: 1.5
  };
}

function dateInput(): React.CSSProperties {
  return {
    marginLeft: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.92)",
    fontSize: 12
  };
}

function historyRow(active: boolean): React.CSSProperties {
  return {
    textAlign: "left",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.10)",
    background: active ? "rgba(21,71,52,0.10)" : "rgba(255,255,255,0.92)",
    cursor: "pointer"
  };
}
