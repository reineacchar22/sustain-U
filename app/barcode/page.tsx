"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── BarcodeDetector web API type ─────────────────────────────────────────────
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(src: HTMLVideoElement | HTMLCanvasElement): Promise<{ rawValue: string; format: string }[]>;
  static getSupportedFormats(): Promise<string[]>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "scan" | "loading" | "result" | "logged" | "error" | "history";
type Factor = { total: number; farming: number; processing: number; transport: number; packaging: number };
type CarbonResult = {
  productName: string; brand: string; quantity: string; weightGrams: number | null;
  agriKey: string; method: string;
  co2eTotal: number; co2ePerKg: number; unit: string;
  breakdown: { farming: number; processing: number; transport: number; packaging: number };
  grade: string; gradeLabel: string; gradeColor: string; gradeBg: string;
  confidence: number; isEstimate: boolean;
  kmDriving: number; cupsOfTea: number;
  alternatives: { key: string; label: string; co2PerKg: number; savingPerKg: number; savingPct: number }[];
};
type HistoryEntry = {
  productName: string; co2eTotal: number; grade: string; gradeColor: string; scannedAt: number;
};

// ─── Agribalyse emission factors (kg CO₂e / kg product) ──────────────────────
const F: Record<string, Factor> = {
  beef:                  { total:30.0, farming:0.82, processing:0.08, transport:0.06, packaging:0.04 },
  lamb:                  { total:24.5, farming:0.80, processing:0.09, transport:0.07, packaging:0.04 },
  pork:                  { total: 7.6, farming:0.72, processing:0.14, transport:0.08, packaging:0.06 },
  chicken:               { total: 5.0, farming:0.70, processing:0.14, transport:0.09, packaging:0.07 },
  fish_wild:             { total: 3.0, farming:0.60, processing:0.18, transport:0.14, packaging:0.08 },
  fish_farmed:           { total: 5.1, farming:0.65, processing:0.18, transport:0.10, packaging:0.07 },
  shrimp:                { total:12.0, farming:0.75, processing:0.12, transport:0.08, packaging:0.05 },
  processed_meat:        { total:11.0, farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  milk_whole:            { total: 1.1, farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },
  milk_skim:             { total: 0.9, farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  cheese_hard:           { total:10.3, farming:0.73, processing:0.16, transport:0.06, packaging:0.05 },
  cheese_soft:           { total: 7.2, farming:0.70, processing:0.18, transport:0.07, packaging:0.05 },
  yogurt:                { total: 2.2, farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  butter:                { total:12.1, farming:0.75, processing:0.14, transport:0.06, packaging:0.05 },
  eggs:                  { total: 3.3, farming:0.72, processing:0.14, transport:0.08, packaging:0.06 },
  ice_cream:             { total: 3.8, farming:0.55, processing:0.28, transport:0.10, packaging:0.07 },
  oat_milk:              { total:0.31, farming:0.52, processing:0.28, transport:0.12, packaging:0.08 },
  soy_milk:              { total:0.28, farming:0.48, processing:0.30, transport:0.13, packaging:0.09 },
  almond_milk:           { total:0.36, farming:0.55, processing:0.25, transport:0.12, packaging:0.08 },
  rice_milk:             { total:0.54, farming:0.60, processing:0.22, transport:0.10, packaging:0.08 },
  bread_white:           { total:0.98, farming:0.42, processing:0.38, transport:0.10, packaging:0.10 },
  bread_wholegrain:      { total:0.96, farming:0.44, processing:0.36, transport:0.10, packaging:0.10 },
  pasta_dry:             { total:1.30, farming:0.48, processing:0.32, transport:0.10, packaging:0.10 },
  rice_white:            { total:2.70, farming:0.78, processing:0.10, transport:0.07, packaging:0.05 },
  rice_brown:            { total:2.50, farming:0.76, processing:0.12, transport:0.07, packaging:0.05 },
  oats:                  { total:1.60, farming:0.55, processing:0.25, transport:0.10, packaging:0.10 },
  breakfast_cereal:      { total:1.80, farming:0.40, processing:0.38, transport:0.10, packaging:0.12 },
  lentils:               { total:0.90, farming:0.56, processing:0.22, transport:0.12, packaging:0.10 },
  chickpeas:             { total:0.86, farming:0.54, processing:0.24, transport:0.12, packaging:0.10 },
  beans_dried:           { total:0.80, farming:0.52, processing:0.26, transport:0.12, packaging:0.10 },
  tofu:                  { total:2.00, farming:0.48, processing:0.32, transport:0.12, packaging:0.08 },
  tempeh:                { total:2.20, farming:0.46, processing:0.34, transport:0.12, packaging:0.08 },
  vegetables_local:      { total:0.20, farming:0.60, processing:0.10, transport:0.20, packaging:0.10 },
  vegetables_imported:   { total:0.50, farming:0.45, processing:0.10, transport:0.35, packaging:0.10 },
  vegetables_greenhouse: { total:2.20, farming:0.75, processing:0.08, transport:0.10, packaging:0.07 },
  fruit_local:           { total:0.25, farming:0.55, processing:0.10, transport:0.22, packaging:0.13 },
  fruit_imported_boat:   { total:0.50, farming:0.42, processing:0.08, transport:0.38, packaging:0.12 },
  fruit_imported_air:    { total:14.0, farming:0.18, processing:0.04, transport:0.72, packaging:0.06 },
  potatoes:              { total:0.46, farming:0.62, processing:0.14, transport:0.14, packaging:0.10 },
  crisps_chips:          { total:3.40, farming:0.30, processing:0.46, transport:0.12, packaging:0.12 },
  biscuits_cookies:      { total:2.80, farming:0.32, processing:0.44, transport:0.12, packaging:0.12 },
  chocolate_dark:        { total:5.60, farming:0.68, processing:0.20, transport:0.07, packaging:0.05 },
  chocolate_milk:        { total:8.00, farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },
  pizza_frozen:          { total:2.30, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },
  ready_meal:            { total:2.80, farming:0.38, processing:0.38, transport:0.12, packaging:0.12 },
  coffee_ground:         { total:3.50, farming:0.70, processing:0.18, transport:0.08, packaging:0.04 },
  coffee_instant:        { total:5.20, farming:0.65, processing:0.24, transport:0.07, packaging:0.04 },
  tea_bags:              { total:0.10, farming:0.58, processing:0.22, transport:0.12, packaging:0.08 },
  fruit_juice:           { total:0.72, farming:0.48, processing:0.26, transport:0.16, packaging:0.10 },
  soft_drink_can:        { total:0.44, farming:0.18, processing:0.32, transport:0.20, packaging:0.30 },
  beer_can:              { total:0.74, farming:0.38, processing:0.28, transport:0.18, packaging:0.16 },
  wine_bottle:           { total:1.40, farming:0.42, processing:0.24, transport:0.20, packaging:0.14 },
  water_plastic:         { total:0.16, farming:0.00, processing:0.28, transport:0.40, packaging:0.32 },
  olive_oil:             { total:3.50, farming:0.60, processing:0.22, transport:0.12, packaging:0.06 },
  sunflower_oil:         { total:2.80, farming:0.58, processing:0.24, transport:0.12, packaging:0.06 },
  sugar:                 { total:0.60, farming:0.52, processing:0.30, transport:0.10, packaging:0.08 },
  unknown:               { total:2.00, farming:0.45, processing:0.30, transport:0.15, packaging:0.10 },
};

const PNNS: Record<string, string> = {
  "Meat":"processed_meat","Processed meat":"processed_meat","Fish and seafood":"fish_wild",
  "Milk and dairy products":"milk_whole","Eggs":"eggs",
  "Cereals and potatoes":"breakfast_cereal","Bread":"bread_white","Pasta":"pasta_dry",
  "Fruits":"fruit_local","Vegetables":"vegetables_local","Legumes":"beans_dried",
  "Beverages":"soft_drink_can","Waters and flavored waters":"water_plastic",
  "Fruit juices and nectars":"fruit_juice","Salty snacks":"crisps_chips",
  "Biscuits and cakes":"biscuits_cookies","Chocolate products":"chocolate_milk",
  "One dish meals":"ready_meal","Sandwiches":"ready_meal",
  "Pizza pies and quiches":"pizza_frozen","Fats":"olive_oil",
  "Sugary snacks":"biscuits_cookies","Sweetened beverages":"soft_drink_can",
};

const KW: { kw: string[]; key: string }[] = [
  { kw:["oat milk","oat drink"],                              key:"oat_milk" },
  { kw:["soy milk","soya milk","soy drink"],                  key:"soy_milk" },
  { kw:["almond milk","almond drink"],                        key:"almond_milk" },
  { kw:["rice milk","rice drink"],                            key:"rice_milk" },
  { kw:["beef","steak","mince","burger patty","ground beef"], key:"beef" },
  { kw:["lamb","mutton"],                                     key:"lamb" },
  { kw:["pork","bacon","ham","sausage"],                      key:"pork" },
  { kw:["chicken","poultry","turkey"],                        key:"chicken" },
  { kw:["salmon","trout","tuna farmed"],                      key:"fish_farmed" },
  { kw:["cod","haddock","tuna","sardine","mackerel"],         key:"fish_wild" },
  { kw:["shrimp","prawn"],                                    key:"shrimp" },
  { kw:["skim milk","semi-skimmed","skimmed milk"],           key:"milk_skim" },
  { kw:["whole milk","full fat milk"],                        key:"milk_whole" },
  { kw:["cheddar","parmesan","gouda","hard cheese"],          key:"cheese_hard" },
  { kw:["brie","camembert","feta","soft cheese"],             key:"cheese_soft" },
  { kw:["butter"],                                            key:"butter" },
  { kw:["yogurt","yoghurt"],                                  key:"yogurt" },
  { kw:["ice cream"],                                         key:"ice_cream" },
  { kw:["brown rice","wholegrain rice"],                      key:"rice_brown" },
  { kw:["white rice","basmati","jasmine rice"],               key:"rice_white" },
  { kw:["wholegrain bread","whole wheat bread","rye bread"],  key:"bread_wholegrain" },
  { kw:["white bread","baguette"],                            key:"bread_white" },
  { kw:["oats","porridge","rolled oats"],                     key:"oats" },
  { kw:["potato chip","crisps","chips"],                      key:"crisps_chips" },
  { kw:["potato"],                                            key:"potatoes" },
  { kw:["greenhouse","tomato","cucumber","pepper"],           key:"vegetables_greenhouse" },
  { kw:["avocado","mango","pineapple","blueberry"],           key:"fruit_imported_boat" },
  { kw:["asparagus","green bean"],                            key:"fruit_imported_air" },
  { kw:["lentil"],                                            key:"lentils" },
  { kw:["chickpea","hummus"],                                 key:"chickpeas" },
  { kw:["tofu"],                                              key:"tofu" },
  { kw:["tempeh"],                                            key:"tempeh" },
  { kw:["bean"],                                              key:"beans_dried" },
  { kw:["ground coffee","filter coffee","espresso"],          key:"coffee_ground" },
  { kw:["instant coffee","nescafe"],                          key:"coffee_instant" },
  { kw:["tea","green tea","herbal tea"],                      key:"tea_bags" },
  { kw:["beer"],                                              key:"beer_can" },
  { kw:["wine"],                                              key:"wine_bottle" },
  { kw:["water"],                                             key:"water_plastic" },
  { kw:["dark chocolate"],                                    key:"chocolate_dark" },
  { kw:["milk chocolate","chocolate"],                        key:"chocolate_milk" },
  { kw:["olive oil"],                                         key:"olive_oil" },
  { kw:["sunflower oil","vegetable oil"],                     key:"sunflower_oil" },
  { kw:["pizza"],                                             key:"pizza_frozen" },
  { kw:["ready meal","microwave meal"],                       key:"ready_meal" },
];

const ALT_MAP: Record<string, string[]> = {
  beef:["chicken","tofu","lentils"],lamb:["pork","chicken","beans_dried"],
  pork:["chicken","tofu","lentils"],chicken:["tofu","eggs","lentils"],
  fish_wild:["tofu","lentils","vegetables_local"],fish_farmed:["tofu","lentils","chickpeas"],
  shrimp:["fish_wild","tofu","lentils"],processed_meat:["chicken","tofu","lentils"],
  milk_whole:["oat_milk","soy_milk","almond_milk"],milk_skim:["oat_milk","soy_milk","almond_milk"],
  cheese_hard:["tofu","oat_milk","lentils"],cheese_soft:["tofu","oat_milk","lentils"],
  butter:["olive_oil","sunflower_oil"],yogurt:["oat_milk","fruit_local"],
  ice_cream:["fruit_local","yogurt"],eggs:["tofu","lentils","chickpeas"],
  rice_white:["oats","bread_wholegrain","lentils"],rice_brown:["oats","bread_wholegrain","lentils"],
  pasta_dry:["lentils","oats","bread_wholegrain"],breakfast_cereal:["oats","bread_wholegrain"],
  crisps_chips:["fruit_local","vegetables_local","lentils"],biscuits_cookies:["fruit_local","oats"],
  chocolate_milk:["chocolate_dark","fruit_local"],chocolate_dark:["fruit_local","oats"],
  coffee_ground:["tea_bags"],coffee_instant:["tea_bags"],
  soft_drink_can:["water_plastic","tea_bags","fruit_juice"],
  ready_meal:["lentils","bread_wholegrain","vegetables_local"],
  pizza_frozen:["bread_wholegrain","vegetables_local","lentils"],
  unknown:["vegetables_local","lentils","oats"],
};

// ─── Calc functions ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveKey(prod: any) {
  const s = [prod.product_name||"",prod.pnns_groups_1||"",prod.pnns_groups_2||"",(prod.categories_tags||[]).join(" ")].join(" ").toLowerCase();
  for (const r of KW) if (r.kw.some(k => s.includes(k))) return { key:r.key, method:"keyword" };
  if (PNNS[prod.pnns_groups_1||""]) return { key:PNNS[prod.pnns_groups_1], method:"pnns" };
  return { key:"unknown", method:"fallback" };
}

function parseWeightG(qty?: string, srv?: string): number | null {
  const s = (qty||srv||"").toLowerCase().trim(); if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|l|kg)/);
  if (m) { const u = m[3]==="kg"||m[3]==="l"?parseFloat(m[2])*1000:parseFloat(m[2]); return parseFloat(m[1])*u; }
  const n = s.match(/(\d+(?:\.\d+)?)\s*(g|ml|l|kg|oz|lb)/);
  if (n) { const v=parseFloat(n[1]); if(n[2]==="kg"||n[2]==="l") return v*1000; if(n[2]==="oz") return v*28.35; if(n[2]==="lb") return v*453.6; return v; }
  return null;
}

