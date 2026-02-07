"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * CO2 Self-Tracking (Local-first)
 * - Transport + Food + Electricity (auto estimate by province)
 * - Baseline + Savings + Points + Streaks + Badges + Weekly trend
 * - Local profiles stored in localStorage
 * - CSV export
 *
 * NEW: "What this means" panel
 * - Converts kg CO2e into intuitive equivalents (driving, streaming, tree-days, phone charges)
 */

type Province = "AB" | "SK" | "BC";
type TransportMode = "walk" | "bike" | "bus" | "lrt" | "rideshare" | "car" | "ev";
type MealType = "meat_heavy" | "mixed" | "vegetarian" | "vegan";

type Entry = {
  id: string;
  dateISO: string; // yyyy-mm-dd
  trips: Array<{
    label: string;
    km: number;
    mode: TransportMode;
    carOccupancy?: number; // for car/rideshare
  }>;
  meals: Array<{ label: string; type: MealType }>;

  // Electricity estimate (optional)
  includeElectricity: boolean;
  province: Province;
  householdSize: number;
  electricityLevel: "low" | "average" | "high";

  // Wellness / habits (points only)
  refills: number;
  natureMinutes: number;

  notes?: string;
};

type Profile = {
  id: string;
  name: string;
  createdAt: number;

  // Baseline choices
  baselineMode: TransportMode;
  baselineCarOccupancy: number;
  baselineMeal: MealType;
  dailyCO2GoalKg: number;

  // Saved log
  entries: Entry[];

  // Gamification
  points: number;
  badges: string[];
};

const STORAGE_KEY = "uofa_co2_profiles_v1";
const ACTIVE_PROFILE_KEY = "uofa_co2_active_profile_v1";

/** ---------- Emission Factors (simple defaults) ---------- **/
const EF = {
  // kg CO2e per km (simplified)
  transportKgPerKm: {
    walk: 0,
    bike: 0,
    bus: 0.08,
    lrt: 0.03,
    rideshare: 0.2,
    car: 0.2,
    ev: 0.04
  } satisfies Record<TransportMode, number>,

  // Food kg CO2e per meal (simplified educational defaults)
  foodKgPerMeal: {
    meat_heavy: 3.3,
    mixed: 2.0,
    vegetarian: 1.2,
    vegan: 0.9
  } satisfies Record<MealType, number>,

  // Electricity grid intensity in kg/kWh (your earlier values)
  gridKgPerKWh: {
    AB: 0.47,
    SK: 0.63,
    BC: 0.014
  } satisfies Record<Province, number>,

  // Typical household kWh/month proxies (your earlier values)
  typicalKWhPerMonth: {
    AB: 600,
    SK: 625,
    BC: 675
  } satisfies Record<Province, number>
};

const ELECTRICITY_LEVEL_MULT: Record<"low" | "average" | "high", number> = {
  low: 0.75,
  average: 1.0,
  high: 1.25
};

const MODE_LABEL: Record<TransportMode, string> = {
  walk: "Walk",
  bike: "Bike",
  bus: "Bus",
  lrt: "LRT",
  rideshare: "Rideshare",
  car: "Car",
  ev: "EV"
};

