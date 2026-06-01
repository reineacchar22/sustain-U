"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Province = "AB" | "SK" | "BC";
type TransportMode = "walk" | "bike" | "bus" | "lrt" | "rideshare" | "car" | "ev";
type MealType = "meat_heavy" | "mixed" | "vegetarian" | "vegan";
type Step = "home" | "transport" | "food" | "extras" | "result";

type Trip = { label: string; km: number; mode: TransportMode; carOccupancy?: number };
type Meal = { label: string; type: MealType };

type Entry = {
  id: string; dateISO: string;
  trips: Trip[]; meals: Meal[];
  includeElectricity: boolean; province: Province;
  householdSize: number; electricityLevel: "low" | "average" | "high";
  refills: number; natureMinutes: number; notes?: string;
};

type Profile = {
  id: string; name: string; createdAt: number;
  baselineMode: TransportMode; baselineCarOccupancy: number;
  baselineMeal: MealType; dailyCO2GoalKg: number;
  entries: Entry[]; points: number; badges: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "uofa_co2_profiles_v1";
const ACTIVE_PROFILE_KEY = "uofa_co2_active_profile_v1";
const CA_DAILY_KG = 14.2; // StatsCan: avg Canadian kg CO₂e per person per day

const EF = {
  transport: { walk: 0, bike: 0, bus: 0.08, lrt: 0.03, rideshare: 0.2, car: 0.2, ev: 0.04 } as Record<TransportMode, number>,
  food: { meat_heavy: 3.3, mixed: 2.0, vegetarian: 1.2, vegan: 0.9 } as Record<MealType, number>,
  grid: { AB: 0.47, SK: 0.63, BC: 0.014 } as Record<Province, number>,
  kwhMonth: { AB: 600, SK: 625, BC: 675 } as Record<Province, number>,
};

const ELEC_MULT = { low: 0.75, average: 1.0, high: 1.25 };

type TransportOption = {
  mode: TransportMode; label: string; sublabel: string; icon: string;
  kg: (km: number, occ?: number) => number;
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  { mode: "walk",      label: "Walk",      sublabel: "Zero emissions",     icon: "🚶", kg: () => 0 },
  { mode: "bike",      label: "Bike",      sublabel: "Zero emissions",     icon: "🚲", kg: () => 0 },
  { mode: "lrt",       label: "LRT",       sublabel: "0.03 kg/km",         icon: "🚈", kg: (km) => 0.03 * km },
  { mode: "bus",       label: "Bus",       sublabel: "0.08 kg/km",         icon: "🚌", kg: (km) => 0.08 * km },
  { mode: "ev",        label: "EV",        sublabel: "0.04 kg/km",         icon: "⚡", kg: (km) => 0.04 * km },
  { mode: "rideshare", label: "Rideshare", sublabel: "split by occupancy", icon: "🚕", kg: (km, occ = 1) => (0.2 * km) / occ },
  { mode: "car",       label: "Car",       sublabel: "0.2 kg/km solo",     icon: "🚗", kg: (km, occ = 1) => (0.2 * km) / occ },
];

type MealOption = { type: MealType; label: string; description: string; icon: string; kg: number };

const MEAL_OPTIONS: MealOption[] = [
  { type: "vegan",      label: "Vegan",      description: "Fully plant-based",          icon: "🌱", kg: 0.9 },
  { type: "vegetarian", label: "Vegetarian", description: "No meat, may include dairy", icon: "🥗", kg: 1.2 },
  { type: "mixed",      label: "Mixed",      description: "Balanced with some meat",    icon: "🍛", kg: 2.0 },
  { type: "meat_heavy", label: "Meat-heavy", description: "Red meat as main",           icon: "🥩", kg: 3.3 },
];

const CAMPUS_ROUTES = [
  { label: "Home → Campus",         km: 6,   icon: "🏠" },
  { label: "Campus → Stadium",      km: 1.5, icon: "🏟️" },
  { label: "Campus → Downtown",     km: 4,   icon: "🏙️" },
  { label: "Campus → South Campus", km: 2,   icon: "🔬" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const uid = (p="id") => `${p}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const safeNum = (n: unknown, fb=0) => { const x=Number(n); return Number.isFinite(x)?x:fb; };

const loadProfiles  = (): Profile[] => { try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[]; } catch { return []; } };
const saveProfiles  = (p: Profile[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
const loadActiveId  = () => localStorage.getItem(ACTIVE_PROFILE_KEY);
const saveActiveId  = (id: string) => localStorage.setItem(ACTIVE_PROFILE_KEY, id);

const calcTransportKg = (trips: Trip[]) =>
  trips.reduce((s,t) => {
    const base = EF.transport[t.mode] * t.km;
    const occ = (t.mode==="car"||t.mode==="rideshare") ? clamp(safeNum(t.carOccupancy,1),1,6) : 1;
    return s + base / occ;
  }, 0);

const calcFoodKg  = (meals: Meal[]) => meals.reduce((s,m) => s+(EF.food[m.type]??0), 0);

const calcElecKg  = (e: Entry) => {
  if (!e.includeElectricity) return 0;
  const kwh = (EF.kwhMonth[e.province] * ELEC_MULT[e.electricityLevel]) / 30.4 / clamp(safeNum(e.householdSize,1),1,12);
  return kwh * EF.grid[e.province];
};

const calcTotalKg  = (e: Entry) => calcTransportKg(e.trips) + calcFoodKg(e.meals) + calcElecKg(e);

const calcBaselineKg = (p: Profile, e: Entry) => {
  const totalKm = e.trips.reduce((s,t)=>s+safeNum(t.km),0);
  let tb = EF.transport[p.baselineMode] * totalKm;
  if (p.baselineMode==="car"||p.baselineMode==="rideshare") tb/=clamp(p.baselineCarOccupancy,1,6);
  return tb + (EF.food[p.baselineMeal]??0)*e.meals.length + calcElecKg(e);
};

const computeStreak = (p: Profile) => {
  const set = new Set(p.entries.map(e=>e.dateISO));
  const now = new Date(); let streak=0;
  for (let i=0;i<365;i++) {
    const d=new Date(now); d.setDate(now.getDate()-i);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (set.has(iso)) streak++; else break;
  }
  return streak;
};

const computeBadges = (p: Profile) => {
  const entries = [...p.entries].sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
  const badges = new Set<string>(p.badges);
  if (entries.length>=1) badges.add("First log");
  if (entries.length>=7) badges.add("7-day logger");
  if (entries.some(e=>e.trips.some(t=>t.mode==="bike"))) badges.add("Bike commuter");
  let vs=0;
  for (const e of entries) {
    const v=e.meals.some(m=>m.type==="vegetarian"||m.type==="vegan");
    vs=v?vs+1:0;
    if(vs>=3){badges.add("Plant streak 3+");break;}
  }
  if (entries.filter(e=>calcTotalKg(e)<=p.dailyCO2GoalKg).length>=5) badges.add("Goal beater ×5");
  return Array.from(badges);
};

const missionsForEntry = (trips: Trip[], meals: Meal[], refills: number, natureMinutes: number) => {
  const tKg = calcTransportKg(trips);
  const hadCar = trips.some(t=>t.mode==="car"||t.mode==="rideshare");
  const hadBikeWalk = trips.some(t=>t.mode==="bike"||t.mode==="walk");
  const vegMeals = meals.filter(m=>m.type==="vegetarian"||m.type==="vegan").length;
  return [
    { id:"walkbike",      label:"Go car-free",       icon:"🚲", done:hadBikeWalk,                points:50 },
    { id:"no_car",        label:"No car today",       icon:"🚫", done:!hadCar&&trips.length>0,    points:40 },
    { id:"veg",           label:"Eat plant-based",    icon:"🥗", done:vegMeals>=1,               points:30 },
    { id:"refill",        label:"Refill bottle 2×",   icon:"💧", done:refills>=2,                points:15 },
    { id:"nature",        label:"10 min outdoors",    icon:"🌿", done:natureMinutes>=10,          points:15 },
    { id:"low_transport", label:"Transport < 1 kg",   icon:"📉", done:tKg<1.0&&trips.length>0,   points:20 },
  ];
};

const getTips = (trips: Trip[], meals: Meal[], transportKg: number, totalKg: number, goalKg: number) => {
  const tips: { icon: string; text: string }[] = [];
  const hadCar      = trips.some(t=>t.mode==="car");
  const hadMeat     = meals.some(m=>m.type==="meat_heavy");
  const hadPlant    = meals.some(m=>m.type==="vegan"||m.type==="vegetarian");
  const hadBikeWalk = trips.some(t=>t.mode==="bike"||t.mode==="walk");

  if (totalKg <= goalKg)
    tips.push({ icon:"🌟", text:`Under goal by ${(goalKg-totalKg).toFixed(1)} kg — excellent day!` });
  else
    tips.push({ icon:"💡", text:`${(totalKg-goalKg).toFixed(1)} kg over goal. Small swaps tomorrow can close the gap.` });

  if (hadCar && transportKg > 1)
    tips.push({ icon:"🚌", text:`Switching car trips to LRT could cut ~${(transportKg*0.85).toFixed(1)} kg from transport tomorrow.` });

  if (hadMeat)
    tips.push({ icon:"🥗", text:"One less meat-heavy meal saves ~2.1 kg CO₂ — roughly 40 km of driving." });

  if (hadBikeWalk)
    tips.push({ icon:"🚲", text:"Going car-free on some trips today was a great call. Every emission-free km counts!" });

  if (hadPlant && !hadMeat)
    tips.push({ icon:"🌱", text:"Plant-based eating is one of the highest-impact climate choices. Keep it up!" });

  const pctBelowAvg = ((1 - totalKg / CA_DAILY_KG) * 100);
  if (pctBelowAvg > 0)
    tips.push({ icon:"🇨🇦", text:`Your footprint is ${pctBelowAvg.toFixed(0)}% below the Canadian daily average of ${CA_DAILY_KG} kg.` });

  return tips.slice(0, 3);
};

// ─── SVG Chart Components ─────────────────────────────────────────────────────
function WeekBarChart({ series, goalKg }: { series: { iso: string; kg: number; day: string }[]; goalKg: number }) {
  const W=300, H=112, BOT=18, TOP=18;
  const chartH = H - BOT - TOP;
  const max = Math.max(...series.map(s=>s.kg), goalKg*1.1, 0.1);
  const n = series.length;
  const BAR = 28;
  const SPACE = (W - BAR*n) / (n+1);
  const goalY = TOP + chartH * (1 - goalKg/max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}>
      <line x1={0} y1={goalY} x2={W} y2={goalY} stroke="#1a5c42" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />
      <text x={W-2} y={goalY-3} fontSize={7} fill="#1a5c42" textAnchor="end" fontFamily="monospace" fontWeight="600">goal</text>
      {series.map((s,i) => {
        const x = SPACE + i*(BAR+SPACE);
        const frac = s.kg/max;
        const barH = Math.max(frac*chartH, 2);
        const y = TOP + chartH - barH;
        const over = s.kg > goalKg;
        const empty = s.kg === 0;
        return (
          <g key={s.iso}>
            <rect x={x} y={empty ? TOP+chartH-3 : y} width={BAR} height={empty ? 3 : barH} rx={5} fill={empty?"#dde8dd":over?"#e8b84e":"#2a9d6e"} />
            {s.kg > 0 && (
              <text x={x+BAR/2} y={y-4} fontSize={7.5} fill={over?"#8a5000":"#1a5c42"} textAnchor="middle" fontFamily="monospace" fontWeight="700">
                {s.kg.toFixed(1)}
              </text>
            )}
            <text x={x+BAR/2} y={H-3} fontSize={8} fill="#aaa" textAnchor="middle" fontWeight="600">{s.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ transport, food, elec, total }: { transport: number; food: number; elec: number; total: number }) {
  if (total <= 0) return null;
  const R=48, cx=64, cy=64, SW=14;
  const circ = 2*Math.PI*R;
  const segs = [
    { kg:transport, color:"#2563eb" },
    { kg:food,      color:"#16a34a" },
    { kg:elec,      color:"#d97706" },
  ];
  let off = 0;
  return (
    <svg viewBox="0 0 128 128" style={{width:"100%",maxWidth:128,display:"block"}}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#eef2ee" strokeWidth={SW} />
      {segs.map((s,i) => {
        const frac = s.kg/total;
        const dash = frac*circ;
        const rotate = off*360 - 90;
        off += frac;
        return (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color}
            strokeWidth={SW} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0}
            transform={`rotate(${rotate} ${cx} ${cy})`} />
        );
      })}
      <text x={cx} y={cy-5} textAnchor="middle" fontSize={17} fontWeight="700" fill="#111" fontFamily="monospace">{total.toFixed(1)}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={8.5} fill="#888" fontWeight="600">kg CO₂e</text>
    </svg>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --green: #1a5c42;
  --green-light: #2a9d6e;
  --green-pale: #e8f6ef;
  --green-mid: #a8dbbf;
  --gold: #b87900;
  --gold-pale: #fdf3dc;
  --red: #c0392b;
  --red-pale: #fdecea;
  --blue: #2563eb;
  --bg: #f3f5f3;
  --surface: #ffffff;
  --surface2: #f7faf7;
  --border: rgba(0,0,0,0.07);
  --border-strong: rgba(0,0,0,0.14);
  --text: #111;
  --text2: #555;
  --text3: #999;
  --radius: 16px;
  --radius-sm: 11px;
  --shadow: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.09);
  font-family: 'Geist', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body { background: var(--bg); color: var(--text); }

.shell {
  min-height: 100vh;
  display: flex; flex-direction: column;
  max-width: 480px; margin: 0 auto;
  padding: 0 0 84px;
}

.app-header {
  position: sticky; top: 0; z-index: 20;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  padding: 11px 20px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-brand { display: flex; align-items: center; gap: 10px; }
.header-logo {
  width: 34px; height: 34px; border-radius: 11px;
  background: linear-gradient(135deg, #154734 0%, #2a9d6e 100%);
  display: flex; align-items: center; justify-content: center; font-size: 17px;
  box-shadow: 0 2px 8px rgba(26,92,66,0.25);
}
.header-title { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; }
.header-sub { font-size: 11px; color: var(--text3); font-weight: 500; }
.header-right { display: flex; align-items: center; gap: 8px; }

.step-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; z-index: 20;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--border);
  display: flex; padding-bottom: env(safe-area-inset-bottom, 0px);
}
.step-tab {
  flex: 1; padding: 10px 4px 13px;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: none; border: none; cursor: pointer; position: relative; transition: all 0.18s;
}
.step-tab .step-icon { font-size: 19px; transition: all 0.18s; filter: grayscale(1) opacity(0.45); }
.step-tab .step-label { font-size: 10px; color: var(--text3); font-weight: 600; letter-spacing: 0.2px; }
.step-tab.active .step-icon { filter: none; }
.step-tab.active .step-label { color: var(--green); font-weight: 700; }
.step-tab.active::after {
  content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 20px; height: 3px; background: var(--green); border-radius: 999px 999px 0 0;
}
.step-tab .step-badge {
  position: absolute; top: 5px; right: calc(50% - 22px);
  min-width: 16px; height: 16px; border-radius: 999px;
  background: var(--green); color: white; font-size: 9px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}

.page { padding: 16px 20px; animation: fadeUp 0.2s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.section-heading { font-size: 22px; font-weight: 800; letter-spacing: -0.6px; margin-bottom: 4px; }
.section-sub { font-size: 14px; color: var(--text2); margin-bottom: 20px; line-height: 1.55; }
.section-title { font-size: 11px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }

.card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px; margin-bottom: 14px; }

.option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.option-card {
  border: 2px solid var(--border); border-radius: var(--radius);
  padding: 14px 12px; background: var(--surface);
  cursor: pointer; transition: all 0.15s; position: relative; text-align: left;
}
.option-card:hover { border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow); }
.option-card.selected { border-color: var(--green-mid); background: var(--green-pale); }
.option-card.meal-vegan.selected      { background: #e8f5ee; border-color: #86c9a2; }
.option-card.meal-vegetarian.selected { background: #eaf6f0; border-color: #96cdb0; }
.option-card.meal-mixed.selected      { background: #fdf3e0; border-color: #e8c878; }
.option-card.meal-meat_heavy.selected { background: #fdecea; border-color: #f0a0a0; }
.option-icon { font-size: 28px; margin-bottom: 8px; display: block; }
.opt-label { font-size: 15px; font-weight: 700; color: var(--text); }
.opt-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }
.opt-kg { font-size: 11px; font-weight: 700; margin-top: 6px; font-family: 'Geist Mono', monospace; }
.check-dot {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; border-radius: 999px;
  background: var(--green); color: white; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.option-card.selected .check-dot { opacity: 1; }

.dist-input-wrap {
  margin-top: 14px; padding: 16px; background: var(--surface);
  border-radius: var(--radius); border: 1.5px solid var(--border);
  display: grid; gap: 12px; animation: fadeUp 0.18s ease;
}
.dist-label { font-size: 11px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }
.dist-row { display: flex; gap: 8px; align-items: baseline; }
.dist-input {
  font-family: 'Geist Mono', monospace; font-size: 28px; font-weight: 700;
  border: none; outline: none; background: transparent; color: var(--text); width: 90px;
}
.dist-unit { font-size: 16px; color: var(--text3); font-weight: 600; }
.route-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.route-chip {
  padding: 6px 12px; border-radius: 999px;
  background: var(--surface2); border: 1.5px solid var(--border);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; color: var(--text2);
}
.route-chip:hover { border-color: var(--green-mid); color: var(--green); background: var(--green-pale); }
.occ-row { display: flex; gap: 6px; }
.occ-btn {
  flex: 1; padding: 8px; border-radius: var(--radius-sm);
  border: 1.5px solid var(--border); background: var(--surface2);
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; color: var(--text2);
}
.occ-btn.active { border-color: var(--green-mid); background: var(--green-pale); color: var(--green); }

.add-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 13px; background: var(--green); color: white;
  font-size: 14px; font-weight: 700; border-radius: var(--radius);
  border: none; cursor: pointer; transition: all 0.15s; letter-spacing: 0.1px;
  font-family: 'Geist', sans-serif;
}
.add-btn:hover { background: var(--green-light); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,92,66,0.2); }
.add-btn:active { transform: translateY(0); }
.add-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; box-shadow: none; }

.logged-list { display: grid; gap: 8px; margin-top: 16px; }
.logged-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: var(--radius-sm);
  background: var(--surface); border: 1px solid var(--border);
  animation: fadeUp 0.18s ease;
}
.logged-icon { font-size: 22px; flex-shrink: 0; }
.logged-name { font-size: 14px; font-weight: 700; }
.logged-sub { font-size: 12px; color: var(--text3); margin-top: 1px; }
.logged-kg { font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text2); white-space: nowrap; }
.remove-btn {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: none; border: 1px solid var(--border); cursor: pointer;
  font-size: 13px; color: var(--text3); transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.remove-btn:hover { background: var(--red-pale); border-color: #f0a0a0; color: var(--red); }

.running-total {
  position: sticky; bottom: 72px; margin: 0 -20px;
  padding: 10px 20px; background: rgba(255,255,255,0.96);
  backdrop-filter: blur(10px); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 10;
}
.rt-label { font-size: 11px; color: var(--text3); font-weight: 600; }
.rt-value { font-family: 'Geist Mono', monospace; font-size: 18px; font-weight: 700; }
.rt-bar-wrap { flex: 1; height: 5px; background: #e0e8e4; border-radius: 999px; overflow: hidden; }
.rt-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
.rt-bar-fill.ok { background: var(--green-light); }
.rt-bar-fill.over { background: #f0a000; }

.habit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.habit-card {
  padding: 14px; border-radius: var(--radius); background: var(--surface);
  border: 2px solid var(--border); cursor: pointer; transition: all 0.15s; text-align: left;
}
.habit-card.active { border-color: var(--green-mid); background: var(--green-pale); }
.habit-icon-big { font-size: 26px; margin-bottom: 6px; }
.habit-label { font-size: 14px; font-weight: 700; }
.habit-sub { font-size: 11px; color: var(--text3); margin-top: 2px; line-height: 1.4; }
.habit-pts { font-size: 11px; font-weight: 800; color: var(--green); margin-top: 8px; }

.province-row { display: flex; gap: 8px; }
.province-btn {
  flex: 1; padding: 10px 8px; border-radius: var(--radius-sm);
  border: 1.5px solid var(--border); background: var(--surface2);
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; color: var(--text2);
}
.province-btn.active { border-color: var(--green-mid); background: var(--green-pale); color: var(--green); }

.number-input-wrap { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.num-btn { width: 36px; height: 36px; background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text2); transition: background 0.15s; }
.num-btn:hover { background: var(--surface2); }
.num-val { padding: 0 10px; font-size: 14px; font-weight: 700; min-width: 36px; text-align: center; border-left: 1px solid var(--border); border-right: 1px solid var(--border); font-family: 'Geist Mono'; }

/* ── Result ── */
.result-hero {
  border-radius: 20px; padding: 22px 20px 20px; margin-bottom: 14px;
  background: var(--surface); border: 1px solid var(--border);
}
.result-hero-top { display: flex; align-items: center; gap: 16px; }
.result-total { font-size: 52px; font-weight: 800; letter-spacing: -2px; font-family: 'Geist Mono'; line-height: 1; }
.result-unit { font-size: 14px; color: var(--text2); font-weight: 600; margin-top: 3px; }
.result-status { font-size: 14px; font-weight: 700; margin-top: 6px; }
.result-status.ok { color: var(--green); }
.result-status.over { color: var(--gold); }

.compare-card {
  background: var(--surface); border-radius: var(--radius);
  border: 1px solid var(--border); padding: 14px 16px; margin-bottom: 14px;
}
.compare-title { font-size: 11px; font-weight: 800; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; }
.compare-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.compare-row:last-child { margin-bottom: 0; }
.compare-name { font-size: 12px; font-weight: 600; color: var(--text2); width: 60px; flex-shrink: 0; }
.compare-bar-track { flex: 1; height: 8px; background: #eef2ee; border-radius: 999px; overflow: hidden; }
.compare-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.compare-val { font-family: 'Geist Mono', monospace; font-size: 11px; font-weight: 700; width: 40px; text-align: right; flex-shrink: 0; }

.breakdown { display: grid; gap: 10px; margin-bottom: 14px; }
.breakdown-row { display: flex; align-items: center; gap: 10px; }
.breakdown-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.breakdown-label { font-size: 13px; font-weight: 600; width: 82px; flex-shrink: 0; }
.breakdown-bar-wrap { flex: 1; height: 7px; background: #eef2ee; border-radius: 999px; overflow: hidden; }
.breakdown-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.breakdown-val { font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text2); width: 52px; text-align: right; }

.equiv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.equiv-card { padding: 14px 12px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); text-align: center; }
.equiv-icon { font-size: 22px; margin-bottom: 5px; }
.equiv-val { font-size: 18px; font-weight: 800; font-family: 'Geist Mono'; color: var(--text); letter-spacing: -0.5px; }
.equiv-label { font-size: 11px; color: var(--text3); margin-top: 3px; font-weight: 500; }

.tips-list { display: grid; gap: 8px; margin-bottom: 14px; }
.tip-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; border-radius: var(--radius-sm);
  background: var(--surface); border: 1px solid var(--border);
}
.tip-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.tip-text { font-size: 13px; color: var(--text2); line-height: 1.5; font-weight: 500; }

.missions-list { display: grid; gap: 8px; margin-bottom: 14px; }
.mission-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: var(--surface); transition: all 0.2s;
}
.mission-row.done { border-color: var(--green-mid); background: var(--green-pale); }
.mission-check { width: 24px; height: 24px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
.mission-check.done { background: var(--green); color: white; }
.mission-check.todo { background: var(--surface2); border: 1.5px solid var(--border); }
.mission-text { flex: 1; font-size: 13px; font-weight: 600; }
.mission-text.done { color: var(--green); }
.mission-text.todo { color: var(--text2); }
.mission-pts { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
.mission-pts.done { background: var(--green-pale); color: var(--green); }
.mission-pts.todo { background: var(--surface2); color: var(--text3); }

.home-greeting { font-size: 26px; font-weight: 800; letter-spacing: -0.6px; margin-bottom: 3px; }
.home-date { font-size: 13px; color: var(--text3); font-weight: 500; margin-bottom: 20px; }
.home-start-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 18px 20px; background: var(--green); color: white;
  border-radius: 18px; border: none; cursor: pointer; transition: all 0.18s; margin-bottom: 12px;
  font-family: 'Geist', sans-serif;
}
.home-start-btn:hover { background: var(--green-light); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,92,66,0.25); }
.home-start-label { font-size: 18px; font-weight: 800; text-align: left; }
.home-start-sub { font-size: 13px; opacity: 0.8; margin-top: 2px; text-align: left; }
.home-start-arrow { font-size: 22px; opacity: 0.7; }

.stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.stat-card { padding: 14px 10px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); text-align: center; }
.stat-val { font-size: 22px; font-weight: 800; font-family: 'Geist Mono'; letter-spacing: -0.5px; }
.stat-label { font-size: 10px; color: var(--text3); margin-top: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }

.badge-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
.badge-pill { padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--green-pale); color: var(--green); border: 1px solid var(--green-mid); }

.onboard-card {
  padding: 32px 24px; border-radius: 20px; background: var(--surface);
  border: 1px solid var(--border); text-align: center; margin-top: 40px;
  box-shadow: var(--shadow-md);
}
.onboard-icon { font-size: 52px; margin-bottom: 14px; }

input[type="text"], input[type="number"], textarea {
  font-family: 'Geist', sans-serif; font-size: 15px; width: 100%;
  padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text); outline: none; transition: border-color 0.15s;
}
input:focus, textarea:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(42,157,110,0.1); }

.ghost-btn {
  padding: 10px 16px; border-radius: var(--radius-sm);
  border: 1.5px solid var(--border); background: var(--surface);
  font-size: 13px; font-weight: 700; cursor: pointer; color: var(--text2);
  transition: all 0.15s; font-family: 'Geist', sans-serif;
}
.ghost-btn:hover { border-color: var(--border-strong); color: var(--text); background: var(--surface2); }

.save-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 16px; background: var(--green); color: white; font-size: 16px; font-weight: 800;
  border-radius: 18px; border: none; cursor: pointer; transition: all 0.18s;
  font-family: 'Geist', sans-serif; letter-spacing: -0.2px;
}
.save-btn:hover { background: var(--green-light); box-shadow: 0 8px 24px rgba(26,92,66,0.25); }

.toast {
  position: fixed; bottom: 94px; left: 50%; transform: translateX(-50%);
  z-index: 100; background: #111; color: white;
  padding: 11px 20px; border-radius: 999px; font-size: 13px; font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 8px;
  animation: toastIn 0.22s ease; white-space: nowrap;
}
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

.divider { height: 1px; background: var(--border); margin: 14px 0; }
.pill-green { background: var(--green-pale); color: var(--green); border: 1px solid var(--green-mid); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.pill-gray  { background: var(--surface2); color: var(--text3); border: 1px solid var(--border); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.pill-gold  { background: var(--gold-pale); color: var(--gold); border: 1px solid rgba(200,150,42,0.3); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }

.profile-btn {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px 5px 5px;
  border-radius: 999px; background: var(--surface2); border: 1px solid var(--border);
  cursor: pointer; font-size: 13px; font-weight: 700; color: var(--text2);
  transition: all 0.15s; font-family: 'Geist', sans-serif;
}
.profile-btn:hover { border-color: var(--border-strong); color: var(--text); }
.profile-avatar {
  width: 24px; height: 24px; border-radius: 999px;
  background: linear-gradient(135deg, #154734, #2a9d6e);
  color: white; font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function CO2App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("home");

  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);
  const [tripKm, setTripKm] = useState<number>(6);
  const [tripOcc, setTripOcc] = useState<number>(1);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [refills, setRefills] = useState(0);
  const [natureMinutes, setNatureMinutes] = useState(0);
  const [includeElec, setIncludeElec] = useState(true);
  const [province, setProvince] = useState<Province>("AB");
  const [householdSize, setHouseholdSize] = useState(2);
  const [elecLevel] = useState<"low"|"average"|"high">("average");

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const p = loadProfiles();
    setProfiles(p);
    const aid = loadActiveId();
    if (aid && p.some(x=>x.id===aid)) setActiveId(aid);
    else if (p[0]) { setActiveId(p[0].id); saveActiveId(p[0].id); }
  }, []);

  useEffect(() => { if (profiles.length) saveProfiles(profiles); }, [profiles]);

  const activeProfile = useMemo(() => profiles.find(p=>p.id===activeId)??null, [profiles, activeId]);
  const streak = activeProfile ? computeStreak(activeProfile) : 0;

  const todayEntry: Entry = useMemo(() => ({
    id: uid("e"), dateISO: todayISO(), trips, meals,
    includeElectricity: includeElec, province, householdSize,
    electricityLevel: elecLevel, refills, natureMinutes,
  }), [trips, meals, includeElec, province, householdSize, elecLevel, refills, natureMinutes]);

  const transportKg = calcTransportKg(trips);
  const foodKg      = calcFoodKg(meals);
  const elecKg      = calcElecKg(todayEntry);
  const totalKg     = transportKg + foodKg + elecKg;
  const goalKg      = activeProfile?.dailyCO2GoalKg ?? 6;
  const ok          = totalKg <= goalKg;
  const baselineKg  = activeProfile ? calcBaselineKg(activeProfile, todayEntry) : 0;
  const savedKg     = Math.max(0, baselineKg - totalKg);
  const missions    = missionsForEntry(trips, meals, refills, natureMinutes);
  const missionPts  = missions.filter(m=>m.done).reduce((s,m)=>s+m.points,0);
  const tips        = getTips(trips, meals, transportKg, totalKg, goalKg);

  const weekSeries = useMemo(() => {
    if (!activeProfile) return [];
    const now = new Date();
    const map = new Map(activeProfile.entries.map(e=>[e.dateISO, calcTotalKg(e)]));
    const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    return Array.from({length:7}, (_,i) => {
      const d = new Date(now); d.setDate(now.getDate()-(6-i));
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      return { iso, kg: map.get(iso)??0, day: days[d.getDay()] };
    });
  }, [activeProfile]);

  const monthlyAvg = useMemo(() => {
    if (!activeProfile || !activeProfile.entries.length) return null;
    const now = new Date();
    const cutoff = new Date(now); cutoff.setDate(now.getDate()-30);
    const cutISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,"0")}-${String(cutoff.getDate()).padStart(2,"0")}`;
    const recent = activeProfile.entries.filter(e=>e.dateISO>=cutISO);
    if (!recent.length) return null;
    return recent.reduce((s,e)=>s+calcTotalKg(e),0)/recent.length;
  }, [activeProfile]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(""), 2200); };

  const addTrip = () => {
    if (!selectedMode) return;
    const km = clamp(safeNum(tripKm), 0.1, 500);
    const routeLabel = CAMPUS_ROUTES.find(r=>r.km===km)?.label ?? `${km} km trip`;
    setTrips(prev=>[...prev, { label:routeLabel, km, mode:selectedMode, carOccupancy: selectedMode==="car"||selectedMode==="rideshare"?tripOcc:undefined }]);
    setSelectedMode(null);
    showToast("Trip added ✓");
  };

  const addMeal = (type: MealType) => {
    const opt = MEAL_OPTIONS.find(m=>m.type===type)!;
    setMeals(prev=>[...prev, { label:opt.label, type }]);
    showToast("Meal added ✓");
  };

  const saveEntry = () => {
    if (!activeProfile) return;
    const entry: Entry = { ...todayEntry, id: uid("e") };
    setProfiles(prev=>prev.map(p => {
      if (p.id!==activeProfile.id) return p;
      const idx = p.entries.findIndex(e=>e.dateISO===entry.dateISO);
      const nextEntries = [...p.entries];
      if (idx>=0) nextEntries[idx]=entry; else nextEntries.push(entry);
      const next: Profile = { ...p, entries:nextEntries, points:p.points+(idx<0?missionPts:0) };
      next.badges = computeBadges(next);
      return next;
    }));
    showToast("Day logged! 🌿");
    setStep("result");
  };

  const createProfile = () => {
    const name = newName.trim() || "Bear";
    const p: Profile = { id:uid("p"), name, createdAt:Date.now(), baselineMode:"car", baselineCarOccupancy:1, baselineMeal:"mixed", dailyCO2GoalKg:6.0, entries:[], points:0, badges:[] };
    const next = [p, ...profiles];
    setProfiles(next); setActiveId(p.id); saveActiveId(p.id);
    setNewName(""); setShowProfileModal(false);
  };

  return (
    <>
      <style>{CSS}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* Profile modal */}
      {showProfileModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"24px 24px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480,animation:"fadeUp 0.2s ease"}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:18,letterSpacing:"-0.3px"}}>{profiles.length===0?"Create your profile":"Profiles"}</div>
            {profiles.map(p=>(
              <div key={p.id} onClick={()=>{setActiveId(p.id);saveActiveId(p.id);setShowProfileModal(false);}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",borderBottom:"1px solid var(--border)",cursor:"pointer"}}>
                <div className="profile-avatar" style={{width:38,height:38,fontSize:15}}>{p.name[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                  <div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>{p.entries.length} logs · {p.points} pts</div>
                </div>
                {p.id===activeId && <span className="pill-green">Active</span>}
              </div>
            ))}
            <div style={{marginTop:18}}>
              <div style={{marginBottom:8,fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:0.5}}>New profile</div>
              <div style={{display:"flex",gap:8}}>
                <input type="text" value={newName} onChange={e=>setNewName(e.target.value)}
                  placeholder="Your name" onKeyDown={e=>e.key==="Enter"&&createProfile()} autoFocus />
                <button className="add-btn" style={{width:"auto",padding:"0 20px",flex:"0 0 auto"}} onClick={createProfile}>Create</button>
              </div>
            </div>
            <button className="ghost-btn" style={{width:"100%",marginTop:12,textAlign:"center"}} onClick={()=>setShowProfileModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="shell">
        {/* Header */}
        <header className="app-header">
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:6, textDecoration:"none", color:"var(--text2)", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="header-brand">
            <div className="header-logo">🌿</div>
            <div>
              <div className="header-title">UAlberta Carbon</div>
              <div className="header-sub">Build greener habits</div>
            </div>
          </div>
          <div className="header-right">
            {streak>0 && <span className="pill-green">🔥 {streak}d</span>}
            <button className="profile-btn" onClick={()=>setShowProfileModal(true)}>
              <div className="profile-avatar">{activeProfile?activeProfile.name[0].toUpperCase():"?"}</div>
              {activeProfile?activeProfile.name:"Sign in"}
            </button>
          </div>
        </header>

        {/* No profile */}
        {!activeProfile && (
          <div className="page">
            <div className="onboard-card">
              <div className="onboard-icon">🌍</div>
              <div style={{fontSize:22,fontWeight:800,marginBottom:10,letterSpacing:"-0.4px"}}>Track your footprint</div>
              <div style={{fontSize:14,color:"var(--text2)",lineHeight:1.65,marginBottom:24}}>
                Log trips, meals, and habits on the UAlberta campus.<br/>Earn points for every sustainable choice.
              </div>
              <button className="add-btn" onClick={()=>setShowProfileModal(true)}>Get started →</button>
            </div>
          </div>
        )}

        {/* HOME */}
        {activeProfile && step==="home" && (
          <div className="page">
            <div className="home-greeting">Hey, {activeProfile.name.split(" ")[0]} 👋</div>
            <div className="home-date">{new Date().toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</div>

            <button className="home-start-btn" onClick={()=>setStep("transport")}>
              <div>
                <div className="home-start-label">Log today</div>
                <div className="home-start-sub">
                  {trips.length>0||meals.length>0
                    ? `${trips.length} trip${trips.length!==1?"s":""}, ${meals.length} meal${meals.length!==1?"s":""} — tap to continue`
                    : "Tap to start your daily log"}
                </div>
              </div>
              <span className="home-start-arrow">→</span>
            </button>

            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-val" style={{color:"var(--green)"}}>{streak}</div>
                <div className="stat-label">streak 🔥</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{activeProfile.points}</div>
                <div className="stat-label">points ⭐</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{color: monthlyAvg!==null&&monthlyAvg<=goalKg?"var(--green)":"var(--gold)"}}>
                  {monthlyAvg!==null ? monthlyAvg.toFixed(1) : "—"}
                </div>
                <div className="stat-label">30d avg kg</div>
              </div>
            </div>

            {weekSeries.some(s=>s.kg>0) && (
              <div className="card" style={{marginBottom:14}}>
                <div className="section-title" style={{marginBottom:12}}>Last 7 days</div>
                <WeekBarChart series={weekSeries} goalKg={goalKg} />
                <div style={{marginTop:10,display:"flex",gap:12,fontSize:11,color:"var(--text3)"}}>
                  <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#2a9d6e"}}/>On track</span>
                  <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#e8b84e"}}/>Over goal</span>
                  <span style={{marginLeft:"auto"}}>Goal: {goalKg} kg/day</span>
                </div>
              </div>
            )}

            {activeProfile.badges.length>0 && (
              <>
                <div className="section-title">Badges earned</div>
                <div className="badge-wrap" style={{marginBottom:14}}>
                  {activeProfile.badges.map(b=><span key={b} className="badge-pill">{b}</span>)}
                </div>
              </>
            )}

            {(trips.length>0||meals.length>0) && (
              <div style={{background:"var(--green-pale)",borderRadius:"var(--radius)",padding:"14px 16px",border:"1px solid var(--green-mid)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--green)"}}>In progress</div>
                  <div style={{fontSize:12,color:"var(--text2)",marginTop:2,fontFamily:"Geist Mono"}}>{totalKg.toFixed(2)} kg · not saved yet</div>
                </div>
                <button className="ghost-btn" onClick={saveEntry}>Save now</button>
              </div>
            )}
          </div>
        )}

        {/* TRANSPORT */}
        {activeProfile && step==="transport" && (
          <div className="page">
            <div className="section-heading">How did you get around?</div>
            <div className="section-sub">Select a mode, set distance, then add each trip.</div>

            <div className="option-grid">
              {TRANSPORT_OPTIONS.map(opt=>(
                <button key={opt.mode}
                  className={`option-card ${selectedMode===opt.mode?"selected":""}`}
                  onClick={()=>setSelectedMode(prev=>prev===opt.mode?null:opt.mode)}>
                  <div className="check-dot">✓</div>
                  <span className="option-icon">{opt.icon}</span>
                  <div className="opt-label">{opt.label}</div>
                  <div className="opt-sub">{opt.sublabel}</div>
                </button>
              ))}
            </div>

            {selectedMode && (
              <div className="dist-input-wrap">
                <div>
                  <div className="dist-label">Distance</div>
                  <div className="dist-row">
                    <input className="dist-input" type="number" value={tripKm} min={0.1} step={0.5}
                      onChange={e=>setTripKm(safeNum(e.target.value,1))} />
                    <span className="dist-unit">km</span>
                  </div>
                </div>
                <div>
                  <div className="dist-label" style={{marginBottom:8}}>Common UAlberta routes</div>
                  <div className="route-chips">
                    {CAMPUS_ROUTES.map(r=>(
                      <button key={r.label} className="route-chip" onClick={()=>setTripKm(r.km)}>
                        {r.icon} {r.label} ({r.km} km)
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedMode==="car"||selectedMode==="rideshare") && (
                  <div>
                    <div className="dist-label" style={{marginBottom:8}}>People in car</div>
                    <div className="occ-row">
                      {[1,2,3,4].map(n=>(
                        <button key={n} className={`occ-btn ${tripOcc===n?"active":""}`} onClick={()=>setTripOcc(n)}>
                          {["👤","👥","👥+","👥++"][n-1]} {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:10,alignItems:"center",paddingTop:4}}>
                  <div style={{fontSize:12,color:"var(--text3)",flex:1}}>
                    Est. <strong style={{fontFamily:"Geist Mono",color:"var(--green)"}}>
                      {TRANSPORT_OPTIONS.find(o=>o.mode===selectedMode)!.kg(tripKm,tripOcc).toFixed(3)} kg CO₂
                    </strong>
                  </div>
                  <button className="add-btn" style={{flex:1,padding:"11px"}} onClick={addTrip}>+ Add trip</button>
                </div>
              </div>
            )}

            {trips.length>0 && (
              <div className="logged-list">
                <div className="section-title" style={{marginTop:16}}>Trips logged</div>
                {trips.map((t,i)=>{
                  const opt = TRANSPORT_OPTIONS.find(o=>o.mode===t.mode)!;
                  return (
                    <div key={i} className="logged-item">
                      <span className="logged-icon">{opt.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="logged-name">{t.label}</div>
                        <div className="logged-sub">{t.km} km · {opt.label}{t.carOccupancy?` · ${t.carOccupancy}p`:""}</div>
                      </div>
                      <span className="logged-kg">{opt.kg(t.km,t.carOccupancy).toFixed(3)} kg</span>
                      <button className="remove-btn" onClick={()=>setTrips(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                    </div>
                  );
                })}
                <div style={{marginTop:4}}>
                  <button className="add-btn" onClick={()=>setStep("food")}>Next: Food →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOD */}
        {activeProfile && step==="food" && (
          <div className="page">
            <div className="section-heading">What did you eat?</div>
            <div className="section-sub">Tap a card to add a meal. Add one per meal eaten today.</div>

            <div className="option-grid">
              {MEAL_OPTIONS.map(opt=>(
                <button key={opt.type}
                  className={`option-card meal-${opt.type}`}
                  onClick={()=>addMeal(opt.type)}>
                  <span className="option-icon">{opt.icon}</span>
                  <div className="opt-label">{opt.label}</div>
                  <div className="opt-sub">{opt.description}</div>
                  <div className="opt-kg" style={{color: opt.type==="vegan"?"#1a6b3c":opt.type==="vegetarian"?"#2a7a50":opt.type==="mixed"?"#8a5000":"#8a2020"}}>
                    {opt.kg} kg CO₂
                  </div>
                </button>
              ))}
            </div>

            {meals.length>0 && (
              <div className="logged-list" style={{marginTop:16}}>
                <div className="section-title">Meals added</div>
                {meals.map((m,i)=>{
                  const opt = MEAL_OPTIONS.find(o=>o.type===m.type)!;
                  return (
                    <div key={i} className="logged-item">
                      <span className="logged-icon">{opt.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="logged-name">{opt.label}</div>
                        <div className="logged-sub">{opt.description}</div>
                      </div>
                      <span className="logged-kg">{opt.kg} kg</span>
                      <button className="remove-btn" onClick={()=>setMeals(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{marginTop:20}}>
              <button className="add-btn" onClick={()=>setStep("extras")} disabled={meals.length===0}>
                {meals.length===0?"Add at least one meal →":"Next: Habits →"}
              </button>
            </div>
          </div>
        )}

        {/* EXTRAS */}
        {activeProfile && step==="extras" && (
          <div className="page">
            <div className="section-heading">Bonus habits</div>
            <div className="section-sub">Earn mission points for sustainable habits beyond transport and food.</div>

            <div className="habit-grid">
              <div className={`habit-card ${refills>=2?"active":""}`}
                onClick={()=>setRefills(v=>v>=2?0:2)}>
                <div className="habit-icon-big">💧</div>
                <div className="habit-label">Bottle refills</div>
                <div className="habit-sub">Used reusable bottle 2+ times today</div>
                <div className="habit-pts">{refills>=2?"✓ ":"+"}15 pts</div>
              </div>
              <div className={`habit-card ${natureMinutes>=10?"active":""}`}
                onClick={()=>setNatureMinutes(v=>v>=10?0:15)}>
                <div className="habit-icon-big">🌿</div>
                <div className="habit-label">Nature time</div>
                <div className="habit-sub">Spent 10+ min outdoors today</div>
                <div className="habit-pts">{natureMinutes>=10?"✓ ":"+"}15 pts</div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">Electricity estimate</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:includeElec?14:0}}>
                <span style={{fontSize:13,color:"var(--text2)",fontWeight:600}}>Include daily share</span>
                <button onClick={()=>setIncludeElec(v=>!v)}
                  style={{padding:"6px 16px",borderRadius:999,border:"none",
                    background:includeElec?"var(--green)":"var(--surface2)",
                    color:includeElec?"white":"var(--text3)",
                    fontSize:12,fontWeight:800,cursor:"pointer",transition:"all 0.15s",
                    fontFamily:"Geist, sans-serif"}}>
                  {includeElec?"On":"Off"}
                </button>
              </div>
              {includeElec && (
                <>
                  <div className="dist-label" style={{marginBottom:8}}>Province</div>
                  <div className="province-row" style={{marginBottom:14}}>
                    {(["AB","SK","BC"] as Province[]).map(p=>(
                      <button key={p} className={`province-btn ${province===p?"active":""}`} onClick={()=>setProvince(p)}>{p}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:13,color:"var(--text2)",fontWeight:600,flex:1}}>Household size</span>
                    <div className="number-input-wrap">
                      <button className="num-btn" onClick={()=>setHouseholdSize(v=>Math.max(1,v-1))}>−</button>
                      <span className="num-val">{householdSize}</span>
                      <button className="num-btn" onClick={()=>setHouseholdSize(v=>Math.min(12,v+1))}>+</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button className="save-btn" onClick={saveEntry}>Save today's log →</button>
              <div style={{textAlign:"center",fontSize:12,color:"var(--text3)"}}>
                Total: <strong style={{fontFamily:"Geist Mono",color:ok?"var(--green)":"var(--gold)"}}>{totalKg.toFixed(2)} kg CO₂</strong>
                {" · "}{ok?"✅ under goal":"⚠️ over goal"}
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {activeProfile && step==="result" && (
          <div className="page">
            {/* Hero — donut + total */}
            <div className="result-hero">
              <div style={{fontSize:12,color:"var(--text3)",fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                Today&apos;s footprint
              </div>
              <div className="result-hero-top">
                <DonutChart transport={transportKg} food={foodKg} elec={elecKg} total={totalKg} />
                <div style={{flex:1}}>
                  <div className="result-total" style={{color:ok?"var(--green)":"var(--gold)"}}>{totalKg.toFixed(2)}</div>
                  <div className="result-unit">kg CO₂e</div>
                  <div className={`result-status ${ok?"ok":"over"}`}>
                    {ok
                      ? `✅ ${savedKg.toFixed(2)} kg saved vs baseline`
                      : `⚠️ ${(totalKg-goalKg).toFixed(2)} kg over ${goalKg} kg goal`}
                  </div>
                  <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span className="pill-green">+{missionPts} pts</span>
                    {streak>0 && <span className="pill-green">🔥 {streak}d</span>}
                  </div>
                </div>
              </div>
              {/* Donut legend */}
              <div style={{display:"flex",gap:14,marginTop:14,paddingTop:12,borderTop:"1px solid var(--border)"}}>
                {[
                  {label:"Transport",color:"#2563eb",kg:transportKg},
                  {label:"Food",     color:"#16a34a",kg:foodKg},
                  {label:"Elec.",    color:"#d97706",kg:elecKg},
                ].map(s=>(
                  <div key={s.label} style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                    <span style={{width:9,height:9,borderRadius:2,background:s.color,display:"inline-block",flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:10,color:"var(--text3)",fontWeight:700}}>{s.label}</div>
                      <div style={{fontSize:12,fontFamily:"Geist Mono",fontWeight:700,color:"var(--text)"}}>{s.kg.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison to Canadian average */}
            <div className="compare-card">
              <div className="compare-title">vs Canadian daily average</div>
              {[
                {name:"You", kg:totalKg, color:ok?"#2a9d6e":"#f0a000"},
                {name:"Avg 🇨🇦", kg:CA_DAILY_KG, color:"#aaa"},
              ].map(r=>(
                <div key={r.name} className="compare-row">
                  <span className="compare-name">{r.name}</span>
                  <div className="compare-bar-track">
                    <div className="compare-bar-fill" style={{width:`${Math.min((r.kg/CA_DAILY_KG)*100,100)}%`,background:r.color}} />
                  </div>
                  <span className="compare-val" style={{color:r.color}}>{r.kg.toFixed(1)}</span>
                </div>
              ))}
              {totalKg < CA_DAILY_KG && (
                <div style={{marginTop:10,fontSize:12,color:"var(--green)",fontWeight:700}}>
                  {((1-totalKg/CA_DAILY_KG)*100).toFixed(0)}% below the Canadian average ✓
                </div>
              )}
            </div>

            {/* Breakdown bars */}
            <div className="section-title">Breakdown</div>
            <div className="breakdown" style={{marginBottom:14}}>
              {[
                {label:"Transport", kg:transportKg, color:"#2563eb"},
                {label:"Food",      kg:foodKg,      color:"#16a34a"},
                {label:"Electricity",kg:elecKg,     color:"#d97706"},
              ].map(b=>(
                <div key={b.label} className="breakdown-row">
                  <span className="breakdown-dot" style={{background:b.color}} />
                  <span className="breakdown-label">{b.label}</span>
                  <div className="breakdown-bar-wrap">
                    <div className="breakdown-bar-fill" style={{width:totalKg>0?`${(b.kg/totalKg)*100}%`:"0%",background:b.color}} />
                  </div>
                  <span className="breakdown-val">{b.kg.toFixed(2)} kg</span>
                </div>
              ))}
            </div>

            {/* What it equals */}
            <div className="section-title">What {totalKg.toFixed(1)} kg CO₂ equals</div>
            <div className="equiv-grid">
              {[
                {icon:"🚗", val:(totalKg/(0.4/1.60934)).toFixed(0), label:"km driven"},
                {icon:"📺", val:(totalKg/0.036).toFixed(0),         label:"hrs streaming"},
                {icon:"🌳", val:`${Math.round(totalKg/(40/365))}–${Math.round(totalKg/(10/365))}`, label:"tree days"},
                {icon:"📱", val:Math.round(totalKg/(0.015*EF.grid[province])).toString(), label:`phone charges (${province})`},
              ].map(e=>(
                <div key={e.label} className="equiv-card">
                  <div className="equiv-icon">{e.icon}</div>
                  <div className="equiv-val">{e.val}</div>
                  <div className="equiv-label">{e.label}</div>
                </div>
              ))}
            </div>

            {/* Personalised tips */}
            <div className="section-title">Personalised insights</div>
            <div className="tips-list">
              {tips.map((t,i)=>(
                <div key={i} className="tip-row">
                  <span className="tip-icon">{t.icon}</span>
                  <span className="tip-text">{t.text}</span>
                </div>
              ))}
            </div>

            {/* Daily missions */}
            <div className="section-title">Daily missions</div>
            <div className="missions-list">
              {missions.map(m=>(
                <div key={m.id} className={`mission-row ${m.done?"done":""}`}>
                  <div className={`mission-check ${m.done?"done":"todo"}`}>{m.done?"✓":""}</div>
                  <span style={{fontSize:15}}>{m.icon}</span>
                  <span className={`mission-text ${m.done?"done":"todo"}`}>{m.label}</span>
                  <span className={`mission-pts ${m.done?"done":"todo"}`}>+{m.points}</span>
                </div>
              ))}
            </div>

            <button className="add-btn" style={{marginTop:4}} onClick={()=>setStep("home")}>
              Back to home ↩
            </button>
          </div>
        )}

        {/* Running total bar */}
        {activeProfile && (step==="transport"||step==="food"||step==="extras") && (
          <div className="running-total">
            <div>
              <div className="rt-label">Running total</div>
              <div className="rt-value" style={{color:ok?"var(--green)":"var(--gold)"}}>{totalKg.toFixed(2)} kg</div>
            </div>
            <div className="rt-bar-wrap">
              <div className={`rt-bar-fill ${ok?"ok":"over"}`} style={{width:`${Math.min((totalKg/goalKg)*100,100)}%`}} />
            </div>
            <span className={ok?"pill-green":"pill-gold"}>of {goalKg.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom nav */}
        {activeProfile && (
          <nav className="step-nav">
            {([
              {id:"home",      icon:"🏠", label:"Home"},
              {id:"transport", icon:"🚌", label:"Transport", badge:trips.length},
              {id:"food",      icon:"🍽️", label:"Food",     badge:meals.length},
              {id:"extras",    icon:"🌿", label:"Habits"},
              {id:"result",    icon:"📊", label:"Results"},
            ] as {id:Step;icon:string;label:string;badge?:number}[]).map(t=>(
              <button key={t.id} className={`step-tab ${step===t.id?"active":""}`} onClick={()=>setStep(t.id)}>
                {t.badge ? <span className="step-badge">{t.badge}</span> : null}
                <span className="step-icon">{t.icon}</span>
                <span className="step-label">{t.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