function gradeInfo(co2PerKg: number) {
  if (co2PerKg < 1.0) return { grade:"A", label:"Low impact",       color:"#16a34a", bg:"#f0fdf4" };
  if (co2PerKg < 2.5) return { grade:"B", label:"Below average",    color:"#65a30d", bg:"#f7fee7" };
  if (co2PerKg < 5.0) return { grade:"C", label:"Moderate impact",  color:"#d97706", bg:"#fffbeb" };
  if (co2PerKg <10.0) return { grade:"D", label:"High impact",      color:"#ea580c", bg:"#fff7ed" };
  return                      { grade:"F", label:"Very high impact", color:"#dc2626", bg:"#fef2f2" };
}

function getAlts(key: string) {
  const cur = F[key]||F["unknown"];
  return (ALT_MAP[key]||ALT_MAP["unknown"]).map(k => {
    const f=F[k]; const sv=cur.total-f.total;
    return { key:k, label:k.replace(/_/g," "), co2PerKg:f.total, savingPerKg:+sv.toFixed(2), savingPct:Math.round((sv/cur.total)*100) };
  }).filter(a=>a.savingPerKg>0).sort((a,b)=>b.savingPerKg-a.savingPerKg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResult(prod: any): CarbonResult {
  const { key, method } = resolveKey(prod);
  const factor = F[key]||F["unknown"];
  const wG = parseWeightG(prod.quantity, prod.serving_size);
  const wKg = wG ? wG/1000 : 1.0;
  const total = +(factor.total*wKg).toFixed(3);
  const bd = {
    farming:    +(factor.total*factor.farming*wKg).toFixed(3),
    processing: +(factor.total*factor.processing*wKg).toFixed(3),
    transport:  +(factor.total*factor.transport*wKg).toFixed(3),
    packaging:  +(factor.total*factor.packaging*wKg).toFixed(3),
  };
  const gi = gradeInfo(factor.total);
  const conf = Math.min(0.40+(method==="keyword"?0.30:method==="pnns"?0.15:0)+(wG?0.15:0)+(prod.ecoscore_score?0.15:0), 1.0);
  return {
    productName: prod.product_name||"Unknown product", brand:prod.brands||"", quantity:prod.quantity||"",
    weightGrams:wG, agriKey:key, method,
    co2eTotal:total, co2ePerKg:factor.total, unit:wG?"per package":"per kg",
    breakdown:bd, grade:gi.grade, gradeLabel:gi.label, gradeColor:gi.color, gradeBg:gi.bg,
    confidence:conf, isEstimate:method==="fallback",
    kmDriving:+(total/0.158).toFixed(1), cupsOfTea:Math.round(total/0.003),
    alternatives:getAlts(key),
  };
}

function genTips(r: CarbonResult): string[] {
  const tips: string[] = [];
  if (r.grade==="A") tips.push(`Excellent pick. At ${r.co2ePerKg.toFixed(2)} kg CO₂e/kg this is one of the lowest-impact options available.`);
  else if (r.grade==="F"||r.grade==="D") tips.push(`High-impact product. Swapping once a week to a plant-based option could save ~${(r.co2eTotal*52*0.7).toFixed(0)} kg CO₂ per year.`);
  tips.push(`Equivalent to driving ${r.kmDriving} km, or ${r.cupsOfTea} cups of tea.`);
  if (r.alternatives.length>0) tips.push(`Best swap: ${r.alternatives[0].label} — saves ${r.alternatives[0].savingPerKg.toFixed(1)} kg CO₂e/kg (${r.alternatives[0].savingPct}% less).`);
  if (r.isEstimate) tips.push("Estimate based on food category — actual footprint may vary by brand and origin.");
  return tips.slice(0,3);
}

// ─── Demo products ────────────────────────────────────────────────────────────
const DEMOS = [
  { barcode:"3017620425035", label:"Nutella 750g",             icon:"coffee", hint:"chocolate spread" },
  { barcode:"5000112638022", label:"Oatly oat drink 1L",       icon:"leaf",   hint:"plant milk" },
  { barcode:"0041196894186", label:"Heinz baked beans 398g",   icon:"bowl",   hint:"legumes" },
  { barcode:"0028400028363", label:"Lay's potato chips 200g",  icon:"fork",   hint:"snack" },
  { barcode:"7613036474306", label:"Nescafe Gold 200g",        icon:"coffee", hint:"coffee" },
];

const HIST_KEY = "uofa_scan_history_v1";

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  barcode: "M2 6h1v12H2zM5 4h1v16H5zM8 4h2v16H8zM12 6h1v12h-1zM15 4h1v16h-1zM18 4h2v16h-2z",
  camera:  "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  history: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  leaf:    "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  drop:    "M12 22a6 6 0 0 0 6-6c0-4-6-12-6-12S6 12 6 16a6 6 0 0 0 6 6z",
  fork:    "M3 2v7c0 2.21 1.79 4 4 4v9M13 2v20M19 2c0 3.31-1.79 6-4 9v9",
  bowl:    "M6 12h12M8 20h8M12 4v3M5 12a7 7 0 0 0 14 0",
  coffee:  "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3",
  meat:    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L11 6.67 9.94 5.61a5.5 5.5 0 0 0-7.78 7.78L3.22 14.45 12 23.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6 6 18M6 6l12 12",
  back:    "M19 12H5M12 5l-7 7 7 7",
  plus:    "M12 5v14M5 12h14",
  next:    "M5 12h14M12 5l7 7-7 7",
  info:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4",
  bolt:    "M13 2L3 14h9l-1 8 10-12h-9z",
  car:     "M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M14 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M2 17h4M18 17h4M3 11l2-5h14l2 5M3 11h18",
  trash:   "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
};

function Ico({ name, size=18, color }: { name:string; size?:number; color?:string }) {
  const d = ICONS[name]; if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color??"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ display:"block", flexShrink:0 }}>
      <path d={d} />
    </svg>
  );
}