const MEAL_LABEL: Record<MealType, string> = {
  meat_heavy: "Meat-heavy",
  mixed: "Mixed",
  vegetarian: "Vegetarian",
  vegan: "Vegan"
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeNumber(n: any, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/** ---------- Local Storage helpers ---------- **/
function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Profile[];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function loadActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

function saveActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

/** ---------- Calculations ---------- **/
function calcTransportKg(entry: Entry) {
  return entry.trips.reduce((sum, t) => {
    const km = safeNumber(t.km, 0);
    const base = EF.transportKgPerKm[t.mode] * km;

    if (t.mode === "car" || t.mode === "rideshare") {
      const occ = clamp(safeNumber(t.carOccupancy ?? 1, 1), 1, 6);
      return sum + base / occ;
    }
    return sum + base;
  }, 0);
}

function calcFoodKg(entry: Entry) {
  return entry.meals.reduce((sum, m) => sum + (EF.foodKgPerMeal[m.type] ?? 0), 0);
}

function calcElectricityKg(entry: Entry) {
  if (!entry.includeElectricity) return 0;

  const prov = entry.province;
  const kwhMonthTypical = EF.typicalKWhPerMonth[prov] * ELECTRICITY_LEVEL_MULT[entry.electricityLevel];
  const people = clamp(safeNumber(entry.householdSize, 1), 1, 12);

  const kwhPerPersonPerDay = (kwhMonthTypical / 30.4) / people;
  return kwhPerPersonPerDay * EF.gridKgPerKWh[prov];
}

function calcTotalKg(entry: Entry) {
  return calcTransportKg(entry) + calcFoodKg(entry) + calcElectricityKg(entry);
}

function calcBaselineKg(profile: Profile, entry: Entry) {
  const totalKm = entry.trips.reduce((s, t) => s + safeNumber(t.km, 0), 0);

  let transportBase = EF.transportKgPerKm[profile.baselineMode] * totalKm;
  if (profile.baselineMode === "car" || profile.baselineMode === "rideshare") {
    transportBase = transportBase / clamp(profile.baselineCarOccupancy, 1, 6);
  }

  const foodBase = (EF.foodKgPerMeal[profile.baselineMeal] ?? 0) * entry.meals.length;
  const elec = calcElectricityKg(entry);

  return transportBase + foodBase + elec;
}

/** ---------- Gamification ---------- **/
function missionsForDay(entry: Entry) {
  const missions: Array<{ id: string; label: string; done: boolean; points: number }> = [];

  const transportKg = calcTransportKg(entry);
  const hadCar = entry.trips.some((t) => t.mode === "car" || t.mode === "rideshare");
  const hadBikeWalk = entry.trips.some((t) => t.mode === "bike" || t.mode === "walk");
  const vegMeals = entry.meals.filter((m) => m.type === "vegetarian" || m.type === "vegan").length;

  missions.push({ id: "m_walkbike", label: "Move low-carbon (walk/bike today)", done: hadBikeWalk, points: 50 });
  missions.push({ id: "m_no_car", label: "No car/rideshare today", done: !hadCar && entry.trips.length > 0, points: 40 });
  missions.push({ id: "m_veg_meal", label: "Choose at least 1 vegetarian/vegan meal", done: vegMeals >= 1, points: 30 });
  missions.push({ id: "m_refill", label: "Refill your bottle 2+ times", done: entry.refills >= 2, points: 15 });
  missions.push({ id: "m_nature", label: "Nature reset (10+ minutes)", done: entry.natureMinutes >= 10, points: 15 });
  missions.push({ id: "m_transport_low", label: "Keep transport emissions low (< 1.0 kg)", done: transportKg < 1.0 && entry.trips.length > 0, points: 20 });

  return missions;
}

function computeBadges(profile: Profile) {
  const entries = [...profile.entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const badges = new Set<string>(profile.badges);

  if (entries.length >= 1) badges.add("✅ First log");
  if (entries.length >= 7) badges.add("📅 7 logs");
  if (entries.some((e) => e.trips.some((t) => t.mode === "bike"))) badges.add("🚲 Bike day");

  let vegStreak = 0;
  for (const e of entries) {
    const veg = e.meals.some((m) => m.type === "vegetarian" || m.type === "vegan");
    vegStreak = veg ? vegStreak + 1 : 0;
    if (vegStreak >= 3) {
      badges.add("🥗 Veg streak (3+)");
      break;
    }
  }

  let goalWins = 0;
  for (const e of entries) {
    if (calcTotalKg(e) <= profile.dailyCO2GoalKg) goalWins++;
  }
  if (goalWins >= 5) badges.add("🎯 Goal hitter (5 days)");

  return Array.from(badges);
}

function computeStreak(profile: Profile) {
  const set = new Set(profile.entries.map((e) => e.dateISO));
  let streak = 0;

  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (set.has(iso)) streak++;
    else break;
  }
  return streak;
}

/** ---------- "What this means" equivalents ---------- **/
function roundNice(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 1) return Math.round(n * 10) / 10;
  if (n < 10) return Math.round(n);
  return Math.round(n / 5) * 5;
}

function co2Equivalents(totalKg: number) {
  // Driving equivalent:
  // EPA: ~400 g CO2 per mile => 0.4 kg/mi => 0.2485 kg/km
  const carKgPerKm = 0.4 / 1.60934;

  // Streaming:
  // IEA central estimate: 36 g CO2 per hour => 0.036 kg/hr
  const streamKgPerHour = 0.036;

  // Tree uptake (range): 10–40 kg CO2 per year
  const treeLowKgPerYear = 10;
  const treeHighKgPerYear = 40;
  const daysPerYear = 365;

  const driveKm = totalKg / carKgPerKm;
  const streamHours = totalKg / streamKgPerHour;

  // "days for one average tree to absorb"
  const treeDaysLow = totalKg / (treeHighKgPerYear / daysPerYear);  // faster uptake
  const treeDaysHigh = totalKg / (treeLowKgPerYear / daysPerYear);  // slower uptake

  return { driveKm, streamHours, treeDaysLow, treeDaysHigh };
}

function MeaningCard(props: { totalKg: number; savedKg: number; province: Province }) {
  const totalEq = co2Equivalents(props.totalKg);
  const savedEq = co2Equivalents(props.savedKg);

  // Phone charges:
  // Typical smartphone battery ~15 Wh ≈ 0.015 kWh (order of magnitude).
  // Convert to CO2 with province grid factor.
  const kwhPerCharge = 0.015;
  const kgPerPhoneCharge = kwhPerCharge * EF.gridKgPerKWh[props.province];
  const phoneChargesTotal = kgPerPhoneCharge > 0 ? props.totalKg / kgPerPhoneCharge : 0;
  const phoneChargesSaved = kgPerPhoneCharge > 0 ? props.savedKg / kgPerPhoneCharge : 0;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(0,0,0,0.03)"
      }}
    >
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>🧭 What this means</div>

      <EquivBlock
        title="Today’s footprint (total)"
        rows={[
          { left: "🚗 Driving equivalent", right: `${roundNice(totalEq.driveKm)} km` },
          { left: "📺 Streaming video", right: `${roundNice(totalEq.streamHours)} hours` },
          { left: "🌳 One tree absorb time", right: `~${roundNice(totalEq.treeDaysLow)}–${roundNice(totalEq.treeDaysHigh)} days` },
          { left: "📱 Phone charges", right: `~${roundNice(phoneChargesTotal)} charges (${props.province} grid)` }
        ]}
      />

      {props.savedKg > 0.0001 && (
        <>
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />
          <EquivBlock
            title="What you saved today (vs your baseline)"
            rows={[
              { left: "🚗 Driving avoided", right: `${roundNice(savedEq.driveKm)} km` },
              { left: "📺 Streaming equivalent", right: `${roundNice(savedEq.streamHours)} hours` },
              { left: "🌳 Tree absorb time", right: `~${roundNice(savedEq.treeDaysLow)}–${roundNice(savedEq.treeDaysHigh)} days` },
              { left: "📱 Phone charges", right: `~${roundNice(phoneChargesSaved)} charges (${props.province} grid)` }
            ]}
          />
        </>
      )}

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.35 }}>
        These are **rough equivalents** meant to build intuition (tree uptake varies a lot, so we show a range).
      </div>
    </div>
  );
}

