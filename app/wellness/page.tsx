"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

/* ---------- PROMPTS ---------- */
const PROMPTS = [
  "Find one small detail in nature you’d normally miss. Describe it in 2 sentences.",
  "What did you notice about the sky today (color, movement, feeling)?",
  "Write a 3-line “weather report” for your mood.",
  "Name one place on campus that feels calm. What makes it feel that way?",
  "List 5 sounds you hear right now. Which one feels most comforting?",
  "If nature could text you today, what would it say?",
  "Describe a tree like it’s a character in a story.",
  "Write one sentence starting with: “Even though things feel heavy…”",
];

/* ---------- CONSTANTS ---------- */
const YT_RESET = "https://www.youtube-nocookie.com/embed/cCcZSeBJhUA";
const YT_TED = "https://www.youtube-nocookie.com/embed/pBq31tsG2X4";
const PDF_URL =
  "https://eopcn.ca/wp-content/uploads/2026/01/Managing-Eco_Anxiety-2026.pdf";
const FOLIO_URL =
  "https://www.ualberta.ca/en/folio/2024/07/the-hidden-toll-of-climate-change.html";
const YOGA_URL =
  "https://www.ualberta.ca/en/campus-community-recreation/special-events/unwind-your-mind.html";
const REPAIR_URL =
  "https://sites.google.com/ualberta.ca/hecolrepaircafe/resources?authuser=0";

/* ---------- PAGE ---------- */
export default function WellnessPage() {
  // Pick prompt once per page load (stable for the session)
  const prompt = useMemo(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
    []
  );

  const [note, setNote] = useState("");

  return (
    <div style={page()}>
      <div style={paper()}>
        <h1 style={title()}>🌿 Climate Wellness Notebook</h1>
        <p style={subtitle()}>
          A calm space for climate emotions — reflection, grounding, and gentle
          action.
        </p>

        {/* VIDEOS */}
        <section style={section()}>
          <h2 style={sectionTitle()}>📺 Gentle reset</h2>
          <iframe
            style={{ ...video(), pointerEvents: "auto", opacity: 1 }}
            src={`${YT_RESET}?rel=0&playsinline=1`}
            title="Gentle reset video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </section>

        <section style={section()}>
          <h2 style={sectionTitle()}>🌤️ Eco-anxiety → optimism</h2>
          <iframe
            style={{ ...video(), pointerEvents: "auto", opacity: 1 }}
            src={`${YT_TED}?rel=0&playsinline=1`}
            title="Eco-anxiety to optimism TED talk"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </section>

        {/* PROMPT */}
        <section style={sticky()}>
          <h2 style={sectionTitle()}>✨ Reflection prompt</h2>
          <p style={{ lineHeight: 1.6, margin: 0 }}>{prompt}</p>
        </section>

        {/* NOTE */}
        <section style={section()}>
          <h2 style={sectionTitle()}>📝 Write here</h2>
          <textarea
            style={textarea()}
            placeholder="A few lines is enough…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            Tip: this note isn’t saved yet. If you want, I can add “Save locally”
            like your other pages.
          </div>
        </section>

        {/* LINKS */}
        <section style={section()}>
          <h2 style={sectionTitle()}>Your Resources</h2>

          <Resource
            href="/wellness/anxiety-checkin"
            emoji="🧠"
            text="Eco-anxiety check-in"
            internal
          />
          <Resource
            href="/wellness/gratitude"
            emoji="🙏"
            text="Gratitude journalling"
            internal
          />
          <Resource href={YOGA_URL} emoji="🧘" text="Yoga on Campus" />
          <Resource href={FOLIO_URL} emoji="🎓" text="UAlberta Folio article" />
          <Resource href={REPAIR_URL} emoji="🧵" text="H-ECOL Repair Café" />
        </section>

        {/* PDF */}
        <section style={section()}>
          <h2 style={sectionTitle()}>📄 Managing Eco-Anxiety</h2>

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            If the PDF doesn’t load inline on your browser, use the button below.
          </div>

          <iframe
            src={PDF_URL}
            title="Managing Eco-Anxiety PDF"
            style={pdf()}
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          <div style={{ marginTop: 10 }}>
            <a
              href={PDF_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid #ddd",
                background: "#fff",
                color: "#111",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open PDF in new tab ↗
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */
function Resource({
  href,
  emoji,
  text,
  internal,
}: {
  href: string;
  emoji: string;
  text: string;
  internal?: boolean;
}) {
  const commonStyle: React.CSSProperties = resource();

  if (internal) {
    return (
      <Link href={href} style={commonStyle}>
        <span>{emoji}</span>
        <span>{text}</span>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>→</span>
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" style={commonStyle}>
      <span>{emoji}</span>
      <span>{text}</span>
      <span style={{ marginLeft: "auto", opacity: 0.6 }}>↗</span>
    </a>
  );
}

/* ---------- STYLES ---------- */
const page = (): React.CSSProperties => ({
  minHeight: "100vh",
  padding: 20,
  background: "linear-gradient(180deg, #f5f7f6 0%, #e8eeeb 100%)",
});

const paper = (): React.CSSProperties => ({
  maxWidth: 960,
  margin: "0 auto",
  padding: 24,
  borderRadius: 24,
  background: "linear-gradient(#fff 23px, #e6eef0 24px)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
});

const title = (): React.CSSProperties => ({
  fontSize: 30,
  fontWeight: 700,
  margin: 0,
});

const subtitle = (): React.CSSProperties => ({
  opacity: 0.75,
  marginTop: 8,
  marginBottom: 20,
});

const section = (): React.CSSProperties => ({
  marginTop: 20,
});

const sticky = (): React.CSSProperties => ({
  marginTop: 20,
  padding: 16,
  background: "#fff7cc",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.08)",
});

const sectionTitle = (): React.CSSProperties => ({
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 10,
});

const video = (): React.CSSProperties => ({
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 16,
  border: "none",
  background: "rgba(0,0,0,0.04)",
});

const textarea = (): React.CSSProperties => ({
  width: "100%",
  minHeight: 120,
  borderRadius: 14,
  padding: 12,
  border: "1px solid #ddd",
  background: "#fff",
});

const resource = (): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
  marginTop: 10,
  borderRadius: 14,
  background: "#fff",
  textDecoration: "none",
  color: "#111",
  border: "1px solid #eee",
  fontWeight: 600,
});

const pdf = (): React.CSSProperties => ({
  width: "100%",
  height: 500,
  borderRadius: 16,
  border: "1px solid #ddd",
  background: "#fff",
});