function GradeRing({ grade, co2, color, bg }: { grade:string; co2:number; color:string; bg:string }) {
  return (
    <div style={{ width:64, height:64, borderRadius:"50%", border:`3px solid ${color}`, background:bg,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <div style={{ fontSize:15, fontWeight:800, color, lineHeight:1, letterSpacing:"-0.5px" }}>{grade}</div>
      <div style={{ fontSize:10, fontWeight:700, color, lineHeight:1, marginTop:3 }}>{co2.toFixed(2)}</div>
      <div style={{ fontSize:7.5, color:"#9ca3af", marginTop:1, fontWeight:500 }}>kg CO₂e</div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --green: #16a34a; --green-light: #f0fdf4; --green-mid: #bbf7d0;
  --ink: #111827; --sub: #374151; --muted: #9ca3af;
  --border: #e5e7eb; --surface: #f9fafb; --white: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.scanner-shell {
  min-height: 100svh; background: var(--surface); color: var(--ink);
  max-width: 480px; margin: 0 auto; display: flex; flex-direction: column;
  padding-bottom: 68px;
}

.scan-header {
  position: sticky; top: 0; z-index: 10;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0 16px; height: 52px; display: flex; align-items: center; gap: 10px;
}
.scan-header-title { font-size: 15px; font-weight: 700; color: var(--ink); letter-spacing: -0.2px; flex: 1; }
.header-icon-btn { width: 34px; height: 34px; border-radius: 9px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--sub); transition: background 0.12s; }
.header-icon-btn:hover { background: var(--green-light); color: var(--green); border-color: var(--green-mid); }

.camera-area {
  position: relative; background: #0c0c0c; overflow: hidden;
  width: 100%; aspect-ratio: 4/3; max-height: 240px;
  display: flex; align-items: center; justify-content: center;
}
.camera-area video { width: 100%; height: 100%; object-fit: cover; display: block; }
.scan-corner { position: absolute; width: 22px; height: 22px; border-color: #16a34a; border-style: solid; border-width: 0; }
.sc-tl { top: 16px; left: 16px; border-top-width: 3px; border-left-width: 3px; border-radius: 3px 0 0 0; }
.sc-tr { top: 16px; right: 16px; border-top-width: 3px; border-right-width: 3px; border-radius: 0 3px 0 0; }
.sc-bl { bottom: 16px; left: 16px; border-bottom-width: 3px; border-left-width: 3px; border-radius: 0 0 0 3px; }
.sc-br { bottom: 16px; right: 16px; border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 3px 0; }
.scan-line { position: absolute; left: 16px; right: 16px; height: 2px; background: #16a34a; opacity: 0.85; animation: scanAnim 2s ease-in-out infinite; }
@keyframes scanAnim { 0%,100%{top:16px;opacity:0.7} 50%{top:calc(100% - 16px);opacity:1} }
.camera-hint { color: rgba(255,255,255,0.55); font-size: 12px; text-align: center; }
.camera-start-btn {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; cursor: pointer; background: transparent; border: none;
  color: rgba(255,255,255,0.7); font-family: inherit;
}
.camera-start-btn:hover { color: white; }
.camera-badge { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.1); border-radius: 20px; padding: 3px 12px; color: rgba(255,255,255,0.6); font-size: 10px; white-space: nowrap; letter-spacing: 0.3px; }

.page-body { padding: 16px; flex: 1; }

.input-row { display: flex; gap: 8px; margin-bottom: 20px; }
.barcode-input {
  flex: 1; height: 42px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px;
  font-size: 14px; font-family: inherit; color: var(--ink); background: white; outline: none;
  transition: border-color 0.15s;
}
.barcode-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
.barcode-input::placeholder { color: var(--muted); }
.scan-submit-btn {
  height: 42px; padding: 0 16px; border-radius: 10px; background: var(--green); border: none;
  color: white; font-size: 13px; font-weight: 700; cursor: pointer; display: flex;
  align-items: center; gap: 6px; font-family: inherit; transition: background 0.12s;
  white-space: nowrap;
}
.scan-submit-btn:hover { background: #15803d; }

.section-label { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }

.demo-list { display: flex; flex-direction: column; gap: 7px; }
.demo-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: white; border: 1px solid var(--border); border-radius: 12px;
  cursor: pointer; transition: all 0.12s;
}
.demo-row:hover { border-color: var(--green); background: var(--green-light); }
.demo-icon { width: 34px; height: 34px; border-radius: 9px; background: var(--surface); display: flex; align-items: center; justify-content: center; color: var(--sub); flex-shrink: 0; }
.demo-name { font-size: 13px; font-weight: 600; color: var(--ink); flex: 1; }
.demo-hint { font-size: 11px; color: var(--muted); }
.demo-arrow { color: var(--muted); }

.result-page { padding: 16px; animation: fadeUp 0.2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }

.product-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
.product-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.product-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.product-title { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.35; letter-spacing: -0.2px; }
.product-meta { font-size: 11px; color: var(--muted); margin-top: 3px; }

.score-row { display: flex; align-items: center; gap: 14px; }
.score-info { flex: 1; }
.score-grade-line { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
.score-desc { font-size: 12px; color: var(--muted); line-height: 1.45; }
.score-conf { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 10px; font-weight: 600; color: var(--muted); background: var(--surface); padding: 2px 8px; border-radius: 20px; border: 1px solid var(--border); }

.breakdown-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
.card-title { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
.bd-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
.bd-row:last-child { margin-bottom: 0; }
.bd-label { font-size: 11px; color: var(--sub); width: 70px; flex-shrink: 0; font-weight: 500; }
.bd-track { flex: 1; height: 5px; background: var(--surface); border-radius: 3px; overflow: hidden; }
.bd-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.bd-val { font-size: 11px; font-weight: 700; color: var(--ink); width: 48px; text-align: right; flex-shrink: 0; }

.alts-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
.alt-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 7px; }
.alt-row:last-child { margin-bottom: 0; }
.alt-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--green-light); display: flex; align-items: center; justify-content: center; color: var(--green); flex-shrink: 0; }
.alt-name { font-size: 12px; font-weight: 600; color: var(--ink); flex: 1; text-transform: capitalize; }
.alt-save { font-size: 10px; font-weight: 700; color: var(--green); background: var(--green-light); padding: 2px 8px; border-radius: 20px; white-space: nowrap; }

.log-btn { width: 100%; padding: 14px; background: var(--green); color: white; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; transition: background 0.12s; letter-spacing: -0.2px; }
.log-btn:hover { background: #15803d; }

.logged-page { padding: 24px 16px; display: flex; flex-direction: column; align-items: center; text-align: center; animation: fadeUp 0.2s ease; }
.logged-check { width: 64px; height: 64px; border-radius: 50%; background: var(--green-light); display: flex; align-items: center; justify-content: center; color: var(--green); margin-bottom: 14px; }
.logged-title { font-size: 18px; font-weight: 800; color: var(--ink); margin-bottom: 4px; letter-spacing: -0.4px; }
.logged-sub { font-size: 13px; color: var(--muted); margin-bottom: 22px; }
.tips-card { width: 100%; background: white; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; text-align: left; margin-bottom: 14px; }
.tip-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
.tip-row:last-child { margin-bottom: 0; }
.tip-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--green-light); display: flex; align-items: center; justify-content: center; color: var(--green); flex-shrink: 0; margin-top: 1px; }
.tip-text { font-size: 12px; color: var(--sub); line-height: 1.6; }

.scan-again-btn { width: 100%; padding: 13px; background: white; color: var(--ink); border: 1.5px solid var(--border); border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; transition: all 0.12s; }
.scan-again-btn:hover { border-color: var(--green); color: var(--green); background: var(--green-light); }

.loading-page { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-page { padding: 32px 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; animation: fadeUp 0.2s ease; }
.error-icon { width: 56px; height: 56px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; color: #dc2626; }
.error-title { font-size: 16px; font-weight: 700; color: var(--ink); }
.error-msg { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 320px; }

.history-page { padding: 16px; animation: fadeUp 0.2s ease; }
.hist-empty { text-align: center; padding: 48px 0; color: var(--muted); font-size: 14px; }
.hist-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; }
.hist-grade { width: 36px; height: 36px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.hist-info { flex: 1; min-width: 0; }
.hist-name { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
.hist-co2 { font-size: 12px; font-weight: 700; }

.bottom-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; z-index: 20;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(14px);
  border-top: 1px solid var(--border); display: flex;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.nav-tab { flex: 1; padding: 10px 4px 12px; display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; color: var(--muted); transition: color 0.15s; font-family: inherit; }
.nav-tab.active { color: var(--green); }
.nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2px; }
.nav-indicator { width: 4px; height: 4px; border-radius: 50%; background: var(--green); margin-top: 2px; opacity: 0; }
.nav-tab.active .nav-indicator { opacity: 1; }

.camera-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #dc2626; margin-bottom: 14px; }
`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function BarcodeScannerPage() {
  const [screen, setScreen]           = useState<Screen>("scan");
  const [result, setResult]           = useState<CarbonResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [manualInput, setManualInput] = useState("");
  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [canDetect, setCanDetect]     = useState(false);
  const [activeTab, setActiveTab]     = useState<"scan"|"history">("scan");

  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(HIST_KEY); if (raw) setHistory(JSON.parse(raw)); } catch {}
    setCanDetect(typeof window !== "undefined" && "BarcodeDetector" in window);
    // Preload Inter font
    const link = document.createElement("link");
    link.rel="stylesheet"; link.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { return () => stopCamera(); }, []);

  const stopCamera = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!canDetect) { setCameraError("Barcode scanning requires Chrome on Android. Use the barcode input below."); return; }
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment", width:{ideal:1280} } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats:["ean_13","ean_8","upc_a","upc_e","code_128","code_39"] });
      setCameraActive(true);
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || processingRef.current) return;
        try {
          const hits = await detector.detect(videoRef.current);
          if (hits.length > 0) { processingRef.current = true; stopCamera(); await handleBarcode(hits[0].rawValue); processingRef.current = false; }
        } catch {}
      }, 400);
    } catch {
      setCameraError("Camera access denied. Use the barcode input below instead.");
    }
  };

  const handleBarcode = async (raw: string) => {
    const bc = raw.trim().replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(bc)) {
      setErrorMsg(`"${bc}" is not a valid barcode. Enter 8–14 digits.`);
      setScreen("error"); return;
    }
    setScreen("loading");
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${bc}.json?fields=product_name,brands,quantity,serving_size,pnns_groups_1,pnns_groups_2,categories_tags,packaging_tags,ecoscore_score`;
      const res = await fetch(url, { headers:{"User-Agent":"UAlbertaSustainability/1.0"} });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setErrorMsg(`Product not found for barcode ${bc}. It may not be in Open Food Facts yet.`);
        setScreen("error"); return;
      }
      setResult(buildResult(data.product));
      setScreen("result");
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setScreen("error");
    }
  };

  const handleLog = () => {
    if (!result) return;
    const entry: HistoryEntry = { productName:result.productName, co2eTotal:result.co2eTotal, grade:result.grade, gradeColor:result.gradeColor, scannedAt:Date.now() };
    const next = [entry, ...history].slice(0, 60);
    setHistory(next);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch {}
    setScreen("logged");
  };

  const reset = () => { setResult(null); setErrorMsg(""); setManualInput(""); setScreen("scan"); setActiveTab("scan"); };

  const tips = result ? genTips(result) : [];
  const tipIcons = ["info","car","leaf"];

  return (
    <>
      <style>{CSS}</style>
      <div className="scanner-shell">

        {/* Header */}
        <header className="scan-header">
          {(screen==="result"||screen==="logged"||screen==="error") ? (
            <button className="header-icon-btn" onClick={reset} aria-label="Back">
              <Ico name="back" size={16} />
            </button>
          ) : (
            <Link href="/" className="header-icon-btn" style={{ textDecoration:"none" }} aria-label="Home">
              <Ico name="home" size={16} />
            </Link>
          )}
          <span className="scan-header-title">
            {screen==="result" ? "Scan result" : screen==="logged" ? "Logged" : screen==="history" ? "Scan history" : "Carbon scanner"}
          </span>
          {(screen==="scan"||screen==="history") && (
            <button className="header-icon-btn" onClick={()=>{setActiveTab(activeTab==="history"?"scan":"history");setScreen(activeTab==="history"?"scan":"history");}} aria-label="History">
              <Ico name={activeTab==="history"?"barcode":"history"} size={16} />
            </button>
          )}
        </header>

        {/* ── SCAN screen ─────────────────────────────────────────────────── */}
        {screen==="scan" && (
          <>
            {/* Camera area */}
            <div className="camera-area">
              <div className="scan-corner sc-tl" />
              <div className="scan-corner sc-tr" />
              <div className="scan-corner sc-bl" />
              <div className="scan-corner sc-br" />
              {cameraActive ? (
                <>
                  <video ref={videoRef} muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
                  <div className="scan-line" />
                  <button className="header-icon-btn" style={{position:"absolute",top:10,right:10,zIndex:5,background:"rgba(0,0,0,0.5)",borderColor:"rgba(255,255,255,0.2)",color:"white"}} onClick={stopCamera} aria-label="Stop camera">
                    <Ico name="x" size={14} color="white" />
                  </button>
                </>
              ) : (
                <>
                  <button className="camera-start-btn" onClick={startCamera} aria-label="Start camera">
                    <Ico name="camera" size={32} color="rgba(255,255,255,0.5)" />
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Tap to scan with camera</span>
                  </button>
                  <div className="scan-line" />
                  <div className="camera-badge">or enter barcode below</div>
                </>
              )}
            </div>

            <div className="page-body">
              {cameraError && <div className="camera-error">{cameraError}</div>}

              {/* Manual input */}
              <div className="input-row">
                <input
                  className="barcode-input" type="text" inputMode="numeric"
                  value={manualInput} onChange={e=>setManualInput(e.target.value)}
                  placeholder="Enter barcode (8–14 digits)"
                  onKeyDown={e=>e.key==="Enter"&&manualInput.trim()&&handleBarcode(manualInput)}
                />
                <button className="scan-submit-btn" onClick={()=>manualInput.trim()&&handleBarcode(manualInput)} disabled={!manualInput.trim()}>
                  <Ico name="next" size={14} color="white" /> Look up
                </button>
              </div>

              {/* Demo products */}
              <div className="section-label">Try these barcodes</div>
              <div className="demo-list">
                {DEMOS.map(d => (
                  <button key={d.barcode} className="demo-row" onClick={()=>handleBarcode(d.barcode)}>
                    <div className="demo-icon"><Ico name={d.icon} size={16} /></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="demo-name">{d.label}</div>
                      <div className="demo-hint">{d.barcode}</div>
                    </div>
                    <div className="demo-arrow"><Ico name="next" size={14} /></div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── LOADING screen ──────────────────────────────────────────────── */}
        {screen==="loading" && (
          <div className="loading-page">
            <div className="spinner" />
            <div style={{fontSize:13,fontWeight:600,color:"var(--sub)"}}>Looking up product...</div>
            <div style={{fontSize:11,color:"var(--muted)"}}>Open Food Facts + Agribalyse</div>
          </div>
        )}

        {/* ── RESULT screen ───────────────────────────────────────────────── */}
        {screen==="result" && result && (
          <div className="result-page">
            {/* Product card */}
            <div className="product-card">
              <div className="product-row">
                <div className="product-icon-wrap" style={{background:result.gradeBg}}>
                  <Ico name={
                    result.agriKey.includes("milk")||result.agriKey.includes("dairy") ? "drop" :
                    result.agriKey.includes("beef")||result.agriKey.includes("meat")||result.agriKey.includes("chicken")||result.agriKey.includes("pork")||result.agriKey.includes("fish") ? "meat" :
                    result.agriKey.includes("coffee") ? "coffee" :
                    result.agriKey.includes("vegetable")||result.agriKey.includes("fruit")||result.agriKey.includes("leaf") ? "leaf" :
                    "package"
                  } size={22} color={result.gradeColor} />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="product-title">{result.productName}</div>
                  <div className="product-meta">
                    {[result.brand, result.quantity].filter(Boolean).join(" · ")}
                    {result.isEstimate && <span style={{marginLeft:4,color:"#d97706",fontWeight:600}}> · estimate</span>}
                  </div>
                </div>
              </div>

              <div className="score-row">
                <GradeRing grade={result.grade} co2={result.co2eTotal} color={result.gradeColor} bg={result.gradeBg} />
                <div className="score-info">
                  <div className="score-grade-line" style={{color:result.gradeColor}}>
                    Grade {result.grade} — {result.gradeLabel}
                  </div>
                  <div className="score-desc">
                    {result.co2ePerKg.toFixed(2)} kg CO₂e per kg · {result.unit}
                  </div>
                  <div className="score-desc" style={{marginTop:3}}>
                    Equiv. to driving {result.kmDriving} km
                  </div>
                  <div className="score-conf">
                    <Ico name="info" size={10} />
                    {(result.confidence*100).toFixed(0)}% confidence
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="breakdown-card">
              <div className="card-title">Emission sources</div>
              {(["farming","processing","transport","packaging"] as const).map((k,i) => {
                const val = result.breakdown[k];
                const pct = result.co2eTotal>0 ? (val/result.co2eTotal)*100 : 0;
                const colors = ["#16a34a","#0ea5e9","#f59e0b","#6366f1"];
                return (
                  <div key={k} className="bd-row">
                    <span className="bd-label" style={{textTransform:"capitalize"}}>{k}</span>
                    <div className="bd-track">
                      <div className="bd-fill" style={{width:`${pct}%`, background:colors[i]}} />
                    </div>
                    <span className="bd-val">{val.toFixed(3)} kg</span>
                  </div>
                );
              })}
            </div>

            {/* Alternatives */}
            {result.alternatives.length>0 && (
              <div className="alts-card">
                <div className="card-title">Greener alternatives</div>
                {result.alternatives.slice(0,3).map(a => (
                  <div key={a.key} className="alt-row">
                    <div className="alt-icon"><Ico name="leaf" size={15} /></div>
                    <span className="alt-name">{a.label}</span>
                    <span className="alt-save">−{a.savingPerKg.toFixed(1)} kg ({a.savingPct}%)</span>
                  </div>
                ))}
              </div>
            )}

            <button className="log-btn" onClick={handleLog}>
              <Ico name="plus" size={16} color="white" />
              Log to my tracker
            </button>
          </div>
        )}

        {/* ── LOGGED screen ───────────────────────────────────────────────── */}
        {screen==="logged" && result && (
          <div className="logged-page">
            <div className="logged-check"><Ico name="check" size={28} /></div>
            <div className="logged-title">Logged!</div>
            <div className="logged-sub">Added {result.co2eTotal.toFixed(3)} kg CO₂e to your food tracker</div>

            <div className="tips-card">
              <div className="section-label" style={{marginBottom:12}}>Impact insights</div>
              {tips.map((t, i) => (
                <div key={i} className="tip-row">
                  <div className="tip-icon"><Ico name={tipIcons[i]||"info"} size={13} /></div>
                  <span className="tip-text">{t}</span>
                </div>
              ))}
            </div>

            <button className="scan-again-btn" onClick={reset}>
              <Ico name="barcode" size={16} />
              Scan another product
            </button>
          </div>
        )}

        {/* ── ERROR screen ─────────────────────────────────────────────────── */}
        {screen==="error" && (
          <div className="error-page">
            <div className="error-icon"><Ico name="x" size={26} color="#dc2626" /></div>
            <div className="error-title">Product not found</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="log-btn" style={{maxWidth:280}} onClick={reset}>
              Try again
            </button>
          </div>
        )}

        {/* ── HISTORY screen ──────────────────────────────────────────────── */}
        {screen==="history" && (
          <div className="history-page">
            {history.length===0 ? (
              <div className="hist-empty">
                <Ico name="history" size={32} color="var(--muted)" />
                <div style={{marginTop:12}}>No scans yet — scan a product to get started.</div>
              </div>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div className="section-label" style={{margin:0}}>{history.length} scan{history.length!==1?"s":""}</div>
                  <button style={{fontSize:11,color:"var(--muted)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}
                    onClick={()=>{setHistory([]);localStorage.removeItem(HIST_KEY);}}>
                    <Ico name="trash" size={12} /> Clear
                  </button>
                </div>
                {history.map((h,i) => (
                  <div key={i} className="hist-row">
                    <div className="hist-grade" style={{borderColor:h.gradeColor,color:h.gradeColor,background:h.gradeColor+"18"}}>
                      {h.grade}
                    </div>
                    <div className="hist-info">
                      <div className="hist-name">{h.productName}</div>
                      <div className="hist-meta">{new Date(h.scannedAt).toLocaleDateString("en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                    <div className="hist-co2" style={{color:h.gradeColor}}>{h.co2eTotal.toFixed(3)} kg</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <button className={`nav-tab ${activeTab==="scan"?"active":""}`} onClick={()=>{setActiveTab("scan");if(screen!=="result"&&screen!=="logged"&&screen!=="error")setScreen("scan");}}>
            <Ico name="barcode" size={20} />
            <span className="nav-label">Scan</span>
            <div className="nav-indicator" />
          </button>
          <button className={`nav-tab ${activeTab==="history"?"active":""}`} onClick={()=>{setActiveTab("history");setScreen("history");}}>
            <Ico name="history" size={20} />
            <span className="nav-label">History</span>
            <div className="nav-indicator" />
          </button>
        </nav>

      </div>
    </>
  );
}