function EquivBlock(props: { title: string; rows: Array<{ left: string; right: string }> }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.85, marginBottom: 8 }}>{props.title}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {props.rows.map((r) => (
          <div key={r.left} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontWeight: 900 }}>{r.left}</span>
            <span>{r.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ---------- Tiny UI helpers ---------- **/
function Card(props: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}
    >
      {(props.title || props.right) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.2 }}>{props.title}</div>
          {props.right}
        </div>
      )}
      <div style={{ marginTop: props.title || props.right ? 12 : 0 }}>{props.children}</div>
    </div>
  );
}

function Pill(props: { children: React.ReactNode; tone?: "green" | "gray" | "amber" }) {
  const tone = props.tone ?? "gray";
  const bg = tone === "green" ? "rgba(21,71,52,0.10)" : tone === "amber" ? "rgba(180,120,20,0.12)" : "rgba(0,0,0,0.06)";
  const bd = tone === "green" ? "rgba(21,71,52,0.18)" : tone === "amber" ? "rgba(180,120,20,0.20)" : "rgba(0,0,0,0.10)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${bd}`,
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {props.children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "12px 0" }} />;
}

/** ---------- Main Page ---------- **/
export default function CO2Page() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Editor state
  const [dateISO, setDateISO] = useState(todayISO());

  // New trip inputs
  const [tripLabel, setTripLabel] = useState("Home → Campus");
  const [tripKm, setTripKm] = useState<number>(6);
  const [tripMode, setTripMode] = useState<TransportMode>("bus");
  const [tripOcc, setTripOcc] = useState<number>(1);

  // Meal inputs
  const [mealLabel, setMealLabel] = useState("Lunch");
  const [mealType, setMealType] = useState<MealType>("mixed");

  // Entry extras
  const [includeElectricity, setIncludeElectricity] = useState(true);
  const [province, setProvince] = useState<Province>("AB");
  const [householdSize, setHouseholdSize] = useState(2);
  const [electricityLevel, setElectricityLevel] = useState<"low" | "average" | "high">("average");
  const [refills, setRefills] = useState(0);
  const [natureMinutes, setNatureMinutes] = useState(0);
  const [notes, setNotes] = useState("");

  // Entry in-progress
  const [draftTrips, setDraftTrips] = useState<Entry["trips"]>([]);
  const [draftMeals, setDraftMeals] = useState<Entry["meals"]>([]);

  // UI
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);

  // Load
  useEffect(() => {
    const p = loadProfiles();
    setProfiles(p);

    const active = loadActiveProfileId();
    if (active && p.some((x) => x.id === active)) {
      setActiveId(active);
    } else if (p[0]) {
      setActiveId(p[0].id);
      saveActiveProfileId(p[0].id);
    }
  }, []);

  // Save
  useEffect(() => {
    if (profiles.length) saveProfiles(profiles);
  }, [profiles]);

  const activeProfile = useMemo(() => profiles.find((p) => p.id === activeId) ?? null, [profiles, activeId]);

  useEffect(() => {
    setDraftTrips([]);
    setDraftMeals([]);
    setDateISO(todayISO());
    setNotes("");
    setRefills(0);
    setNatureMinutes(0);
  }, [activeId]);

  const todayEntryPreview: Entry = useMemo(() => {
    return {
      id: uid("entry"),
      dateISO,
      trips: draftTrips,
      meals: draftMeals,
      includeElectricity,
      province,
      householdSize,
      electricityLevel,
      refills,
      natureMinutes,
      notes
    };
  }, [
    dateISO,
    draftTrips,
    draftMeals,
    includeElectricity,
    province,
    householdSize,
    electricityLevel,
    refills,
    natureMinutes,
    notes
  ]);

  const preview = useMemo(() => {
    if (!activeProfile) return null;

    const transport = calcTransportKg(todayEntryPreview);
    const food = calcFoodKg(todayEntryPreview);
    const elec = calcElectricityKg(todayEntryPreview);
    const total = transport + food + elec;

    const base = calcBaselineKg(activeProfile, todayEntryPreview);
    const save = base - total;

    const missions = missionsForDay(todayEntryPreview);
    const missionPoints = missions.filter((m) => m.done).reduce((s, m) => s + m.points, 0);

    return { transport, food, elec, total, base, save, missions, missionPoints };
  }, [activeProfile, todayEntryPreview]);

  const weekSeries = useMemo(() => {
    if (!activeProfile) return [];
    const out: Array<{ dateISO: string; kg: number }> = [];
    const now = new Date();
    const map = new Map(activeProfile.entries.map((e) => [e.dateISO, calcTotalKg(e)]));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ dateISO: iso, kg: map.get(iso) ?? 0 });
    }
    return out;
  }, [activeProfile]);

  const onAddTripPreset = (label: string, km: number, mode: TransportMode) => {
    setDraftTrips((prev) => [
      ...prev,
      { label, km, mode, carOccupancy: mode === "car" || mode === "rideshare" ? 1 : undefined }
    ]);
  };

  const onAddTrip = () => {
    const km = clamp(safeNumber(tripKm, 0), 0, 500);
    const mode = tripMode;
    setDraftTrips((prev) => [
      ...prev,
      {
        label: tripLabel.trim() || "Trip",
        km,
        mode,
        carOccupancy: mode === "car" || mode === "rideshare" ? clamp(tripOcc, 1, 6) : undefined
      }
    ]);
  };

  const onAddMeal = () => {
    setDraftMeals((prev) => [...prev, { label: mealLabel.trim() || "Meal", type: mealType }]);
  };

  const removeTrip = (idx: number) => setDraftTrips((prev) => prev.filter((_, i) => i !== idx));
  const removeMeal = (idx: number) => setDraftMeals((prev) => prev.filter((_, i) => i !== idx));

  const upsertEntry = () => {
    if (!activeProfile || !preview) return;

    const entry: Entry = {
      ...todayEntryPreview,
      id: uid("entry"),
      householdSize: clamp(safeNumber(householdSize, 1), 1, 12),
      refills: clamp(safeNumber(refills, 0), 0, 30),
      natureMinutes: clamp(safeNumber(natureMinutes, 0), 0, 600)
    };

    const missionPoints = preview.missionPoints;

    const nextProfiles = profiles.map((p) => {
      if (p.id !== activeProfile.id) return p;

      const existingIdx = p.entries.findIndex((e) => e.dateISO === entry.dateISO);
      const nextEntries = [...p.entries];
      if (existingIdx >= 0) nextEntries[existingIdx] = entry;
      else nextEntries.push(entry);

      const isNewDay = existingIdx < 0;
      const pointsAdd = isNewDay ? missionPoints : 0;

      const next: Profile = {
        ...p,
        entries: nextEntries,
        points: p.points + pointsAdd
      };

      next.badges = computeBadges(next);
      return next;
    });

    setProfiles(nextProfiles);

    setDraftTrips([]);
    setDraftMeals([]);
    setNotes("");
  };

  const createProfile = (name: string) => {
    const p: Profile = {
      id: uid("profile"),
      name: name.trim() || "New User",
      createdAt: Date.now(),
      baselineMode: "car",
      baselineCarOccupancy: 1,
      baselineMeal: "mixed",
      dailyCO2GoalKg: 6.0,
      entries: [],
      points: 0,
      badges: []
    };
    const next = [p, ...profiles];
    setProfiles(next);
    setActiveId(p.id);
    saveActiveProfileId(p.id);
  };

  const deleteProfile = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    if (activeId === id) {
      const newActive = next[0]?.id ?? null;
      setActiveId(newActive);
      if (newActive) saveActiveProfileId(newActive);
    }
  };

  const updateActive = (patch: Partial<Profile>) => {
    if (!activeProfile) return;
    setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? { ...p, ...patch } : p)));
  };

  const exportCSV = () => {
    if (!activeProfile) return;
    const rows: string[] = [];
    rows.push(
      [
        "date",
        "transport_kg",
        "food_kg",
        "electricity_kg",
        "total_kg",
        "baseline_kg",
        "savings_kg",
        "province",
        "household_size",
        "electricity_level",
        "refills",
        "nature_minutes",
        "trips",
        "meals",
        "notes"
      ].join(",")
    );

    const entries = [...activeProfile.entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    for (const e of entries) {
      const transport = calcTransportKg(e);
      const food = calcFoodKg(e);
      const elec = calcElectricityKg(e);
      const total = transport + food + elec;
      const baseline = calcBaselineKg(activeProfile, e);
      const save = baseline - total;

      const trips = e.trips
        .map((t) => `${t.label}(${t.km}km ${t.mode}${t.carOccupancy ? ` occ=${t.carOccupancy}` : ""})`)
        .join(" | ");
      const meals = e.meals.map((m) => `${m.label}(${m.type})`).join(" | ");

      const esc = (s: string) => `"${String(s ?? "").replaceAll('"', '""')}"`;

      rows.push(
        [
          e.dateISO,
          transport.toFixed(3),
          food.toFixed(3),
          elec.toFixed(3),
          total.toFixed(3),
          baseline.toFixed(3),
          save.toFixed(3),
          e.province,
          e.householdSize,
          e.electricityLevel,
          e.refills,
          e.natureMinutes,
          esc(trips),
          esc(meals),
          esc(e.notes ?? "")
        ].join(",")
      );
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProfile.name.replaceAll(" ", "_")}_co2_log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const streak = activeProfile ? computeStreak(activeProfile) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 18,
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(21,71,52,0.18), transparent 55%), radial-gradient(900px 600px at 90% 10%, rgba(30,120,180,0.12), transparent 55%), linear-gradient(180deg, rgba(245,247,246,1), rgba(235,240,238,1))"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        {/* Top bar */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4 }}>🌍 CO₂ Self-Tracker</div>
            <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>
              Log your day, see trends, earn points, and build low-carbon habits.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {activeProfile && (
              <>
                <Pill tone="green">🔥 Streak: {streak} day{streak === 1 ? "" : "s"}</Pill>
                <Pill>⭐ Points: {activeProfile.points}</Pill>
                <button
                  onClick={() => setShowProfiles((v) => !v)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "rgba(255,255,255,0.95)",
                    cursor: "pointer",
                    fontWeight: 800
                  }}
                >
                  👤 Profiles
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profiles panel */}
        {showProfiles && (
          <Card
            title="Profiles"
            right={
              <button
                onClick={() => setShowProfiles(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            }
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => createProfile(prompt("Profile name?") ?? "New User")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(21,71,52,0.18)",
                    background: "rgba(21,71,52,0.10)",
                    cursor: "pointer",
                    fontWeight: 900
                  }}
                >
                  ➕ Add profile
                </button>
                {activeProfile && (
                  <button
                    onClick={exportCSV}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "rgba(255,255,255,0.95)",
                      cursor: "pointer",
                      fontWeight: 900
                    }}
                  >
                    ⬇️ Export CSV
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {profiles.length === 0 && <div style={{ opacity: 0.7 }}>No profiles yet — add one.</div>}
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 12,
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: p.id === activeId ? "rgba(21,71,52,0.10)" : "rgba(255,255,255,0.90)"
                    }}
                  >
                    <button
                      onClick={() => {
                        setActiveId(p.id);
                        saveActiveProfileId(p.id);
                      }}
                      style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <div style={{ fontWeight: 900 }}>{p.name}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>
                        Logs: {p.entries.length} · Points: {p.points}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete profile "${p.name}"?`)) deleteProfile(p.id);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 900
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {!activeProfile && (
          <Card title="Create your first profile">
            <button
              onClick={() => createProfile("Reine")}
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(21,71,52,0.18)",
                background: "rgba(21,71,52,0.10)",
                cursor: "pointer",
                fontWeight: 900
              }}
            >
              ➕ Create profile
            </button>
          </Card>
        )}

        {activeProfile && preview && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "start" }}>
            {/* Left: Logger */}
            <div style={{ display: "grid", gap: 14 }}>
              <Card
                title="Log today"
                right={
                  <Pill tone={preview.total <= activeProfile.dailyCO2GoalKg ? "green" : "amber"}>
                    🎯 Goal: {activeProfile.dailyCO2GoalKg.toFixed(1)} kg/day
                  </Pill>
                }
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ fontWeight: 800, fontSize: 13, opacity: 0.8 }}>Date</label>
                    <input
                      value={dateISO}
                      onChange={(e) => setDateISO(e.target.value)}
                      type="date"
                      style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", background: "white" }}
                    />
                    <button
                      onClick={() => setDateISO(todayISO())}
                      style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.95)", cursor: "pointer", fontWeight: 900 }}
                    >
                      Today
                    </button>
                  </div>

                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => onAddTripPreset("Home → Campus", 6, "bus")} style={presetBtnStyle()}>
                      🚌 Home→Campus
                    </button>
                    <button onClick={() => onAddTripPreset("Home → Campus", 6, "bike")} style={presetBtnStyle()}>
                      🚲 Home→Campus
                    </button>
                    <button onClick={() => onAddTripPreset("Campus → Gym", 1.2, "walk")} style={presetBtnStyle()}>
                      🚶 Campus→Gym
                    </button>
                    <button onClick={() => onAddTripPreset("Campus → Downtown", 4, "lrt")} style={presetBtnStyle()}>
                      🚈 Campus→Downtown
                    </button>
                  </div>

                  {/* Add trip */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.8fr 0.6fr 0.6fr", gap: 8, alignItems: "center" }}>
                    <input value={tripLabel} onChange={(e) => setTripLabel(e.target.value)} placeholder="Trip label" style={inputStyle()} />
                    <input value={tripKm} onChange={(e) => setTripKm(safeNumber(e.target.value, 0))} type="number" min={0} step={0.1} placeholder="km" style={inputStyle()} />
                    <select value={tripMode} onChange={(e) => setTripMode(e.target.value as TransportMode)} style={inputStyle()}>
                      {Object.keys(MODE_LABEL).map((k) => (
                        <option key={k} value={k}>
                          {MODE_LABEL[k as TransportMode]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={tripOcc}
                      onChange={(e) => setTripOcc(safeNumber(e.target.value, 1))}
                      type="number"
                      min={1}
                      max={6}
                      step={1}
                      placeholder="occ"
                      disabled={!(tripMode === "car" || tripMode === "rideshare")}
                      style={{ ...inputStyle(), opacity: tripMode === "car" || tripMode === "rideshare" ? 1 : 0.5 }}
                    />
                    <button onClick={onAddTrip} style={primaryBtnStyle()}>
                      Add
                    </button>
                  </div>

                  {/* Trip list */}
                  {draftTrips.length > 0 && (
                    <div style={{ display: "grid", gap: 6 }}>
                      {draftTrips.map((t, idx) => (
                        <div
                          key={`${t.label}_${idx}`}
                          style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.90)" }}
                        >
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ width: 26 }}>{modeEmoji(t.mode)}</span>
                            <div>
                              <div style={{ fontWeight: 900 }}>{t.label}</div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>
                                {t.km} km · {MODE_LABEL[t.mode]}
                                {(t.mode === "car" || t.mode === "rideshare") && t.carOccupancy ? ` · occ ${t.carOccupancy}` : ""}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeTrip(idx)} style={iconBtnStyle()}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Divider />

                  {/* Meals */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>🍽️ Meals</div>
                    <Pill>Meals logged: {draftMeals.length}</Pill>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.5fr", gap: 8 }}>
                    <input value={mealLabel} onChange={(e) => setMealLabel(e.target.value)} placeholder="Meal label" style={inputStyle()} />
                    <select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} style={inputStyle()}>
                      {Object.keys(MEAL_LABEL).map((k) => (
                        <option key={k} value={k}>
                          {MEAL_LABEL[k as MealType]}
                        </option>
                      ))}
                    </select>
                    <button onClick={onAddMeal} style={primaryBtnStyle()}>
                      Add
                    </button>
                  </div>

                  {draftMeals.length > 0 && (
                    <div style={{ display: "grid", gap: 6 }}>
                      {draftMeals.map((m, idx) => (
                        <div
                          key={`${m.label}_${idx}`}
                          style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.90)" }}
                        >
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ width: 26 }}>{mealEmoji(m.type)}</span>
                            <div>
                              <div style={{ fontWeight: 900 }}>{m.label}</div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>{MEAL_LABEL[m.type]}</div>
                            </div>
                          </div>
                          <button onClick={() => removeMeal(idx)} style={iconBtnStyle()}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Divider />

                  {/* Electricity estimate */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900 }}>⚡ Electricity (auto estimate)</div>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                        <input type="checkbox" checked={includeElectricity} onChange={(e) => setIncludeElectricity(e.target.checked)} />
                        Include estimate
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "0.6fr 0.6fr 0.8fr", gap: 8 }}>
                      <div>
                        <div style={miniLabelStyle()}>Province</div>
                        <select value={province} onChange={(e) => setProvince(e.target.value as Province)} style={inputStyle()}>
                          <option value="AB">AB</option>
                          <option value="SK">SK</option>
                          <option value="BC">BC</option>
                        </select>
                      </div>

                      <div>
                        <div style={miniLabelStyle()}>Household size</div>
                        <input type="number" min={1} max={12} value={householdSize} onChange={(e) => setHouseholdSize(safeNumber(e.target.value, 2))} style={inputStyle()} />
                      </div>

                      <div>
                        <div style={miniLabelStyle()}>Usage level</div>
                        <select value={electricityLevel} onChange={(e) => setElectricityLevel(e.target.value as any)} style={inputStyle()}>
                          <option value="low">Low</option>
                          <option value="average">Average</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      We estimate your per-person daily electricity based on typical monthly household usage and provincial grid intensity. You can turn it off anytime.
                    </div>
                  </div>

                  <Divider />

                  {/* Wellness */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={miniLabelStyle()}>💧 Bottle refills</div>
                      <input value={refills} onChange={(e) => setRefills(safeNumber(e.target.value, 0))} type="number" min={0} style={inputStyle()} />
                    </div>

                    <div>
                      <div style={miniLabelStyle()}>🌿 Nature minutes</div>
                      <input value={natureMinutes} onChange={(e) => setNatureMinutes(safeNumber(e.target.value, 0))} type="number" min={0} style={inputStyle()} />
                    </div>
                  </div>

                  <div>
                    <div style={miniLabelStyle()}>Notes (optional)</div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      style={{ ...inputStyle(), width: "100%", resize: "vertical", fontFamily: "system-ui" }}
                      placeholder="Anything you want to remember about today?"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <button onClick={upsertEntry} style={{ ...primaryBtnStyle(), padding: "12px 14px" }}>
                      ✅ Save today
                    </button>
                    <button
                      onClick={() => setShowAssumptions((v) => !v)}
                      style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.95)", cursor: "pointer", fontWeight: 900 }}
                    >
                      ℹ️ Assumptions
                    </button>
                  </div>

                  {showAssumptions && (
                    <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)", fontSize: 12, lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>What this estimate means</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        <li>Transport and food factors are simplified “education-grade” defaults.</li>
                        <li>Electricity is an estimate (typical household monthly kWh ÷ household size) × provincial grid intensity.</li>
                        <li>The “What this means” panel uses common public anchors (EPA driving, IEA streaming, tree uptake range).</li>
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Your baseline (for savings + fairness)">
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={miniLabelStyle()}>Baseline travel mode</div>
                      <select value={activeProfile.baselineMode} onChange={(e) => updateActive({ baselineMode: e.target.value as TransportMode })} style={inputStyle()}>
                        {Object.keys(MODE_LABEL).map((k) => (
                          <option key={k} value={k}>
                            {MODE_LABEL[k as TransportMode]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={miniLabelStyle()}>Baseline car occupancy</div>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={activeProfile.baselineCarOccupancy}
                        onChange={(e) => updateActive({ baselineCarOccupancy: clamp(safeNumber(e.target.value, 1), 1, 6) })}
                        style={{ ...inputStyle(), opacity: activeProfile.baselineMode === "car" || activeProfile.baselineMode === "rideshare" ? 1 : 0.5 }}
                        disabled={!(activeProfile.baselineMode === "car" || activeProfile.baselineMode === "rideshare")}
                      />
                    </div>

                    <div>
                      <div style={miniLabelStyle()}>Baseline meal type</div>
                      <select value={activeProfile.baselineMeal} onChange={(e) => updateActive({ baselineMeal: e.target.value as MealType })} style={inputStyle()}>
                        {Object.keys(MEAL_LABEL).map((k) => (
                          <option key={k} value={k}>
                            {MEAL_LABEL[k as MealType]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr", gap: 8 }}>
                    <div>
                      <div style={miniLabelStyle()}>Daily CO₂ goal (kg)</div>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={activeProfile.dailyCO2GoalKg}
                        onChange={(e) => updateActive({ dailyCO2GoalKg: clamp(safeNumber(e.target.value, 6), 0.5, 50) })}
                        style={inputStyle()}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <Pill tone={preview.total <= activeProfile.dailyCO2GoalKg ? "green" : "amber"}>Today: {preview.total.toFixed(2)} kg</Pill>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Summary / Missions / Week chart / Badges */}
            <div style={{ display: "grid", gap: 14 }}>
              <Card title="Today’s snapshot">
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Metric label="Transport" value={`${preview.transport.toFixed(2)} kg`} hint="Trips you logged" />
                    <Metric label="Food" value={`${preview.food.toFixed(2)} kg`} hint="Meals you logged" />
                    <Metric label="Electricity" value={`${preview.elec.toFixed(2)} kg`} hint={includeElectricity ? `${province} estimate` : "Off"} />
                    <Metric label="Total" value={`${preview.total.toFixed(2)} kg`} hint={preview.total <= activeProfile.dailyCO2GoalKg ? "On track ✅" : "Over goal ⚠️"} />
                  </div>

                  <Divider />

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 900 }}>
                      Savings vs baseline:{" "}
                      <span style={{ color: preview.save >= 0 ? "#154734" : "#8a2f2f" }}>
                        {preview.save >= 0 ? "+" : ""}
                        {preview.save.toFixed(2)} kg
                      </span>
                    </div>
                    <Pill tone={preview.missionPoints >= 60 ? "green" : "gray"}>Mission pts today: {preview.missionPoints}</Pill>
                  </div>

                  <GoalBar value={preview.total} goal={activeProfile.dailyCO2GoalKg} />

                  {/* NEW: Meaning panel */}
                  <MeaningCard totalKg={preview.total} savedKg={Math.max(0, preview.save)} province={province} />
                </div>
              </Card>

              <Card title="Daily missions (bonus points)">
                <div style={{ display: "grid", gap: 8 }}>
                  {preview.missions.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: m.done ? "rgba(21,71,52,0.10)" : "rgba(255,255,255,0.90)"
                      }}
                    >
                      <div style={{ fontWeight: 900, opacity: m.done ? 1 : 0.85 }}>{m.done ? "✅" : "⬜"} {m.label}</div>
                      <Pill tone={m.done ? "green" : "gray"}>+{m.points}</Pill>
                    </div>
                  ))}
                  <div style={{ opacity: 0.7, fontSize: 12 }}>Points add when you log a new day (not when overwriting the same date).</div>
                </div>
              </Card>

              <Card title="Last 7 days">
                <WeekChart series={weekSeries} goal={activeProfile.dailyCO2GoalKg} />
              </Card>

              <Card title="Badges">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {activeProfile.badges.length === 0 ? <div style={{ opacity: 0.7 }}>Log a few days to unlock badges ✨</div> : activeProfile.badges.map((b) => <Pill key={b} tone="green">{b}</Pill>)}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------- UI atoms ---------- **/
function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", background: "white", fontSize: 14, outline: "none" };
}
function miniLabelStyle(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 6 };
}
function primaryBtnStyle(): React.CSSProperties {
  return { padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(21,71,52,0.22)", background: "rgba(21,71,52,0.14)", cursor: "pointer", fontWeight: 900 };
}
function presetBtnStyle(): React.CSSProperties {
  return { padding: "9px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.90)", cursor: "pointer", fontWeight: 900, fontSize: 12 };
}
function iconBtnStyle(): React.CSSProperties {
  return { width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer", fontWeight: 900 };
}

function modeEmoji(m: TransportMode) {
  if (m === "walk") return "🚶";
  if (m === "bike") return "🚲";
  if (m === "bus") return "🚌";
  if (m === "lrt") return "🚈";
  if (m === "rideshare") return "🚕";
  if (m === "car") return "🚗";
  return "🔌";
}

function mealEmoji(t: MealType) {
  if (t === "meat_heavy") return "🥩";
  if (t === "mixed") return "🍛";
  if (t === "vegetarian") return "🥗";
  return "🌱";
}

function Metric(props: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 16, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.90)" }}>
      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7 }}>{props.label}</div>
      <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 4 }}>{props.value}</div>
      {props.hint && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{props.hint}</div>}
    </div>
  );
}

function GoalBar(props: { value: number; goal: number }) {
  const pct = props.goal > 0 ? clamp((props.value / props.goal) * 100, 0, 160) : 0;
  const ok = props.value <= props.goal;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
        <span>Progress</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 6 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: ok ? "rgba(21,71,52,0.65)" : "rgba(180,120,20,0.70)" }} />
      </div>
    </div>
  );
}

function WeekChart(props: { series: Array<{ dateISO: string; kg: number }>; goal: number }) {
  const w = 520;
  const h = 160;
  const pad = 18;

  const maxY = Math.max(props.goal, ...props.series.map((s) => s.kg), 1);
  const minY = 0;

  const xFor = (i: number) => pad + (i * (w - pad * 2)) / Math.max(props.series.length - 1, 1);
  const yFor = (v: number) => {
    const t = (v - minY) / (maxY - minY);
    return h - pad - t * (h - pad * 2);
  };

  const points = props.series.map((s, i) => `${xFor(i).toFixed(1)},${yFor(s.kg).toFixed(1)}`).join(" ");
  const goalY = yFor(props.goal);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <rect x={0} y={0} width={w} height={h} rx={16} fill="rgba(255,255,255,0.75)" stroke="rgba(0,0,0,0.08)" />
        <line x1={pad} y1={goalY} x2={w - pad} y2={goalY} stroke="rgba(21,71,52,0.55)" strokeDasharray="5 5" />
        <text x={w - pad} y={goalY - 6} fontSize="11" fontWeight="900" fill="rgba(21,71,52,0.85)" textAnchor="end">
          goal {props.goal.toFixed(1)}
        </text>
        <polyline fill="none" stroke="rgba(30,120,180,0.85)" strokeWidth={3} points={points} />
        {props.series.map((s, i) => (
          <circle key={s.dateISO} cx={xFor(i)} cy={yFor(s.kg)} r={4} fill="rgba(30,120,180,0.95)" />
        ))}
        {props.series.map((s, i) => (
          <text key={`lbl_${s.dateISO}`} x={xFor(i)} y={h - 6} fontSize="10" fill="rgba(0,0,0,0.55)" textAnchor="middle">
            {s.dateISO.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
