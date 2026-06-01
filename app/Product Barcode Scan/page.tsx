"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  agriKey: string; method: string; isCanadian: boolean;
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

// ─── EXPANDED Emission Factors (kg CO₂e / kg product) ────────────────────────
const F: Record<string, Factor> = {
  // ── CANADIAN-SPECIFIC OVERRIDES ──────────────────────────────────────────
  ca_beef:              { total:22.0, farming:0.82, processing:0.08, transport:0.05, packaging:0.05 },
  ca_dairy_milk:        { total:0.95, farming:0.70, processing:0.16, transport:0.08, packaging:0.06 },
  ca_pork:              { total:6.2,  farming:0.70, processing:0.14, transport:0.09, packaging:0.07 },
  ca_chicken:           { total:4.2,  farming:0.68, processing:0.15, transport:0.10, packaging:0.07 },
  ca_canola_oil:        { total:2.1,  farming:0.55, processing:0.28, transport:0.10, packaging:0.07 },
  ca_maple_syrup:       { total:1.4,  farming:0.40, processing:0.35, transport:0.15, packaging:0.10 },
  ca_prairie_wheat:     { total:0.72, farming:0.50, processing:0.30, transport:0.12, packaging:0.08 },
  ca_bc_salmon:         { total:3.8,  farming:0.62, processing:0.20, transport:0.11, packaging:0.07 },
  ca_wild_blueberry:    { total:0.30, farming:0.52, processing:0.12, transport:0.24, packaging:0.12 },
  ca_cranberry:         { total:0.35, farming:0.50, processing:0.14, transport:0.24, packaging:0.12 },
  ca_lentils_sk:        { total:0.70, farming:0.52, processing:0.24, transport:0.14, packaging:0.10 },
  ca_canola_margarine:  { total:3.2,  farming:0.48, processing:0.32, transport:0.12, packaging:0.08 },
  ca_oats_ab:           { total:1.35, farming:0.52, processing:0.26, transport:0.12, packaging:0.10 },
  ca_processed_cheese:  { total:8.5,  farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },

  // ── RED MEAT ─────────────────────────────────────────────────────────────
  beef:                 { total:30.0, farming:0.82, processing:0.08, transport:0.06, packaging:0.04 },
  lamb:                 { total:24.5, farming:0.80, processing:0.09, transport:0.07, packaging:0.04 },
  pork:                 { total:7.6,  farming:0.72, processing:0.14, transport:0.08, packaging:0.06 },
  veal:                 { total:20.0, farming:0.80, processing:0.10, transport:0.06, packaging:0.04 },
  bison:                { total:18.0, farming:0.78, processing:0.11, transport:0.06, packaging:0.05 },
  venison:              { total:10.0, farming:0.70, processing:0.14, transport:0.09, packaging:0.07 },

  // ── POULTRY ──────────────────────────────────────────────────────────────
  chicken:              { total:5.0,  farming:0.70, processing:0.14, transport:0.09, packaging:0.07 },
  turkey:               { total:6.8,  farming:0.72, processing:0.13, transport:0.09, packaging:0.06 },
  duck:                 { total:7.5,  farming:0.73, processing:0.13, transport:0.08, packaging:0.06 },

  // ── SEAFOOD ──────────────────────────────────────────────────────────────
  fish_wild:            { total:3.0,  farming:0.60, processing:0.18, transport:0.14, packaging:0.08 },
  fish_farmed:          { total:5.1,  farming:0.65, processing:0.18, transport:0.10, packaging:0.07 },
  salmon_atlantic:      { total:5.4,  farming:0.66, processing:0.18, transport:0.09, packaging:0.07 },
  tuna_canned:          { total:6.1,  farming:0.55, processing:0.22, transport:0.15, packaging:0.08 },
  shrimp:               { total:12.0, farming:0.75, processing:0.12, transport:0.08, packaging:0.05 },
  lobster:              { total:9.5,  farming:0.65, processing:0.16, transport:0.12, packaging:0.07 },
  crab:                 { total:7.5,  farming:0.60, processing:0.18, transport:0.14, packaging:0.08 },
  clams_mussels:        { total:1.5,  farming:0.45, processing:0.22, transport:0.22, packaging:0.11 },
  processed_meat:       { total:11.0, farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  deli_meat:            { total:9.5,  farming:0.65, processing:0.20, transport:0.09, packaging:0.06 },
  hot_dogs:             { total:8.5,  farming:0.62, processing:0.22, transport:0.09, packaging:0.07 },

  // ── DAIRY ────────────────────────────────────────────────────────────────
  milk_whole:           { total:1.1,  farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },
  milk_skim:            { total:0.9,  farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  milk_2pct:            { total:1.0,  farming:0.70, processing:0.17, transport:0.07, packaging:0.06 },
  cheese_hard:          { total:10.3, farming:0.73, processing:0.16, transport:0.06, packaging:0.05 },
  cheese_soft:          { total:7.2,  farming:0.70, processing:0.18, transport:0.07, packaging:0.05 },
  cheese_cottage:       { total:3.5,  farming:0.65, processing:0.20, transport:0.08, packaging:0.07 },
  cheese_cream:         { total:8.0,  farming:0.71, processing:0.17, transport:0.07, packaging:0.05 },
  yogurt:               { total:2.2,  farming:0.68, processing:0.18, transport:0.08, packaging:0.06 },
  greek_yogurt:         { total:2.8,  farming:0.70, processing:0.18, transport:0.07, packaging:0.05 },
  butter:               { total:12.1, farming:0.75, processing:0.14, transport:0.06, packaging:0.05 },
  cream:                { total:5.0,  farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },
  sour_cream:           { total:4.2,  farming:0.70, processing:0.17, transport:0.08, packaging:0.05 },
  eggs:                 { total:3.3,  farming:0.72, processing:0.14, transport:0.08, packaging:0.06 },
  ice_cream:            { total:3.8,  farming:0.55, processing:0.28, transport:0.10, packaging:0.07 },
  frozen_yogurt:        { total:2.5,  farming:0.58, processing:0.26, transport:0.09, packaging:0.07 },

  // ── PLANT MILKS ──────────────────────────────────────────────────────────
  oat_milk:             { total:0.31, farming:0.52, processing:0.28, transport:0.12, packaging:0.08 },
  soy_milk:             { total:0.28, farming:0.48, processing:0.30, transport:0.13, packaging:0.09 },
  almond_milk:          { total:0.36, farming:0.55, processing:0.25, transport:0.12, packaging:0.08 },
  rice_milk:            { total:0.54, farming:0.60, processing:0.22, transport:0.10, packaging:0.08 },
  coconut_milk:         { total:0.60, farming:0.55, processing:0.24, transport:0.13, packaging:0.08 },
  pea_milk:             { total:0.29, farming:0.48, processing:0.30, transport:0.13, packaging:0.09 },
  cashew_milk:          { total:0.32, farming:0.50, processing:0.28, transport:0.13, packaging:0.09 },

  // ── GRAINS & BREAD ───────────────────────────────────────────────────────
  bread_white:          { total:0.98, farming:0.42, processing:0.38, transport:0.10, packaging:0.10 },
  bread_wholegrain:     { total:0.96, farming:0.44, processing:0.36, transport:0.10, packaging:0.10 },
  bread_sourdough:      { total:0.90, farming:0.44, processing:0.34, transport:0.12, packaging:0.10 },
  bread_rye:            { total:0.88, farming:0.46, processing:0.32, transport:0.12, packaging:0.10 },
  bagel:                { total:1.05, farming:0.42, processing:0.38, transport:0.10, packaging:0.10 },
  tortilla_wrap:        { total:1.10, farming:0.40, processing:0.40, transport:0.10, packaging:0.10 },
  pasta_dry:            { total:1.30, farming:0.48, processing:0.32, transport:0.10, packaging:0.10 },
  pasta_fresh:          { total:1.70, farming:0.50, processing:0.30, transport:0.12, packaging:0.08 },
  rice_white:           { total:2.70, farming:0.78, processing:0.10, transport:0.07, packaging:0.05 },
  rice_brown:           { total:2.50, farming:0.76, processing:0.12, transport:0.07, packaging:0.05 },
  rice_basmati:         { total:2.90, farming:0.78, processing:0.10, transport:0.07, packaging:0.05 },
  oats:                 { total:1.60, farming:0.55, processing:0.25, transport:0.10, packaging:0.10 },
  granola:              { total:2.20, farming:0.42, processing:0.38, transport:0.10, packaging:0.10 },
  breakfast_cereal:     { total:1.80, farming:0.40, processing:0.38, transport:0.10, packaging:0.12 },
  muesli:               { total:1.50, farming:0.45, processing:0.32, transport:0.12, packaging:0.11 },
  quinoa:               { total:2.30, farming:0.62, processing:0.20, transport:0.12, packaging:0.06 },
  flour_white:          { total:0.65, farming:0.50, processing:0.30, transport:0.12, packaging:0.08 },
  flour_whole:          { total:0.60, farming:0.52, processing:0.28, transport:0.12, packaging:0.08 },
  crackers:             { total:1.90, farming:0.38, processing:0.40, transport:0.12, packaging:0.10 },
  rice_cakes:           { total:2.10, farming:0.65, processing:0.20, transport:0.09, packaging:0.06 },

  // ── LEGUMES & PLANT PROTEIN ───────────────────────────────────────────────
  lentils:              { total:0.90, farming:0.56, processing:0.22, transport:0.12, packaging:0.10 },
  chickpeas:            { total:0.86, farming:0.54, processing:0.24, transport:0.12, packaging:0.10 },
  beans_dried:          { total:0.80, farming:0.52, processing:0.26, transport:0.12, packaging:0.10 },
  beans_canned:         { total:1.20, farming:0.38, processing:0.28, transport:0.18, packaging:0.16 },
  tofu:                 { total:2.00, farming:0.48, processing:0.32, transport:0.12, packaging:0.08 },
  tempeh:               { total:2.20, farming:0.46, processing:0.34, transport:0.12, packaging:0.08 },
  edamame:              { total:1.10, farming:0.54, processing:0.22, transport:0.14, packaging:0.10 },
  peanut_butter:        { total:2.80, farming:0.50, processing:0.30, transport:0.12, packaging:0.08 },
  almond_butter:        { total:3.20, farming:0.55, processing:0.28, transport:0.10, packaging:0.07 },
  hummus:               { total:1.50, farming:0.46, processing:0.30, transport:0.14, packaging:0.10 },
  plant_burger:         { total:4.50, farming:0.52, processing:0.30, transport:0.11, packaging:0.07 },
  seitan:               { total:1.80, farming:0.44, processing:0.36, transport:0.12, packaging:0.08 },

  // ── VEGETABLES ───────────────────────────────────────────────────────────
  vegetables_local:     { total:0.20, farming:0.60, processing:0.10, transport:0.20, packaging:0.10 },
  vegetables_imported:  { total:0.50, farming:0.45, processing:0.10, transport:0.35, packaging:0.10 },
  vegetables_greenhouse:{ total:2.20, farming:0.75, processing:0.08, transport:0.10, packaging:0.07 },
  potatoes:             { total:0.46, farming:0.62, processing:0.14, transport:0.14, packaging:0.10 },
  sweet_potato:         { total:0.52, farming:0.60, processing:0.14, transport:0.16, packaging:0.10 },
  carrots:              { total:0.22, farming:0.62, processing:0.10, transport:0.18, packaging:0.10 },
  broccoli:             { total:0.42, farming:0.58, processing:0.10, transport:0.22, packaging:0.10 },
  spinach:              { total:0.34, farming:0.60, processing:0.10, transport:0.22, packaging:0.08 },
  tomatoes_fresh:       { total:1.40, farming:0.72, processing:0.08, transport:0.12, packaging:0.08 },
  tomatoes_canned:      { total:1.10, farming:0.50, processing:0.22, transport:0.16, packaging:0.12 },
  corn:                 { total:0.48, farming:0.64, processing:0.12, transport:0.14, packaging:0.10 },
  peas_frozen:          { total:0.80, farming:0.56, processing:0.22, transport:0.12, packaging:0.10 },
  mushrooms:            { total:0.58, farming:0.60, processing:0.14, transport:0.16, packaging:0.10 },
  onions:               { total:0.18, farming:0.64, processing:0.10, transport:0.16, packaging:0.10 },
  garlic:               { total:0.35, farming:0.55, processing:0.14, transport:0.20, packaging:0.11 },
  mixed_frozen_veg:     { total:0.75, farming:0.52, processing:0.22, transport:0.14, packaging:0.12 },

  // ── FRUIT ─────────────────────────────────────────────────────────────────
  fruit_local:          { total:0.25, farming:0.55, processing:0.10, transport:0.22, packaging:0.13 },
  fruit_imported_boat:  { total:0.50, farming:0.42, processing:0.08, transport:0.38, packaging:0.12 },
  fruit_imported_air:   { total:14.0, farming:0.18, processing:0.04, transport:0.72, packaging:0.06 },
  apples:               { total:0.28, farming:0.55, processing:0.10, transport:0.24, packaging:0.11 },
  bananas:              { total:0.48, farming:0.44, processing:0.08, transport:0.38, packaging:0.10 },
  oranges:              { total:0.45, farming:0.48, processing:0.10, transport:0.32, packaging:0.10 },
  strawberries:         { total:0.35, farming:0.52, processing:0.10, transport:0.26, packaging:0.12 },
  blueberries:          { total:0.32, farming:0.52, processing:0.12, transport:0.24, packaging:0.12 },
  grapes:               { total:0.62, farming:0.50, processing:0.10, transport:0.28, packaging:0.12 },
  avocado:              { total:1.60, farming:0.48, processing:0.08, transport:0.34, packaging:0.10 },
  mango:                { total:0.88, farming:0.44, processing:0.10, transport:0.36, packaging:0.10 },
  dried_fruit:          { total:2.20, farming:0.40, processing:0.32, transport:0.18, packaging:0.10 },

  // ── SNACKS & CONFECTIONERY ───────────────────────────────────────────────
  crisps_chips:         { total:3.40, farming:0.30, processing:0.46, transport:0.12, packaging:0.12 },
  popcorn:              { total:1.90, farming:0.42, processing:0.36, transport:0.12, packaging:0.10 },
  pretzels:             { total:1.80, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },
  trail_mix:            { total:2.10, farming:0.48, processing:0.28, transport:0.14, packaging:0.10 },
  biscuits_cookies:     { total:2.80, farming:0.32, processing:0.44, transport:0.12, packaging:0.12 },
  chocolate_dark:       { total:5.60, farming:0.68, processing:0.20, transport:0.07, packaging:0.05 },
  chocolate_milk:       { total:8.00, farming:0.72, processing:0.16, transport:0.07, packaging:0.05 },
  chocolate_bar:        { total:7.20, farming:0.70, processing:0.18, transport:0.07, packaging:0.05 },
  gummies_candy:        { total:2.10, farming:0.28, processing:0.44, transport:0.16, packaging:0.12 },
  energy_bar:           { total:2.50, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },
  protein_bar:          { total:3.20, farming:0.45, processing:0.34, transport:0.11, packaging:0.10 },
  granola_bar:          { total:2.30, farming:0.42, processing:0.36, transport:0.12, packaging:0.10 },
  nuts_mixed:           { total:2.50, farming:0.58, processing:0.20, transport:0.14, packaging:0.08 },
  cashews:              { total:3.20, farming:0.62, processing:0.20, transport:0.12, packaging:0.06 },
  almonds:              { total:2.20, farming:0.60, processing:0.20, transport:0.13, packaging:0.07 },

  // ── PREPARED & FROZEN ────────────────────────────────────────────────────
  pizza_frozen:         { total:2.30, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },
  ready_meal:           { total:2.80, farming:0.38, processing:0.38, transport:0.12, packaging:0.12 },
  soup_canned:          { total:1.40, farming:0.38, processing:0.30, transport:0.18, packaging:0.14 },
  soup_carton:          { total:1.20, farming:0.38, processing:0.28, transport:0.18, packaging:0.16 },
  mac_cheese:           { total:2.10, farming:0.45, processing:0.34, transport:0.12, packaging:0.09 },
  frozen_dinner:        { total:3.20, farming:0.42, processing:0.36, transport:0.12, packaging:0.10 },
  frozen_burrito:       { total:2.60, farming:0.44, processing:0.36, transport:0.10, packaging:0.10 },
  frozen_fries:         { total:1.80, farming:0.35, processing:0.40, transport:0.14, packaging:0.11 },
  canned_fish:          { total:3.20, farming:0.50, processing:0.25, transport:0.16, packaging:0.09 },
  condiments:           { total:1.60, farming:0.35, processing:0.38, transport:0.16, packaging:0.11 },
  ketchup:              { total:1.20, farming:0.48, processing:0.28, transport:0.14, packaging:0.10 },
  mayonnaise:           { total:3.80, farming:0.55, processing:0.28, transport:0.10, packaging:0.07 },
  mustard:              { total:0.80, farming:0.48, processing:0.28, transport:0.14, packaging:0.10 },
  salsa:                { total:0.90, farming:0.50, processing:0.26, transport:0.14, packaging:0.10 },
  pasta_sauce:          { total:1.05, farming:0.52, processing:0.24, transport:0.14, packaging:0.10 },

  // ── BEVERAGES ─────────────────────────────────────────────────────────────
  coffee_ground:        { total:3.50, farming:0.70, processing:0.18, transport:0.08, packaging:0.04 },
  coffee_instant:       { total:5.20, farming:0.65, processing:0.24, transport:0.07, packaging:0.04 },
  coffee_pods:          { total:6.80, farming:0.60, processing:0.22, transport:0.10, packaging:0.08 },
  tea_bags:             { total:0.10, farming:0.58, processing:0.22, transport:0.12, packaging:0.08 },
  tea_loose:            { total:0.08, farming:0.60, processing:0.18, transport:0.14, packaging:0.08 },
  fruit_juice:          { total:0.72, farming:0.48, processing:0.26, transport:0.16, packaging:0.10 },
  orange_juice:         { total:0.88, farming:0.50, processing:0.24, transport:0.16, packaging:0.10 },
  apple_juice:          { total:0.65, farming:0.48, processing:0.26, transport:0.16, packaging:0.10 },
  soft_drink_can:       { total:0.44, farming:0.18, processing:0.32, transport:0.20, packaging:0.30 },
  soft_drink_bottle:    { total:0.50, farming:0.16, processing:0.30, transport:0.22, packaging:0.32 },
  energy_drink:         { total:0.62, farming:0.18, processing:0.34, transport:0.20, packaging:0.28 },
  beer_can:             { total:0.74, farming:0.38, processing:0.28, transport:0.18, packaging:0.16 },
  beer_bottle:          { total:0.82, farming:0.36, processing:0.28, transport:0.20, packaging:0.16 },
  craft_beer:           { total:0.90, farming:0.38, processing:0.28, transport:0.18, packaging:0.16 },
  wine_bottle:          { total:1.40, farming:0.42, processing:0.24, transport:0.20, packaging:0.14 },
  spirits:              { total:2.20, farming:0.38, processing:0.38, transport:0.14, packaging:0.10 },
  water_plastic:        { total:0.16, farming:0.00, processing:0.28, transport:0.40, packaging:0.32 },
  sparkling_water:      { total:0.20, farming:0.00, processing:0.30, transport:0.38, packaging:0.32 },
  sports_drink:         { total:0.48, farming:0.16, processing:0.34, transport:0.22, packaging:0.28 },
  kombucha:             { total:0.55, farming:0.32, processing:0.34, transport:0.20, packaging:0.14 },
  protein_shake:        { total:3.50, farming:0.52, processing:0.28, transport:0.12, packaging:0.08 },

  // ── OILS, FATS & CONDIMENTS ───────────────────────────────────────────────
  olive_oil:            { total:3.50, farming:0.60, processing:0.22, transport:0.12, packaging:0.06 },
  sunflower_oil:        { total:2.80, farming:0.58, processing:0.24, transport:0.12, packaging:0.06 },
  vegetable_oil:        { total:2.60, farming:0.56, processing:0.26, transport:0.12, packaging:0.06 },
  coconut_oil:          { total:3.20, farming:0.58, processing:0.24, transport:0.12, packaging:0.06 },
  sugar:                { total:0.60, farming:0.52, processing:0.30, transport:0.10, packaging:0.08 },
  sugar_brown:          { total:0.65, farming:0.52, processing:0.30, transport:0.10, packaging:0.08 },
  honey:                { total:1.80, farming:0.55, processing:0.22, transport:0.14, packaging:0.09 },
  jam_jelly:            { total:1.20, farming:0.46, processing:0.30, transport:0.14, packaging:0.10 },
  peanut_butter_spread: { total:2.80, farming:0.50, processing:0.30, transport:0.12, packaging:0.08 },
  nutella_spread:       { total:5.50, farming:0.65, processing:0.22, transport:0.08, packaging:0.05 },
  salad_dressing:       { total:2.80, farming:0.42, processing:0.34, transport:0.14, packaging:0.10 },

  // ── BAKED GOODS ───────────────────────────────────────────────────────────
  muffin:               { total:1.80, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },
  cake_mix:             { total:2.20, farming:0.38, processing:0.40, transport:0.12, packaging:0.10 },
  pancake_mix:          { total:1.60, farming:0.42, processing:0.36, transport:0.12, packaging:0.10 },
  waffles_frozen:       { total:1.90, farming:0.40, processing:0.38, transport:0.12, packaging:0.10 },

  // ── BABY & INFANT ─────────────────────────────────────────────────────────
  baby_formula:         { total:8.50, farming:0.68, processing:0.18, transport:0.09, packaging:0.05 },
  baby_food_puree:      { total:0.90, farming:0.52, processing:0.24, transport:0.14, packaging:0.10 },
  baby_cereal:          { total:1.50, farming:0.44, processing:0.34, transport:0.12, packaging:0.10 },

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  unknown:              { total:2.00, farming:0.45, processing:0.30, transport:0.15, packaging:0.10 },
};

// ─── PNNS Group mapping ───────────────────────────────────────────────────────
const PNNS: Record<string, string> = {
  "Meat": "processed_meat", "Processed meat": "processed_meat", "Fish and seafood": "fish_wild",
  "Milk and dairy products": "milk_whole", "Eggs": "eggs",
  "Cereals and potatoes": "breakfast_cereal", "Bread": "bread_white", "Pasta": "pasta_dry",
  "Fruits": "fruit_local", "Vegetables": "vegetables_local", "Legumes": "beans_dried",
  "Beverages": "soft_drink_can", "Waters and flavored waters": "water_plastic",
  "Fruit juices and nectars": "fruit_juice", "Salty snacks": "crisps_chips",
  "Biscuits and cakes": "biscuits_cookies", "Chocolate products": "chocolate_milk",
  "One dish meals": "ready_meal", "Sandwiches": "ready_meal",
  "Pizza pies and quiches": "pizza_frozen", "Fats": "olive_oil",
  "Sugary snacks": "biscuits_cookies", "Sweetened beverages": "soft_drink_can",
};

// ─── Keyword → emission key lookup ───────────────────────────────────────────
const KW: { kw: string[]; key: string }[] = [
  { kw:["oatly","oat milk","oat drink","oat beverage"],                         key:"oat_milk" },
  { kw:["silk oat","planet oat"],                                                key:"oat_milk" },
  { kw:["soy milk","soya milk","soy drink","silk soy","westsoy"],                key:"soy_milk" },
  { kw:["almond milk","almond breeze","silk almond","almond drink"],             key:"almond_milk" },
  { kw:["rice milk","rice drink"],                                               key:"rice_milk" },
  { kw:["pea milk","ripple","bolthouse farms protein milk"],                     key:"pea_milk" },
  { kw:["cashew milk"],                                                          key:"cashew_milk" },
  { kw:["coconut milk","coconut drink"],                                         key:"coconut_milk" },
  { kw:["maple syrup","sirop d'érable","aunt jemima maple"],                    key:"ca_maple_syrup" },
  { kw:["canola oil","canola margarine","becel"],                                key:"ca_canola_oil" },
  { kw:["pc beef","president's choice beef","angus beef","ground beef","mince"], key:"ca_beef" },
  { kw:["beef","steak","boeuf","hamburger patty"],                               key:"beef" },
  { kw:["bison","buffalo burger"],                                               key:"bison" },
  { kw:["veal"],                                                                 key:"veal" },
  { kw:["venison","deer"],                                                       key:"venison" },
  { kw:["lamb","mutton","agneau"],                                               key:"lamb" },
  { kw:["bacon","prosciutto","pancetta","coppa"],                                key:"processed_meat" },
  { kw:["ham","salami","pepperoni","bologna","mortadella","pastrami"],           key:"deli_meat" },
  { kw:["hot dog","wiener","sausage","bratwurst","chorizo","kielbasa"],          key:"hot_dogs" },
  { kw:["pork chop","pork tenderloin","porc"],                                   key:"ca_pork" },
  { kw:["pork"],                                                                 key:"pork" },
  { kw:["rotisserie chicken","grilled chicken","poulet"],                        key:"ca_chicken" },
  { kw:["chicken","poultry"],                                                    key:"chicken" },
  { kw:["turkey","dinde"],                                                       key:"turkey" },
  { kw:["duck","canard"],                                                        key:"duck" },
  { kw:["atlantic salmon","bc salmon","pacific salmon","sockeye"],               key:"ca_bc_salmon" },
  { kw:["salmon","saumon"],                                                      key:"salmon_atlantic" },
  { kw:["tuna","thon","starkist","clover leaf tuna"],                            key:"tuna_canned" },
  { kw:["cod","haddock","halibut","tilapia","catfish"],                          key:"fish_wild" },
  { kw:["shrimp","prawn","crevette"],                                            key:"shrimp" },
  { kw:["lobster","homard"],                                                     key:"lobster" },
  { kw:["crab","crabe"],                                                         key:"crab" },
  { kw:["mussel","clam","oyster","moule"],                                       key:"clams_mussels" },
  { kw:["canned fish","sardine","mackerel","kippers"],                           key:"canned_fish" },
  { kw:["skim milk","skimmed milk","lait écrémé"],                              key:"milk_skim" },
  { kw:["2% milk","partly skimmed","lait 2"],                                   key:"milk_2pct" },
  { kw:["whole milk","full fat milk","lait entier","homo milk","homogenized"],   key:"milk_whole" },
  { kw:["cheddar","old cheddar","medium cheddar","balderson","cracker barrel"],  key:"ca_processed_cheese" },
  { kw:["parmesan","gouda","emmental","gruyere","hard cheese","aged cheese"],    key:"cheese_hard" },
  { kw:["brie","camembert","feta","goat cheese","fromage de chèvre"],           key:"cheese_soft" },
  { kw:["cottage cheese","fromage cottage"],                                     key:"cheese_cottage" },
  { kw:["cream cheese","philadelphia"],                                          key:"cheese_cream" },
  { kw:["butter","beurre","becel butter"],                                       key:"butter" },
  { kw:["sour cream","crème sure","crème fraîche"],                             key:"sour_cream" },
  { kw:["whipping cream","heavy cream","crème 35%"],                            key:"cream" },
  { kw:["greek yogurt","skyr","oikos","liberte greek"],                          key:"greek_yogurt" },
  { kw:["yogurt","yoghurt","yaourt","yoplait","danone"],                         key:"yogurt" },
  { kw:["ice cream","glace","haagen-daz","ben & jerry","breyers","chapmans"],    key:"ice_cream" },
  { kw:["frozen yogurt","froyo"],                                                key:"frozen_yogurt" },
  { kw:["baby formula","infant formula","similac","enfamil"],                    key:"baby_formula" },
  { kw:["baby food","baby puree","gerber","heinz baby"],                         key:"baby_food_puree" },
  { kw:["baby cereal","pablum"],                                                 key:"baby_cereal" },
  { kw:["brown rice","riz brun","wholegrain rice"],                              key:"rice_brown" },
  { kw:["basmati"],                                                              key:"rice_basmati" },
  { kw:["white rice","riz blanc","jasmine rice"],                                key:"rice_white" },
  { kw:["rye bread","pain de seigle"],                                           key:"bread_rye" },
  { kw:["sourdough","pain au levain"],                                           key:"bread_sourdough" },
  { kw:["whole wheat bread","pain de blé entier","multigrain"],                  key:"bread_wholegrain" },
  { kw:["white bread","baguette","pain blanc","wonder bread"],                   key:"bread_white" },
  { kw:["bagel"],                                                                key:"bagel" },
  { kw:["tortilla","wrap","pita"],                                               key:"tortilla_wrap" },
  { kw:["prairie oats","bob's red mill oats","quaker oats","instant oatmeal"],   key:"ca_oats_ab" },
  { kw:["oats","porridge","oatmeal","rolled oats","avoine"],                     key:"oats" },
  { kw:["granola bar","nature valley","kind bar","lara bar","cliff bar"],        key:"granola_bar" },
  { kw:["energy bar","power bar","luna bar","quest bar"],                        key:"energy_bar" },
  { kw:["protein bar","rx bar","one bar"],                                       key:"protein_bar" },
  { kw:["granola","muesli"],                                                     key:"granola" },
  { kw:["breakfast cereal","corn flakes","cheerios","special k","shreddies","vector","life cereal"], key:"breakfast_cereal" },
  { kw:["crackers","ritz","triscuit","stoned wheat"],                            key:"crackers" },
  { kw:["rice cake"],                                                            key:"rice_cakes" },
  { kw:["quinoa"],                                                               key:"quinoa" },
  { kw:["all-purpose flour","bread flour","farine"],                             key:"flour_white" },
  { kw:["whole wheat flour","whole grain flour"],                                key:"flour_whole" },
  { kw:["pasta fresh","fresh noodle"],                                           key:"pasta_fresh" },
  { kw:["pasta","spaghetti","penne","rotini","linguine","macaroni","pâtes"],     key:"pasta_dry" },
  { kw:["lentil","lentille","prairie lentil"],                                   key:"ca_lentils_sk" },
  { kw:["chickpea","pois chiche","garbanzo"],                                    key:"chickpeas" },
  { kw:["baked beans","pork & beans","heinz beans","haricots"],                  key:"beans_canned" },
  { kw:["black bean","kidney bean","navy bean","haricot"],                       key:"beans_dried" },
  { kw:["edamame"],                                                              key:"edamame" },
  { kw:["tofu","bean curd","silken tofu"],                                       key:"tofu" },
  { kw:["tempeh"],                                                               key:"tempeh" },
  { kw:["plant-based burger","beyond burger","impossible burger","veggie burger"],key:"plant_burger" },
  { kw:["seitan","wheat gluten"],                                                key:"seitan" },
  { kw:["peanut butter","beurre d'arachide","skippy","jif","kraft peanut"],      key:"peanut_butter" },
  { kw:["almond butter"],                                                        key:"almond_butter" },
  { kw:["hummus","houmous"],                                                     key:"hummus" },
  { kw:["wild blueberry","bleuet sauvage"],                                      key:"ca_wild_blueberry" },
  { kw:["cranberry","canneberge","ocean spray"],                                 key:"ca_cranberry" },
  { kw:["dried cranberry","dried blueberry","raisin","dried fruit","sultana"],   key:"dried_fruit" },
  { kw:["avocado","avocat"],                                                     key:"avocado" },
  { kw:["mango","mangue"],                                                       key:"mango" },
  { kw:["banana","banane"],                                                      key:"bananas" },
  { kw:["orange","mandarin","clementine"],                                       key:"oranges" },
  { kw:["apple","pomme","fuji","honeycrisp","gala apple","okanagan"],            key:"apples" },
  { kw:["strawberry","fraise"],                                                  key:"strawberries" },
  { kw:["blueberry","myrtille"],                                                 key:"blueberries" },
  { kw:["grape","raisin de table"],                                              key:"grapes" },
  { kw:["greenhouse tomato","vine tomato"],                                      key:"vegetables_greenhouse" },
  { kw:["tomato sauce","tomato paste","crushed tomato","tomate"],                key:"tomatoes_canned" },
  { kw:["tomato"],                                                               key:"tomatoes_fresh" },
  { kw:["sweet potato","patate douce","yam"],                                    key:"sweet_potato" },
  { kw:["potato chip","crisps","lay's","ruffles","pringles","kettle chips"],     key:"crisps_chips" },
  { kw:["french fries","frozen fries","mccain","ore-ida"],                       key:"frozen_fries" },
  { kw:["potato","patate"],                                                      key:"potatoes" },
  { kw:["carrot","carotte"],                                                     key:"carrots" },
  { kw:["broccoli","brocoli"],                                                   key:"broccoli" },
  { kw:["spinach","épinards"],                                                  key:"spinach" },
  { kw:["corn","maïs"],                                                         key:"corn" },
  { kw:["peas","petits pois"],                                                   key:"peas_frozen" },
  { kw:["mushroom","champignon"],                                                key:"mushrooms" },
  { kw:["onion","oignon"],                                                       key:"onions" },
  { kw:["garlic","ail"],                                                         key:"garlic" },
  { kw:["frozen vegetable","légumes surgelés","mixed veggie"],                  key:"mixed_frozen_veg" },
  { kw:["greenhouse","hydroponic"],                                              key:"vegetables_greenhouse" },
  { kw:["ground coffee","filter coffee","espresso","café moulu","tim hortons coffee","second cup","van houtte"], key:"coffee_ground" },
  { kw:["nespresso","k-cup","keurig pod","coffee pod","dolce gusto"],            key:"coffee_pods" },
  { kw:["instant coffee","nescafe","maxwell house"],                             key:"coffee_instant" },
  { kw:["black tea","green tea","herbal tea","chai","tetley","red rose","bigelow"],key:"tea_bags" },
  { kw:["loose leaf tea","loose tea"],                                           key:"tea_loose" },
  { kw:["orange juice","jus d'orange","tropicana","minute maid oj"],            key:"orange_juice" },
  { kw:["apple juice","jus de pomme"],                                           key:"apple_juice" },
  { kw:["fruit juice","jus de fruit","cranberry juice","grape juice"],           key:"fruit_juice" },
  { kw:["coca-cola","pepsi","dr pepper","7up","sprite","fanta","mountain dew"],  key:"soft_drink_can" },
  { kw:["pop bottle","soda bottle","litre cola"],                                key:"soft_drink_bottle" },
  { kw:["red bull","monster","rockstar energy","bang energy"],                   key:"energy_drink" },
  { kw:["sports drink","gatorade","powerade","electrolit"],                      key:"sports_drink" },
  { kw:["kombucha","gt's kombucha"],                                             key:"kombucha" },
  { kw:["protein shake","protein powder","whey protein","vega protein"],         key:"protein_shake" },
  { kw:["lager","ale","ipa","pilsner","molson","labatt","coors","budweiser","sleeman","steamwhistle"],key:"beer_can" },
  { kw:["craft beer","brewery"],                                                 key:"craft_beer" },
  { kw:["beer bottle","bière en bouteille"],                                    key:"beer_bottle" },
  { kw:["wine","vin","merlot","cabernet","chardonnay","pinot"],                  key:"wine_bottle" },
  { kw:["whisky","whiskey","rum","vodka","gin","tequila","rye whisky","canadian club","crown royal"],key:"spirits" },
  { kw:["sparkling water","san pellegrino","perrier","bubbly water"],            key:"sparkling_water" },
  { kw:["water","eau","dasani","evian","naya","montclair"],                      key:"water_plastic" },
  { kw:["dark chocolate","noir","lindt 70","chocolat noir"],                     key:"chocolate_dark" },
  { kw:["milk chocolate","chocolat au lait","kitkat","aero","caramilk","coffee crisp"],key:"chocolate_milk" },
  { kw:["chocolate bar","chocolat","smarties","m&m"],                            key:"chocolate_bar" },
  { kw:["gummy","gummies","candy","bonbon","jelly bean","skittles","starburst"], key:"gummies_candy" },
  { kw:["popcorn","maïs soufflé"],                                              key:"popcorn" },
  { kw:["pretzel"],                                                              key:"pretzels" },
  { kw:["trail mix","noix mélangées"],                                          key:"trail_mix" },
  { kw:["biscuit","cookies","oreo","chips ahoy","dare","peek freans","biscuits"],key:"biscuits_cookies" },
  { kw:["mixed nuts","cashews","almonds","walnuts","peanuts"],                   key:"nuts_mixed" },
  { kw:["cashew","noix de cajou"],                                               key:"cashews" },
  { kw:["almond","amande"],                                                      key:"almonds" },
  { kw:["olive oil","huile d'olive"],                                           key:"olive_oil" },
  { kw:["vegetable oil","huile végétale"],                                      key:"vegetable_oil" },
  { kw:["sunflower oil"],                                                        key:"sunflower_oil" },
  { kw:["coconut oil"],                                                          key:"coconut_oil" },
  { kw:["honey","miel"],                                                         key:"honey" },
  { kw:["brown sugar","sucre brun","demerara"],                                  key:"sugar_brown" },
  { kw:["sugar","sucre"],                                                        key:"sugar" },
  { kw:["jam","jelly","marmalade","confiture"],                                  key:"jam_jelly" },
  { kw:["nutella","chocolate hazelnut spread"],                                  key:"nutella_spread" },
  { kw:["peanut butter spread"],                                                 key:"peanut_butter_spread" },
  { kw:["salad dressing","vinaigrette"],                                         key:"salad_dressing" },
  { kw:["ketchup","heinz","catsup"],                                             key:"ketchup" },
  { kw:["mayonnaise","hellmann's","miracle whip"],                              key:"mayonnaise" },
  { kw:["mustard","moutarde"],                                                   key:"mustard" },
  { kw:["salsa"],                                                                key:"salsa" },
  { kw:["pasta sauce","tomato sauce","classico","prego","ragu"],                 key:"pasta_sauce" },
  { kw:["condiment","hot sauce","buffalo sauce","worcestershire"],               key:"condiments" },
  { kw:["mac and cheese","kraft dinner","kd","macaroni and cheese"],             key:"mac_cheese" },
  { kw:["soup","soupe","campbell's","lipton soup"],                             key:"soup_canned" },
  { kw:["carton soup","tetra soup","pacific soup"],                              key:"soup_carton" },
  { kw:["pizza"],                                                                key:"pizza_frozen" },
  { kw:["frozen dinner","lean cuisine","healthy choice","stouffer's"],          key:"frozen_dinner" },
  { kw:["frozen burrito","frozen wrap"],                                         key:"frozen_burrito" },
  { kw:["ready meal","microwave meal","meal kit"],                               key:"ready_meal" },
  { kw:["muffin"],                                                               key:"muffin" },
  { kw:["cake mix","betty crocker","duncan hines"],                              key:"cake_mix" },
  { kw:["pancake mix","aunt jemima pancake","bisquick"],                         key:"pancake_mix" },
  { kw:["frozen waffle","eggo"],                                                 key:"waffles_frozen" },
];

// ─── Canadian regional override map ──────────────────────────────────────────
const CA_FACTOR_MAP: Record<string, string> = {
  beef:"ca_beef", pork:"ca_pork", chicken:"ca_chicken",
  milk_whole:"ca_dairy_milk", milk_skim:"ca_dairy_milk", milk_2pct:"ca_dairy_milk",
  oats:"ca_oats_ab", lentils:"ca_lentils_sk",
  canola_oil:"ca_canola_oil", vegetable_oil:"ca_canola_oil",
};

// ─── Alternatives map ─────────────────────────────────────────────────────────
const ALT_MAP: Record<string, string[]> = {
  beef:["ca_chicken","tofu","ca_lentils_sk"], ca_beef:["ca_chicken","tofu","ca_lentils_sk"],
  lamb:["ca_pork","ca_chicken","beans_dried"], veal:["ca_chicken","tofu","lentils"],
  bison:["ca_chicken","tofu","ca_lentils_sk"],
  pork:["ca_chicken","tofu","ca_lentils_sk"], ca_pork:["ca_chicken","tofu","ca_lentils_sk"],
  chicken:["tofu","eggs","ca_lentils_sk"], ca_chicken:["tofu","eggs","ca_lentils_sk"],
  turkey:["ca_chicken","tofu","ca_lentils_sk"],
  fish_wild:["tofu","ca_lentils_sk","vegetables_local"],
  fish_farmed:["tofu","ca_lentils_sk","chickpeas"],
  salmon_atlantic:["fish_wild","tofu","ca_lentils_sk"],
  ca_bc_salmon:["fish_wild","tofu","ca_lentils_sk"],
  tuna_canned:["chickpeas","tofu","ca_lentils_sk"],
  shrimp:["fish_wild","tofu","ca_lentils_sk"],
  lobster:["fish_wild","clams_mussels","tofu"],
  processed_meat:["ca_chicken","tofu","ca_lentils_sk"],
  deli_meat:["ca_chicken","tofu","chickpeas"],
  hot_dogs:["ca_chicken","tofu","ca_lentils_sk"],
  milk_whole:["oat_milk","soy_milk","pea_milk"],
  milk_skim:["oat_milk","soy_milk","pea_milk"],
  milk_2pct:["oat_milk","soy_milk","pea_milk"],
  ca_dairy_milk:["oat_milk","soy_milk","pea_milk"],
  cheese_hard:["tofu","oat_milk","ca_lentils_sk"], ca_processed_cheese:["tofu","oat_milk","ca_lentils_sk"],
  cheese_soft:["tofu","oat_milk","ca_lentils_sk"],
  cheese_cream:["tofu","oat_milk","ca_lentils_sk"],
  butter:["ca_canola_oil","olive_oil"],
  yogurt:["oat_milk","fruit_local"], greek_yogurt:["oat_milk","fruit_local"],
  ice_cream:["fruit_local","frozen_yogurt"],
  eggs:["tofu","ca_lentils_sk","chickpeas"],
  baby_formula:["oat_milk","soy_milk"],
  rice_white:["ca_oats_ab","bread_wholegrain","ca_lentils_sk"],
  rice_brown:["ca_oats_ab","bread_wholegrain","ca_lentils_sk"],
  rice_basmati:["ca_oats_ab","quinoa","ca_lentils_sk"],
  pasta_dry:["ca_lentils_sk","ca_oats_ab","bread_wholegrain"],
  breakfast_cereal:["ca_oats_ab","bread_wholegrain"],
  granola:["ca_oats_ab","muesli"],
  crisps_chips:["fruit_local","vegetables_local","ca_lentils_sk"],
  biscuits_cookies:["fruit_local","ca_oats_ab"],
  chocolate_milk:["chocolate_dark","fruit_local"],
  chocolate_bar:["chocolate_dark","fruit_local"],
  coffee_instant:["coffee_ground","tea_bags"],
  coffee_pods:["coffee_ground","tea_bags"],
  soft_drink_can:["water_plastic","tea_bags","fruit_juice"],
  soft_drink_bottle:["water_plastic","tea_bags"],
  energy_drink:["tea_bags","water_plastic"],
  beer_can:["water_plastic","sparkling_water"],
  wine_bottle:["beer_can","sparkling_water"],
  spirits:["beer_can","wine_bottle"],
  pizza_frozen:["bread_wholegrain","vegetables_local","ca_lentils_sk"],
  ready_meal:["ca_lentils_sk","bread_wholegrain","vegetables_local"],
  frozen_dinner:["ca_lentils_sk","bread_wholegrain","vegetables_local"],
  mac_cheese:["ca_lentils_sk","pasta_dry","vegetables_local"],
  nutella_spread:["ca_maple_syrup","jam_jelly","peanut_butter"],
  unknown:["vegetables_local","ca_lentils_sk","ca_oats_ab"],
};

// ─── Canadian demo products ───────────────────────────────────────────────────
const DEMOS = [
  { barcode:"0059749876069", label:"Kraft Dinner Original 225g",  icon:"bowl",   hint:"mac & cheese" },
  { barcode:"0068200000155", label:"Red Rose Orange Pekoe Tea",    icon:"coffee", hint:"Canadian tea" },
  { barcode:"0065633170040", label:"President's Choice Oat Milk",  icon:"leaf",   hint:"plant milk" },
  { barcode:"0068700100064", label:"Heinz Ketchup 1L",             icon:"drop",   hint:"condiment" },
  { barcode:"0055742000059", label:"Oikos Greek Yogurt",           icon:"bowl",   hint:"dairy" },
  { barcode:"0065633364011", label:"PC Free From Chicken Breast",  icon:"meat",   hint:"poultry" },
  { barcode:"0074834511028", label:"Quaker Oats Large Flakes",     icon:"leaf",   hint:"Canadian oats" },
  { barcode:"0066721004069", label:"Molson Canadian Beer",         icon:"coffee", hint:"Canadian beer" },
];

const HIST_KEY = "ca_scan_history_v2";

// ─── AI resolver via Anthropic API ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveKeyAI(prod: any): Promise<{ key: string; method: string }> {
  const validKeys = Object.keys(F).join(", ");
  const productInfo = [
    prod.product_name || "",
    prod.brands || "",
    prod.categories_tags ? prod.categories_tags.slice(0, 6).join(", ") : "",
    prod.pnns_groups_1 || "",
    prod.pnns_groups_2 || "",
    prod.ingredients_text ? prod.ingredients_text.substring(0, 200) : "",
  ].filter(Boolean).join(" | ");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 80,
        system: `You are a food carbon footprint classifier. Given product information, return ONLY a raw JSON object (no markdown, no backticks) like {"key":"beef"} selecting the single best matching key from the provided list. Prefer Canadian-specific keys (prefixed ca_) when the product is clearly Canadian (Canadian brand, prairie-grown, BC seafood, etc.). Consider bilingual French-English Canadian product names.`,
        messages: [{
          role: "user",
          content: `Product info: ${productInfo}\n\nValid keys: ${validKeys}\n\nReturn ONLY JSON like {"key":"the_best_key"}`
        }]
      })
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text || "{}";
    const clean = text.replace(/```[a-z]*|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed.key && F[parsed.key]) return { key: parsed.key, method: "ai" };
  } catch { /* fall through */ }
  return { key: "unknown", method: "ai_fallback" };
}

// ─── Calc helpers ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveKeyLocal(prod: any): { key: string; method: string } {
  const s = [
    prod.product_name || "", prod.brands || "",
    prod.pnns_groups_1 || "", prod.pnns_groups_2 || "",
    (prod.categories_tags || []).join(" "),
    (prod.ingredients_text || "").substring(0, 300),
  ].join(" ").toLowerCase();

  for (const r of KW) if (r.kw.some(k => s.includes(k))) return { key: r.key, method: "keyword" };
  if (PNNS[prod.pnns_groups_1 || ""]) return { key: PNNS[prod.pnns_groups_1], method: "pnns" };
  return { key: "unknown", method: "fallback" };
}

function isCanadianProduct(prod: { countries_tags?: string[]; brands?: string }): boolean {
  const countries = (prod.countries_tags || []).join(" ").toLowerCase();
  const brand = (prod.brands || "").toLowerCase();
  const caCountries = ["canada","en:canada","world:canada","quebec","ontario","alberta","bc"];
  const caKeywords = ["president's choice","pc organics","no name","compliments","our finest","selection","great value","irresistibles"];
  return caCountries.some(c => countries.includes(c)) || caKeywords.some(k => brand.includes(k));
}

function parseWeightG(qty?: string, srv?: string): number | null {
  const s = (qty || srv || "").toLowerCase().trim();
  if (!s) return null;
  const multi = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|l|kg)/);
  if (multi) {
    const u = multi[3] === "kg" || multi[3] === "l" ? parseFloat(multi[2]) * 1000 : parseFloat(multi[2]);
    return parseFloat(multi[1]) * u;
  }
  const single = s.match(/(\d+(?:\.\d+)?)\s*(g|ml|l|kg|oz|lb)/);
  if (single) {
    const v = parseFloat(single[1]);
    if (single[2] === "kg" || single[2] === "l") return v * 1000;
    if (single[2] === "oz") return v * 28.35;
    if (single[2] === "lb") return v * 453.6;
    return v;
  }
  return null;
}

function gradeInfo(co2PerKg: number) {
  if (co2PerKg < 1.0)  return { grade:"A", label:"Low impact",       color:"#16a34a", bg:"#f0fdf4" };
  if (co2PerKg < 2.5)  return { grade:"B", label:"Below average",    color:"#65a30d", bg:"#f7fee7" };
  if (co2PerKg < 5.0)  return { grade:"C", label:"Moderate impact",  color:"#d97706", bg:"#fffbeb" };
  if (co2PerKg < 10.0) return { grade:"D", label:"High impact",      color:"#ea580c", bg:"#fff7ed" };
  return                       { grade:"F", label:"Very high impact", color:"#dc2626", bg:"#fef2f2" };
}

function getAlts(key: string) {
  const cur = F[key] || F["unknown"];
  return (ALT_MAP[key] || ALT_MAP["unknown"]).map(k => {
    const f = F[k]; const sv = cur.total - f.total;
    return { key:k, label:k.replace(/^ca_/, "🍁 ").replace(/_/g," "), co2PerKg:f.total, savingPerKg:+sv.toFixed(2), savingPct:Math.round((sv/cur.total)*100) };
  }).filter(a => a.savingPerKg > 0).sort((a,b) => b.savingPerKg - a.savingPerKg);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildResult(prod: any): Promise<CarbonResult> {
  const canadian = isCanadianProduct(prod);
  let { key, method } = resolveKeyLocal(prod);
  if (method === "fallback" || method === "pnns") {
    const aiResult = await resolveKeyAI(prod);
    if (aiResult.key !== "unknown") { key = aiResult.key; method = aiResult.method; }
  }
  if (canadian && CA_FACTOR_MAP[key]) key = CA_FACTOR_MAP[key];

  const factor = F[key] || F["unknown"];
  const wG = parseWeightG(prod.quantity, prod.serving_size);
  const wKg = wG ? wG / 1000 : 1.0;
  const total = +(factor.total * wKg).toFixed(3);
  const bd = {
    farming:    +(factor.total * factor.farming    * wKg).toFixed(3),
    processing: +(factor.total * factor.processing * wKg).toFixed(3),
    transport:  +(factor.total * factor.transport  * wKg).toFixed(3),
    packaging:  +(factor.total * factor.packaging  * wKg).toFixed(3),
  };
  const gi = gradeInfo(factor.total);
  const conf = Math.min(
    0.35 +
    (method==="ai"?0.35:method==="keyword"?0.30:method==="pnns"?0.15:0) +
    (wG?0.15:0) + (canadian?0.10:0) + (prod.ecoscore_score?0.05:0),
    1.0
  );
  return {
    productName: prod.product_name || "Unknown product",
    brand:prod.brands||"", quantity:prod.quantity||"",
    weightGrams:wG, agriKey:key, method, isCanadian:canadian,
    co2eTotal:total, co2ePerKg:factor.total, unit:wG?"per package":"per kg",
    breakdown:bd, grade:gi.grade, gradeLabel:gi.label, gradeColor:gi.color, gradeBg:gi.bg,
    confidence:conf, isEstimate:method==="fallback"||method==="ai_fallback",
    kmDriving:+(total/0.158).toFixed(1), cupsOfTea:Math.round(total/0.003),
    alternatives:getAlts(key),
  };
}

function genTips(r: CarbonResult): string[] {
  const tips: string[] = [];
  if (r.isCanadian) tips.push(`🍁 Canadian product — regional data applied. Local supply chains generally reduce transport emissions by 30–50%.`);
  if (r.grade==="A") tips.push(`Excellent pick. At ${r.co2ePerKg.toFixed(2)} kg CO₂e/kg this is one of the lowest-impact options available.`);
  else if (r.grade==="F"||r.grade==="D") tips.push(`High-impact product. Swapping once a week to a plant-based option could save ~${(r.co2eTotal*52*0.7).toFixed(0)} kg CO₂ per year.`);
  tips.push(`Equivalent to driving ${r.kmDriving} km, or boiling water for ${r.cupsOfTea} cups of tea.`);
  if (r.alternatives.length>0) tips.push(`Best swap: ${r.alternatives[0].label} — saves ${r.alternatives[0].savingPerKg.toFixed(1)} kg CO₂e/kg (${r.alternatives[0].savingPct}% less).`);
  if (r.isEstimate) tips.push("Estimate based on food category — actual footprint may vary by brand, season, and origin.");
  if (r.method==="ai") tips.push("Category identified using AI analysis for higher accuracy.");
  return tips.slice(0,3);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS: Record<string,string> = {
  barcode:"M2 6h1v12H2zM5 4h1v16H5zM8 4h2v16H8zM12 6h1v12h-1zM15 4h1v16h-1zM18 4h2v16h-2z",
  camera:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  history:"M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  leaf:"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  drop:"M12 22a6 6 0 0 0 6-6c0-4-6-12-6-12S6 12 6 16a6 6 0 0 0 6 6z",
  bowl:"M6 12h12M8 20h8M12 4v3M5 12a7 7 0 0 0 14 0",
  coffee:"M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3",
  meat:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L11 6.67 9.94 5.61a5.5 5.5 0 0 0-7.78 7.78L3.22 14.45 12 23.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  package:"M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  check:"M20 6L9 17l-5-5", x:"M18 6 6 18M6 6l12 12", back:"M19 12H5M12 5l-7 7 7 7",
  plus:"M12 5v14M5 12h14", next:"M5 12h14M12 5l7 7-7 7",
  info:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4",
  car:"M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M14 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M2 17h4M18 17h4M3 11l2-5h14l2 5M3 11h18",
  trash:"M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  maple:"M12 2l2 5h5l-4 3 1.5 5L12 12l-4.5 3L9 10 5 7h5z",
};

function Ico({name,size=18,color}:{name:string;size?:number;color?:string}) {
  const d=ICONS[name]; if(!d) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color??"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"block",flexShrink:0}}><path d={d}/></svg>;
}

function GradeRing({grade,co2,color,bg}:{grade:string;co2:number;color:string;bg:string}) {
  return (
    <div style={{width:68,height:68,borderRadius:"50%",border:`3px solid ${color}`,background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <div style={{fontSize:18,fontWeight:800,color,lineHeight:1,letterSpacing:"-0.5px"}}>{grade}</div>
      <div style={{fontSize:10,fontWeight:700,color,lineHeight:1,marginTop:3}}>{co2.toFixed(2)}</div>
      <div style={{fontSize:7.5,color:"#9ca3af",marginTop:1,fontWeight:500}}>kg CO₂e</div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#15803d;--green-2:#16a34a;--green-light:#f0fdf4;--green-mid:#bbf7d0;
  --maple:#c2410c;--maple-light:#fff7ed;--maple-mid:#fed7aa;
  --ink:#0f172a;--sub:#334155;--muted:#64748b;--faint:#94a3b8;
  --border:#e2e8f0;--surface:#f8fafc;--white:#ffffff;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04);
  font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.scanner-shell{min-height:100svh;background:var(--surface);color:var(--ink);max-width:480px;margin:0 auto;display:flex;flex-direction:column;padding-bottom:72px;position:relative}
.scanner-shell::before{content:'';position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;height:3px;background:linear-gradient(90deg,#15803d 0%,#c2410c 50%,#15803d 100%);z-index:100}
.scan-header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,0.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);padding:0 14px;height:56px;display:flex;align-items:center;gap:10px}
.header-wordmark{display:flex;align-items:center;gap:7px;flex:1}
.header-maple{font-size:18px}
.scan-header-title{font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.4px}
.header-sub{font-size:9px;font-weight:700;color:var(--faint);letter-spacing:0.5px;text-transform:uppercase;margin-top:1px}
.header-icon-btn{width:34px;height:34px;border-radius:9px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--sub);transition:all 0.12s;box-shadow:var(--shadow-sm);flex-shrink:0}
.header-icon-btn:hover{background:var(--green-light);color:var(--green);border-color:var(--green-mid)}
.camera-area{position:relative;background:#0a0a0a;overflow:hidden;width:100%;aspect-ratio:4/3;max-height:230px;display:flex;align-items:center;justify-content:center}
.camera-area video{width:100%;height:100%;object-fit:cover;display:block}
.scan-corner{position:absolute;width:20px;height:20px;border-color:#22c55e;border-style:solid;border-width:0}
.sc-tl{top:14px;left:14px;border-top-width:2.5px;border-left-width:2.5px;border-radius:3px 0 0 0}
.sc-tr{top:14px;right:14px;border-top-width:2.5px;border-right-width:2.5px;border-radius:0 3px 0 0}
.sc-bl{bottom:14px;left:14px;border-bottom-width:2.5px;border-left-width:2.5px;border-radius:0 0 0 3px}
.sc-br{bottom:14px;right:14px;border-bottom-width:2.5px;border-right-width:2.5px;border-radius:0 0 3px 0}
.scan-line{position:absolute;left:14px;right:14px;height:1.5px;background:linear-gradient(90deg,transparent,#22c55e,transparent);opacity:0.9;animation:scanAnim 2.2s ease-in-out infinite}
@keyframes scanAnim{0%,100%{top:14px;opacity:0.5}50%{top:calc(100% - 14px);opacity:1}}
.camera-start-btn{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;background:transparent;border:none;color:rgba(255,255,255,0.55);font-family:inherit}
.camera-start-btn:hover{color:rgba(255,255,255,0.85)}
.camera-badge{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:3px 12px;color:rgba(255,255,255,0.45);font-size:10px;white-space:nowrap}
.page-body{padding:14px 14px 0;flex:1}
.input-row{display:flex;gap:8px;margin-bottom:18px}
.barcode-input{flex:1;height:44px;padding:0 13px;border:1.5px solid var(--border);border-radius:11px;font-size:14px;font-family:'DM Mono',monospace;color:var(--ink);background:white;outline:none;transition:border-color 0.15s;box-shadow:var(--shadow-sm)}
.barcode-input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(21,128,61,0.1)}
.barcode-input::placeholder{font-family:'DM Sans',sans-serif;color:var(--faint);font-size:13px}
.scan-submit-btn{height:44px;padding:0 16px;border-radius:11px;background:linear-gradient(135deg,var(--green-2) 0%,var(--green) 100%);border:none;color:white;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;transition:all 0.12s;box-shadow:0 2px 8px rgba(21,128,61,0.3);white-space:nowrap}
.scan-submit-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(21,128,61,0.35)}
.scan-submit-btn:disabled{opacity:0.5;transform:none;box-shadow:none;cursor:not-allowed}
.section-label{font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px}
.demo-list{display:flex;flex-direction:column;gap:6px}
.demo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all 0.12s;box-shadow:var(--shadow-sm);font-family:inherit;text-align:left}
.demo-row:hover{border-color:var(--green);background:var(--green-light);transform:translateX(2px)}
.demo-icon{width:34px;height:34px;border-radius:9px;background:var(--surface);display:flex;align-items:center;justify-content:center;color:var(--sub);flex-shrink:0;border:1px solid var(--border)}
.demo-name{font-size:13px;font-weight:600;color:var(--ink);flex:1;line-height:1.3}
.demo-hint{font-size:10.5px;color:var(--faint);margin-top:1px}
.result-page{padding:14px;animation:fadeUp 0.22s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.product-card{background:white;border:1px solid var(--border);border-radius:16px;padding:14px;margin-bottom:10px;box-shadow:var(--shadow-sm)}
.canadian-badge{display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;background:var(--maple-light);border:1px solid var(--maple-mid);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:var(--maple);letter-spacing:0.2px}
.ai-badge{display:inline-flex;align-items:center;gap:4px;margin-bottom:8px;margin-left:6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:#1d4ed8}
.product-row{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.product-icon-wrap{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.product-title{font-size:14px;font-weight:700;color:var(--ink);line-height:1.35;letter-spacing:-0.2px}
.product-meta{font-size:11px;color:var(--faint);margin-top:3px}
.score-row{display:flex;align-items:center;gap:14px}
.score-info{flex:1}
.score-grade-line{font-size:13.5px;font-weight:800;margin-bottom:3px;letter-spacing:-0.3px}
.score-desc{font-size:12px;color:var(--muted);line-height:1.5}
.score-conf{display:inline-flex;align-items:center;gap:4px;margin-top:7px;font-size:10px;font-weight:700;color:var(--faint);background:var(--surface);padding:3px 9px;border-radius:20px;border:1px solid var(--border)}
.breakdown-card{background:white;border:1px solid var(--border);border-radius:16px;padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow-sm)}
.card-title{font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px}
.bd-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.bd-row:last-child{margin-bottom:0}
.bd-label{font-size:11px;color:var(--sub);width:74px;flex-shrink:0;font-weight:500}
.bd-track{flex:1;height:5px;background:var(--surface);border-radius:3px;overflow:hidden;border:1px solid var(--border)}
.bd-fill{height:100%;border-radius:3px;transition:width 0.7s cubic-bezier(0.34,1.56,0.64,1)}
.bd-val{font-size:11px;font-weight:700;color:var(--ink);width:52px;text-align:right;flex-shrink:0;font-family:'DM Mono',monospace}
.alts-card{background:white;border:1px solid var(--border);border-radius:16px;padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow-sm)}
.alt-row{display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:7px;transition:all 0.12s}
.alt-row:last-child{margin-bottom:0}
.alt-row:hover{border-color:var(--green-mid);background:var(--green-light)}
.alt-icon{width:32px;height:32px;border-radius:8px;background:var(--green-light);display:flex;align-items:center;justify-content:center;color:var(--green-2);flex-shrink:0}
.alt-name{font-size:12px;font-weight:600;color:var(--ink);flex:1;text-transform:capitalize}
.alt-save{font-size:10px;font-weight:700;color:var(--green);background:var(--green-light);border:1px solid var(--green-mid);padding:2px 8px;border-radius:20px;white-space:nowrap}
.log-btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--green-2) 0%,var(--green) 100%);color:white;border:none;border-radius:14px;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;transition:all 0.12s;box-shadow:0 3px 12px rgba(21,128,61,0.3);letter-spacing:-0.2px}
.log-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(21,128,61,0.35)}
.logged-page{padding:28px 16px;display:flex;flex-direction:column;align-items:center;text-align:center;animation:fadeUp 0.22s ease}
.logged-check{width:70px;height:70px;border-radius:50%;background:var(--green-light);border:2px solid var(--green-mid);display:flex;align-items:center;justify-content:center;color:var(--green-2);margin-bottom:14px}
.logged-title{font-size:20px;font-weight:800;color:var(--ink);margin-bottom:4px;letter-spacing:-0.5px}
.logged-sub{font-size:13px;color:var(--muted);margin-bottom:22px}
.tips-card{width:100%;background:white;border:1px solid var(--border);border-radius:16px;padding:14px 16px;text-align:left;margin-bottom:14px;box-shadow:var(--shadow-sm)}
.tip-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:12px}
.tip-row:last-child{margin-bottom:0}
.tip-icon{width:28px;height:28px;border-radius:8px;background:var(--green-light);display:flex;align-items:center;justify-content:center;color:var(--green-2);flex-shrink:0;margin-top:1px}
.tip-text{font-size:12px;color:var(--sub);line-height:1.65}
.scan-again-btn{width:100%;padding:14px;background:white;color:var(--ink);border:1.5px solid var(--border);border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;transition:all 0.12s;box-shadow:var(--shadow-sm)}
.scan-again-btn:hover{border-color:var(--green);color:var(--green);background:var(--green-light)}
.loading-page{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:var(--muted);min-height:300px}
.spinner{width:38px;height:38px;border:3px solid var(--border);border-top-color:var(--green);border-radius:50%;animation:spin 0.75s linear infinite}
.loading-step{font-size:12px;font-weight:600;color:var(--sub);opacity:0;animation:fadeIn 0.3s ease 0.4s forwards}
.loading-sub{font-size:11px;color:var(--faint);opacity:0;animation:fadeIn 0.3s ease 0.7s forwards}
@keyframes fadeIn{to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.error-page{padding:36px 16px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;animation:fadeUp 0.22s ease}
.error-icon{width:60px;height:60px;border-radius:50%;background:#fef2f2;border:2px solid #fecaca;display:flex;align-items:center;justify-content:center;color:#dc2626}
.error-title{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-0.3px}
.error-msg{font-size:13px;color:var(--muted);line-height:1.65;max-width:320px}
.history-page{padding:14px;animation:fadeUp 0.22s ease}
.hist-empty{text-align:center;padding:52px 0;color:var(--faint);font-size:14px}
.hist-row{display:flex;align-items:center;gap:12px;padding:12px;background:white;border:1px solid var(--border);border-radius:13px;margin-bottom:8px;box-shadow:var(--shadow-sm);transition:transform 0.1s}
.hist-row:hover{transform:translateX(2px)}
.hist-grade{width:38px;height:38px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0}
.hist-info{flex:1;min-width:0}
.hist-name{font-size:13px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hist-meta{font-size:10.5px;color:var(--faint);margin-top:2px}
.hist-co2{font-size:12px;font-weight:700;font-family:'DM Mono',monospace}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:20;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);border-top:1px solid var(--border);display:flex;padding-bottom:env(safe-area-inset-bottom,0px)}
.nav-tab{flex:1;padding:10px 4px 12px;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;color:var(--faint);transition:color 0.15s;font-family:inherit}
.nav-tab.active{color:var(--green)}
.nav-label{font-size:10px;font-weight:700;letter-spacing:0.2px}
.nav-dot{width:4px;height:4px;border-radius:50%;background:var(--green);margin-top:2px;opacity:0;transition:opacity 0.15s}
.nav-tab.active .nav-dot{opacity:1}
.camera-error{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 12px;font-size:12px;color:#dc2626;margin-bottom:14px}
`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function BarcodeScannerPage() {
  const [screen, setScreen]             = useState<Screen>("scan");
  const [result, setResult]             = useState<CarbonResult | null>(null);
  const [errorMsg, setErrorMsg]         = useState("");
  const [manualInput, setManualInput]   = useState("");
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError]   = useState("");
  const [canDetect, setCanDetect]       = useState(false);
  const [activeTab, setActiveTab]       = useState<"scan"|"history">("scan");
  const [loadingStep, setLoadingStep]   = useState("Looking up product...");

  const videoRef      = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(HIST_KEY); if (raw) setHistory(JSON.parse(raw)); } catch {}
    setCanDetect(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);
  useEffect(() => { return () => stopCamera(); }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    if (!canDetect) { setCameraError("Barcode scanning requires Chrome on Android. Use the barcode input below."); return; }
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment", width:{ ideal:1280 } } });
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
        } catch { /* continue */ }
      }, 400);
    } catch { setCameraError("Camera access denied. Use the barcode input below instead."); }
  };

  const handleBarcode = async (raw: string) => {
    const bc = raw.trim().replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(bc)) { setErrorMsg(`"${bc}" is not a valid barcode. Enter 8–14 digits.`); setScreen("error"); return; }
    setLoadingStep("Looking up product in Open Food Facts...");
    setScreen("loading");
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${bc}.json?fields=product_name,brands,quantity,serving_size,pnns_groups_1,pnns_groups_2,categories_tags,packaging_tags,ecoscore_score,countries_tags,labels_tags,ingredients_text,nutriments`;
      const res = await fetch(url, { headers:{ "User-Agent":"CanadaCarbonScanner/2.0" } });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.status !== 1 || !data.product) { setErrorMsg(`Product not found for barcode ${bc}. It may not be in Open Food Facts yet.`); setScreen("error"); return; }
      setLoadingStep("Calculating carbon footprint with AI...");
      const r = await buildResult(data.product);
      setResult(r); setScreen("result");
    } catch { setErrorMsg("Network error. Check your connection and try again."); setScreen("error"); }
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
  const tipIcons = ["maple","car","leaf","info"];

  return (
    <>
      <style>{CSS}</style>
      <div className="scanner-shell">

        <header className="scan-header">
          {(screen==="result"||screen==="logged"||screen==="error") && (
            <button className="header-icon-btn" onClick={reset} aria-label="Back"><Ico name="back" size={16}/></button>
          )}
          <div className="header-wordmark">
            <span className="header-maple">🍁</span>
            <div>
              <div className="scan-header-title">
                {screen==="result"?"Scan result":screen==="logged"?"Logged":screen==="history"?"Scan history":"Carbon Scanner"}
              </div>
              <div className="header-sub">Canada Edition</div>
            </div>
          </div>
          {(screen==="scan"||screen==="history") && (
            <button className="header-icon-btn" onClick={()=>{const n=activeTab==="history"?"scan":"history";setActiveTab(n as "scan"|"history");setScreen(n as Screen);}}>
              <Ico name={activeTab==="history"?"barcode":"history"} size={16}/>
            </button>
          )}
        </header>

        {screen==="scan" && (
          <>
            <div className="camera-area">
              <div className="scan-corner sc-tl"/><div className="scan-corner sc-tr"/>
              <div className="scan-corner sc-bl"/><div className="scan-corner sc-br"/>
              {cameraActive ? (
                <>
                  <video ref={videoRef} muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  <div className="scan-line"/>
                  <button className="header-icon-btn" style={{position:"absolute",top:10,right:10,zIndex:5,background:"rgba(0,0,0,0.45)",borderColor:"rgba(255,255,255,0.15)",color:"white"}} onClick={stopCamera}>
                    <Ico name="x" size={14} color="white"/>
                  </button>
                </>
              ) : (
                <>
                  <button className="camera-start-btn" onClick={startCamera}>
                    <Ico name="camera" size={32} color="rgba(255,255,255,0.45)"/>
                    <span style={{fontSize:12}}>Tap to scan with camera</span>
                  </button>
                  <div className="scan-line"/>
                  <div className="camera-badge">or enter barcode below</div>
                </>
              )}
            </div>

            <div className="page-body">
              {cameraError && <div className="camera-error">{cameraError}</div>}
              <div className="input-row">
                <input className="barcode-input" type="text" inputMode="numeric"
                  value={manualInput} onChange={e=>setManualInput(e.target.value)}
                  placeholder="Enter barcode (8–14 digits)"
                  onKeyDown={e=>e.key==="Enter"&&manualInput.trim()&&handleBarcode(manualInput)}/>
                <button className="scan-submit-btn" onClick={()=>manualInput.trim()&&handleBarcode(manualInput)} disabled={!manualInput.trim()}>
                  <Ico name="next" size={14} color="white"/> Look up
                </button>
              </div>
              <div className="section-label">🍁 Canadian products to try</div>
              <div className="demo-list">
                {DEMOS.map(d => (
                  <button key={d.barcode} className="demo-row" onClick={()=>handleBarcode(d.barcode)}>
                    <div className="demo-icon"><Ico name={d.icon} size={16}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="demo-name">{d.label}</div>
                      <div className="demo-hint">{d.barcode} · {d.hint}</div>
                    </div>
                    <Ico name="next" size={14} color="var(--faint)"/>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {screen==="loading" && (
          <div className="loading-page">
            <div className="spinner"/>
            <div className="loading-step">{loadingStep}</div>
            <div className="loading-sub">Open Food Facts · Agribalyse · AI classifier</div>
          </div>
        )}

        {screen==="result" && result && (
          <div className="result-page">
            <div className="product-card">
              <div style={{display:"flex",flexWrap:"wrap",marginBottom:result.isCanadian||result.method==="ai"?8:0}}>
                {result.isCanadian && <span className="canadian-badge">🍁 Canadian product · regional data</span>}
                {result.method==="ai" && <span className="ai-badge">✦ AI classified</span>}
              </div>
              <div className="product-row">
                <div className="product-icon-wrap" style={{background:result.gradeBg}}>
                  <Ico name={
                    result.agriKey.includes("milk")||result.agriKey.includes("dairy")?"drop":
                    result.agriKey.includes("beef")||result.agriKey.includes("meat")||result.agriKey.includes("chicken")||result.agriKey.includes("pork")||result.agriKey.includes("fish")||result.agriKey.includes("salmon")?"meat":
                    result.agriKey.includes("coffee")||result.agriKey.includes("tea")?"coffee":
                    result.agriKey.includes("vegetable")||result.agriKey.includes("fruit")||result.agriKey.includes("maple")||result.agriKey.includes("lentil")?"leaf":
                    "package"
                  } size={22} color={result.gradeColor}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="product-title">{result.productName}</div>
                  <div className="product-meta">
                    {[result.brand,result.quantity].filter(Boolean).join(" · ")}
                    {result.isEstimate && <span style={{marginLeft:4,color:"#d97706",fontWeight:600}}> · estimate</span>}
                  </div>
                </div>
              </div>
              <div className="score-row">
                <GradeRing grade={result.grade} co2={result.co2eTotal} color={result.gradeColor} bg={result.gradeBg}/>
                <div className="score-info">
                  <div className="score-grade-line" style={{color:result.gradeColor}}>Grade {result.grade} — {result.gradeLabel}</div>
                  <div className="score-desc">{result.co2ePerKg.toFixed(2)} kg CO₂e/kg · {result.unit}</div>
                  <div className="score-desc" style={{marginTop:2}}>≈ driving {result.kmDriving} km in a car</div>
                  <div className="score-conf"><Ico name="info" size={10}/>{(result.confidence*100).toFixed(0)}% confidence</div>
                </div>
              </div>
            </div>

            <div className="breakdown-card">
              <div className="card-title">Emission sources</div>
              {(["farming","processing","transport","packaging"] as const).map((k,i)=>{
                const val=result.breakdown[k];
                const pct=result.co2eTotal>0?(val/result.co2eTotal)*100:0;
                const colors=["#16a34a","#0ea5e9","#f59e0b","#6366f1"];
                return (
                  <div key={k} className="bd-row">
                    <span className="bd-label" style={{textTransform:"capitalize"}}>{k}</span>
                    <div className="bd-track"><div className="bd-fill" style={{width:`${pct}%`,background:colors[i]}}/></div>
                    <span className="bd-val">{val.toFixed(3)} kg</span>
                  </div>
                );
              })}
            </div>

            {result.alternatives.length>0 && (
              <div className="alts-card">
                <div className="card-title">🍁 Greener alternatives</div>
                {result.alternatives.slice(0,3).map(a=>(
                  <div key={a.key} className="alt-row">
                    <div className="alt-icon"><Ico name="leaf" size={15}/></div>
                    <span className="alt-name">{a.label}</span>
                    <span className="alt-save">−{a.savingPerKg.toFixed(1)} kg ({a.savingPct}%)</span>
                  </div>
                ))}
              </div>
            )}

            <button className="log-btn" onClick={handleLog}>
              <Ico name="plus" size={16} color="white"/> Log to my tracker
            </button>
          </div>
        )}

        {screen==="logged" && result && (
          <div className="logged-page">
            <div className="logged-check"><Ico name="check" size={30}/></div>
            <div className="logged-title">Logged! 🍁</div>
            <div className="logged-sub">Added {result.co2eTotal.toFixed(3)} kg CO₂e to your food tracker</div>
            <div className="tips-card">
              <div className="section-label" style={{marginBottom:12}}>Impact insights</div>
              {tips.map((t,i)=>(
                <div key={i} className="tip-row">
                  <div className="tip-icon"><Ico name={tipIcons[i]||"info"} size={13}/></div>
                  <span className="tip-text">{t}</span>
                </div>
              ))}
            </div>
            <button className="scan-again-btn" onClick={reset}>
              <Ico name="barcode" size={16}/> Scan another product
            </button>
          </div>
        )}

        {screen==="error" && (
          <div className="error-page">
            <div className="error-icon"><Ico name="x" size={26} color="#dc2626"/></div>
            <div className="error-title">Product not found</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="log-btn" style={{maxWidth:280}} onClick={reset}>Try again</button>
          </div>
        )}

        {screen==="history" && (
          <div className="history-page">
            {history.length===0 ? (
              <div className="hist-empty">
                <Ico name="history" size={34} color="var(--faint)"/>
                <div style={{marginTop:12}}>No scans yet — scan a product to get started.</div>
              </div>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div className="section-label" style={{margin:0}}>{history.length} scan{history.length!==1?"s":""}</div>
                  <button style={{fontSize:11,color:"var(--faint)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit",fontWeight:600}}
                    onClick={()=>{setHistory([]);localStorage.removeItem(HIST_KEY);}}>
                    <Ico name="trash" size={12}/> Clear
                  </button>
                </div>
                {history.map((h,i)=>(
                  <div key={i} className="hist-row">
                    <div className="hist-grade" style={{borderColor:h.gradeColor,color:h.gradeColor,background:h.gradeColor+"18"}}>{h.grade}</div>
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

        <nav className="bottom-nav">
          <button className={`nav-tab ${activeTab==="scan"?"active":""}`} onClick={()=>{setActiveTab("scan");if(screen!=="result"&&screen!=="logged"&&screen!=="error")setScreen("scan");}}>
            <Ico name="barcode" size={20}/><span className="nav-label">Scan</span><div className="nav-dot"/>
          </button>
          <button className={`nav-tab ${activeTab==="history"?"active":""}`} onClick={()=>{setActiveTab("history");setScreen("history");}}>
            <Ico name="history" size={20}/><span className="nav-label">History</span><div className="nav-dot"/>
          </button>
        </nav>
      </div>
    </>
  );
}
