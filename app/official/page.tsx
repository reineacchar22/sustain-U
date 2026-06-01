"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// ─── Category config ──────────────────────────────────────────────────────────
const CATS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  solar:     { label: "Solar PV",         color: "#C97B1A", bg: "#FFF3DC", emoji: "☀️" },
  energy:    { label: "Energy Systems",   color: "#1A5A8C", bg: "#E3EEF8", emoji: "⚡" },
  lighting:  { label: "LED Lighting",     color: "#5A3BA0", bg: "#EEEAFC", emoji: "💡" },
  smart:     { label: "Smart Analytics",  color: "#146E70", bg: "#DDF1F1", emoji: "📊" },
  water:     { label: "Water Efficiency", color: "#1A7A4A", bg: "#E6F5EC", emoji: "💧" },
  transport: { label: "EV & Transport",   color: "#3E5068", bg: "#ECF0F5", emoji: "🚗" },
  certified: { label: "Green Certified",  color: "#B83C2A", bg: "#FDEAE7", emoji: "🏆" },
  waste:     { label: "Waste & Food",     color: "#7A4A1A", bg: "#F5EAE0", emoji: "♻️" },
};

// ─── Initiatives data ─────────────────────────────────────────────────────────
type Initiative = {
  id: number; name: string; cat: string; year: number;
  loc: string; lat: number; lng: number;
  desc: string;
  stats: { v: string; l: string }[];
  tags: string[];
  cert: string | null;
};

const INITIATIVES: Initiative[] = [
  {
    id: 1,
    name: "Agriculture & Forestry Building — Solar Atrium (BIPV)",
    cat: "solar", year: 2017,
    loc: "Agriculture/Forestry Building Atrium",
    lat: 53.5298, lng: -113.5248,
    desc: "The atrium uses energy-efficient glass panes embedded with translucent building-integrated photovoltaic (BIPV) panels shaped like a mineral crystal, framed with locally manufactured Douglas fir beams. The 10 kW system generates electricity for the building while providing passive heat and natural light. The panels are strategically placed to balance energy generation and light transmission even in winter.",
    stats: [{ v: "10 kW", l: "BIPV Capacity" }, { v: "7.5–8 t CO₂", l: "Avoided/yr" }, { v: "Local Douglas fir", l: "Frame material" }],
    tags: ["Building-integrated PV", "BIPV", "Passive heating", "Natural daylighting", "Translucent solar glass", "E&CA green tech"],
    cert: null,
  },
  {
    id: 2,
    name: "Lister Centre — Solar PV Facades & Shading",
    cat: "solar", year: 2021,
    loc: "Alexander Mackenzie Hall (2021), Anthony Henday Hall (2021), Henry Kelsey Hall (2022)",
    lat: 53.5242, lng: -113.5315,
    desc: "The Lister Centre redevelopment modernized three student residences by retrofitting each building's exterior with photovoltaic solar shading systems. Solar shades were installed on facades and stairwells. Modelling estimated a 1–2°C peak temperature reduction in summer, passively reducing air conditioning energy demand. In winter, the optimized panel angle allows more heat gain, reducing heating requirements.",
    stats: [{ v: "3 buildings", l: "Kelsey, Mackenzie, Henday" }, { v: "1–2°C", l: "Peak temp reduction" }, { v: "Dual purpose", l: "Shade + electricity" }],
    tags: ["Facade-integrated PV", "Passive shading", "Thermal comfort", "Student residence retrofit", "Renewable energy", "E&CA green tech"],
    cert: null,
  },
  {
    id: 3,
    name: "Heating & Cooling Plant — District Energy System (DES)",
    cat: "energy", year: 1959,
    loc: "North end of campus (heating) + North Saskatchewan River (cooling)",
    lat: 53.5308, lng: -113.5278,
    desc: "Canada's largest campus district energy system and one of the five largest in North America. The gas-fired heating plant supplies 570,000 kg/hr of steam from five boilers. A 13 MW back-pressure steam turbine (1994) and 26.4 MW condensing turbine (2000) enable cogeneration — producing ~50,000 MWh/yr (~20% of campus load). The cooling plant uses North Saskatchewan River water for free-cooling in winter. Serves 130+ buildings including Alberta Health Services facilities.",
    stats: [{ v: "#1 in Canada", l: "DES size" }, { v: "50,000 MWh/yr", l: "Onsite electricity" }, { v: "60,000 t CO₂/yr", l: "Emissions avoided" }, { v: "130+ buildings", l: "Campus area served" }],
    tags: ["Cogeneration", "District heating", "Steam turbine 13MW + 26.4MW", "Free-cooling", "River water cooling", "Largest campus DES in Canada"],
    cert: null,
  },
  {
    id: 4,
    name: "Li Ka Shing Centre — Steam Turbine Generator",
    cat: "energy", year: 2015,
    loc: "Li Ka Shing Centre for Health Research Innovation",
    lat: 53.5268, lng: -113.5234,
    desc: "A micro-turbine generator reduces the high temperature and pressure of DES steam before it enters the Li Ka Shing Centre, capturing that pressure drop to generate electricity onsite. This decreases mechanical equipment maintenance costs while generating electricity. No other commercial post-secondary building in Canada has such an installation. Avoids the equivalent of taking 255 cars off the road every year.",
    stats: [{ v: "705 t CO₂/yr", l: "Avoided" }, { v: "255 cars", l: "Equivalent removed" }, { v: "First in Canada", l: "Post-secondary install" }],
    tags: ["Steam turbine", "Pressure-drop recovery", "DES integration", "Unique in Canada", "Li Ka Shing Centre", "E&CA green tech"],
    cert: null,
  },
  {
    id: 5,
    name: "Combined Heat + Power (CHP / Cogeneration)",
    cat: "energy", year: 2018,
    loc: "South Campus: Agri-Foods Discovery Place, Saville Community Sports Centre, Swine Research Facility, U of A Botanic Garden Pavilion",
    lat: 53.5192, lng: -113.5060,
    desc: "Combined heat and power (CHP), also known as cogeneration, uses natural gas to produce steam for both electricity and heating simultaneously. Heat that is typically lost in the power generation process is recovered to provide heating and/or cooling. This lowers greenhouse gas emissions, increases efficiency, and reduces reliance on external utilities. Meters provide natural gas and thermal output data to the Building Management System for monitoring and reporting.",
    stats: [{ v: "CHP / Cogeneration", l: "Technology" }, { v: "Lower GHG", l: "Emissions vs grid" }, { v: "South Campus", l: "Location (4 sites)" }],
    tags: ["Cogeneration", "Combined heat & power", "Natural gas", "Heat recovery", "BMS integration", "E&CA green tech"],
    cert: null,
  },
  {
    id: 6,
    name: "Clare Drake Arena — LED Lighting Replacement",
    cat: "lighting", year: 2021,
    loc: "Clare Drake Arena, North Campus",
    lat: 53.5231, lng: -113.5245,
    desc: "44 high-powered 1,000-watt metal halide fixtures were replaced with 223-watt LED fixtures — a 78% reduction in wattage per fixture. Estimated energy savings of 162 MWh/year. The LEDs have dimming capabilities (1–100% brightness), typically run at 50% for most arena activities, and support programmable patterns. LED lifespan is 50,000–80,000 hours vs 6,000–15,000 for metal halide.",
    stats: [{ v: "162 MWh/yr", l: "Energy saved" }, { v: "44 fixtures", l: "1,000W → 223W LED" }, { v: "50,000–80,000 hrs", l: "LED lifespan" }],
    tags: ["LED retrofit", "Arena lighting", "162 MWh savings", "Dimming capability", "Programmable patterns", "E&CA green tech"],
    cert: null,
  },
  {
    id: 7,
    name: "Human Ecology Building — LED Lighting Retrofit",
    cat: "lighting", year: 2017,
    loc: "Human Ecology Building, North Campus",
    lat: 53.5260, lng: -113.5295,
    desc: "Prior to the retrofit, lighting was responsible for 20% of the building's electricity consumption and was inconsistent — some areas were over-lit while others were dim. All incandescent and fluorescent bulbs were replaced with LEDs, reducing lighting energy demand by nearly half while improving lighting quality. The project took four weeks and serves as a pilot model for application across the majority of the university's buildings.",
    stats: [{ v: "~50%", l: "Lighting energy reduction" }, { v: "20%", l: "Previous share of building electricity" }, { v: "Pilot project", l: "Campus-wide model" }],
    tags: ["LED retrofit", "Fluorescent replacement", "Energy reduction 50%", "Human Ecology", "Campus pilot", "E&CA green tech"],
    cert: null,
  },
  {
    id: 8,
    name: "Parkade LED Lighting Retrofit",
    cat: "lighting", year: 2018,
    loc: "Campus Parkade (North Campus)",
    lat: 53.5247, lng: -113.5240,
    desc: "The parkade's existing lighting was replaced with LED fixtures, saving 33,164 kWh of electricity annually — a 17% reduction in the parkade's overall energy use. The brighter LED environment also provided a greater feeling of safety for users. LED fixtures have significantly longer lifespans and lower maintenance costs than the replaced fixtures.",
    stats: [{ v: "33,164 kWh/yr", l: "Electricity saved" }, { v: "17%", l: "Parkade energy reduction" }, { v: "Improved", l: "User safety perception" }],
    tags: ["Parkade lighting", "LED retrofit", "33,164 kWh saved", "Safety improvement", "Energy efficiency", "E&CA green tech"],
    cert: null,
  },
  {
    id: 9,
    name: "Greenhouse & Growth Chamber — LED Lighting",
    cat: "lighting", year: 2021,
    loc: "Agriculture/Forestry Centre, CCIS, Biological Sciences",
    lat: 53.5283, lng: -113.5250,
    desc: "LED lighting was installed in growth chambers — controlled environments used to grow plants for research. LEDs improve light quality and temperature control for plants while reducing bulb replacements and energy use. A key benefit is the significantly reduced heat generated by LEDs versus traditional lighting, which reduces the cooling required within the chambers. Three major research buildings benefited: Agriculture/Forestry Centre, CCIS, and Biological Sciences.",
    stats: [{ v: "3 buildings", l: "Ag/Forestry, CCIS, Bio Sci" }, { v: "Reduced", l: "Heat load in chambers" }, { v: "Improved", l: "Plant light quality" }],
    tags: ["Growth chamber LED", "Greenhouse lighting", "Reduced cooling load", "Research facility", "Plant science", "E&CA green tech"],
    cert: null,
  },
  {
    id: 10,
    name: "SkySpark — Building Analytics Platform",
    cat: "smart", year: 2018,
    loc: "North Campus and Campus Saint-Jean",
    lat: 53.5265, lng: -113.5265,
    desc: "SkySpark® is a software analytics platform installed across North Campus and Campus Saint-Jean that automatically analyzes system-level building data to provide real-time building insights. It was deployed to improve HVAC system performance, conduct deep energy analytics, optimize operations, and prioritize maintenance. The result is a predictive and proactive approach to decision-making while providing a holistic view of the campus energy picture.",
    stats: [{ v: "Real-time", l: "HVAC & energy analytics" }, { v: "2 campuses", l: "North + Saint-Jean" }, { v: "Predictive", l: "Maintenance approach" }],
    tags: ["SkySpark", "Building analytics", "HVAC optimization", "Predictive maintenance", "Real-time data", "E&CA green tech"],
    cert: null,
  },
  {
    id: 11,
    name: "People Counters — Occupancy Sensing",
    cat: "smart", year: 2015,
    loc: "North Campus (multiple buildings)",
    lat: 53.5272, lng: -113.5258,
    desc: "People counters (thermal and motion occupancy sensors) have been applied across North Campus as part of the university's building automation systems, operational management, environmental targets, and long-term facilities planning. Knowing which areas are frequently used and which are not allows the university to reduce energy in low-use areas, allocate staff resources to higher-use areas, minimize unnecessary costs, and identify space opportunities.",
    stats: [{ v: "2015", l: "Year deployed" }, { v: "Multi-building", l: "BAS integration" }, { v: "Energy + space", l: "Dual optimization" }],
    tags: ["Occupancy sensors", "People counters", "BAS integration", "HVAC scheduling", "Space planning", "E&CA green tech"],
    cert: null,
  },
  {
    id: 12,
    name: "Aircuity® — Smart Lab Ventilation",
    cat: "smart", year: 2016,
    loc: "Katz Group Centre · Li Ka Shing Centre · CCIS · Natural Resources Engineering Facility",
    lat: 53.5275, lng: -113.5238,
    desc: "Aircuity® continuously monitors air quality and occupancy in laboratories and informs the building ventilation system of the appropriate levels of fresh air to provide. Upgrading existing lab facilities with Aircuity makes significant progress toward saving energy, optimizing facilities, improving safety, and reducing the university's carbon footprint. Deployed across four major research buildings on North Campus.",
    stats: [{ v: "4 buildings", l: "Lab deployments" }, { v: "Real-time", l: "Air quality monitoring" }, { v: "Safety + efficiency", l: "Combined benefit" }],
    tags: ["Aircuity", "Smart ventilation", "Lab air quality", "Demand-controlled ventilation", "Carbon footprint reduction", "E&CA green tech"],
    cert: null,
  },
  {
    id: 13,
    name: "Water Efficient Fixture Upgrades — General Services Building",
    cat: "water", year: 2016,
    loc: "General Services Building, North Campus",
    lat: 53.5263, lng: -113.5290,
    desc: "Valves and faucets in the General Services Building were upgraded ahead of provincial plumbing code requirements. These efficient fixtures save an estimated $4,040 per year in utility costs. Schedule installations where maintenance is already taking place to reduce labour time. This project is a model for future water efficiency upgrades across campus, tracked through the E&CA sustainability dashboards.",
    stats: [{ v: "$4,040/yr", l: "Utility savings" }, { v: "Pre-code", l: "Early adopter" }, { v: "Low-flow", l: "Fixture standard" }],
    tags: ["Low-flow fixtures", "Water efficiency", "Proactive retrofit", "Utility savings", "General Services Bldg", "E&CA green tech"],
    cert: null,
  },
  {
    id: 14,
    name: "REALice — Cold Water Ice Resurfacing (Clare Drake Arena)",
    cat: "water", year: 2019,
    loc: "Clare Drake Arena, North Campus",
    lat: 53.5230, lng: -113.5247,
    desc: "REALice is a vortex water treatment system installed at Clare Drake Arena that allows ice resurfacing with cold/ambient temperature water instead of heated water (traditionally heated to 120–160°F). The 3D-printed REALice unit removes micro air bubbles from water through a multi-dimensional vortex, producing denser, harder ice than hot water — without chemicals, filters, or energy for heating. This allows the brine temperature to be raised 3–8°F, reducing refrigeration compressor runtime and energy use.",
    stats: [{ v: "Up to 79%", l: "Less natural gas use" }, { v: "Up to 12%", l: "Electricity reduction" }, { v: "No chemicals", l: "Maintenance-free" }],
    tags: ["REALice", "Cold water resurfacing", "Ice arena", "Clare Drake Arena", "Natural gas savings", "E&CA green tech"],
    cert: null,
  },
  {
    id: 15,
    name: "Electric Vehicle (EV) Charging Stations",
    cat: "transport", year: 2016,
    loc: "Stadium Car Park · Windsor Car Park · University Commons · Lot 87 · Miquelon Lake Research Station",
    lat: 53.5234, lng: -113.5258,
    desc: "Level 2 EV charging stations have been installed across multiple North Campus locations: 12 in Stadium Car Park, 8 in Windsor Car Park, 2 behind University Commons, 1 in Lot 87, plus stations at Augustana Campus and Miquelon Lake Research Station. As of early 2021, the Stadium and Augustana stations had saved 10,058 kg of carbon emissions — equivalent to planting ~258 trees. Stations cost $2/hr, available up to 4 hours. EVs in Alberta produce on average 35% fewer emissions than standard vehicles.",
    stats: [{ v: "20+ stations", l: "Level 2 EV chargers" }, { v: "10,058 kg CO₂", l: "Saved (to early 2021)" }, { v: "≈ 258 trees", l: "Carbon equivalent" }],
    tags: ["EV charging", "Level 2", "ChargePoint ENERGY STAR", "Communauto car-share", "35% fewer emissions", "E&CA green tech"],
    cert: null,
  },
  {
    id: 16,
    name: "CCIS — Centennial Centre for Interdisciplinary Science",
    cat: "certified", year: 2013,
    loc: "Centennial Centre for Interdisciplinary Science (CCIS)",
    lat: 53.5278, lng: -113.5237,
    desc: "LEED Silver certified (2013). One of Canada's largest interdisciplinary science buildings, completed in 2011. LEED Silver was awarded for meeting or exceeding performance in five key areas: sustainable site development, water efficiency, energy efficiency, materials selection, and indoor environmental quality. Houses five Faculty of Science research groups with wet and dry labs, lecture theatres, and collaborative gathering spaces. Aircuity smart ventilation was also installed here in 2016.",
    stats: [{ v: "LEED Silver", l: "Certification" }, { v: "2011/2013", l: "Built / Certified" }, { v: "5 research groups", l: "Faculty of Science" }],
    tags: ["LEED Silver", "Energy efficiency", "Water efficiency", "Indoor air quality", "Sustainable materials", "Aircuity deployed"],
    cert: "LEED Silver",
  },
  {
    id: 17,
    name: "PAW Centre — Physical Activity & Wellness Centre",
    cat: "certified", year: 2014,
    loc: "Corner of 87 Ave & 113 St, North Campus",
    lat: 53.5240, lng: -113.5298,
    desc: "Green Globes certified (2014). The first new fitness facility on North Campus since 1983. Features LED lighting throughout, a 23 kW vertical solar PV array, natural materials, and CISC Sustainability Award-winning steel and glass design. 111,000 sq ft facility includes a two-storey climbing wall, sports research labs, and the Steadward Centre for people with disabilities.",
    stats: [{ v: "Green Globes", l: "Certification" }, { v: "23 kW", l: "Vertical solar PV" }, { v: "111,000 sq ft", l: "Facility area" }],
    tags: ["Green Globes", "LED lighting", "23 kW solar PV", "Sustainable steel & glass", "CISC Award", "PAW Centre"],
    cert: "Green Globes",
  },
  {
    id: 18,
    name: "Peter Lougheed Hall — Student Residence",
    cat: "certified", year: 2017,
    loc: "East Campus Village, North Campus",
    lat: 53.5229, lng: -113.5220,
    desc: "Green Globes 4 certified — the highest level of Green Globes certification. Completed 2017. This 80,000 sq ft student residence connects East Campus to adjacent amenities with ~150 beds, dining hall, fitness facilities, recreation room, and video conferencing spaces. Electrical systems included full smart building systems: fire alarm, voice/data, wireless, and security.",
    stats: [{ v: "Green Globes 4", l: "Highest rating" }, { v: "80,000 sq ft", l: "Area" }, { v: "~150 beds", l: "Student residence" }],
    tags: ["Green Globes 4", "Highest rating", "Student residence", "Smart building systems", "East Campus", "2017"],
    cert: "Green Globes 4",
  },
  {
    id: 19,
    name: "SUB — Zero Waste Dining & Sustain SU Programs",
    cat: "waste", year: 2010,
    loc: "Students' Union Building (SUB), North Campus",
    lat: 53.5257, lng: -113.5275,
    desc: "The Students' Union Building houses Sustain SU's Zero Waste Dining initiative with compostable serviceware and food-scrap diversion programs. Leftover food scraps and compostable containers from the SUB food court may be composted onsite. Sustain SU also operates: the Bike Library & Workshop (free tools and repairs), a Reusable Dish Program, and a Campus Community Garden. The university's Waste Diversion Working Group targets 90% diversion of waste from landfill campus-wide.",
    stats: [{ v: "90%", l: "Waste diversion target" }, { v: "Zero waste dining", l: "Flagship hub" }, { v: "Sustain SU", l: "Student-led programs" }],
    tags: ["Zero waste dining", "Compostable serviceware", "Bike library", "Reusable dish program", "90% diversion target", "Sustain SU"],
    cert: null,
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --green: #16a34a; --green-light: #f0fdf4; --green-mid: #dcfce7;
  --ink: #111827; --sub: #374151; --muted: #9ca3af;
  --border: #e5e7eb; --surface: #f9fafb; --white: #ffffff;
}

.official-shell {
  display: flex; flex-direction: column; height: 100vh; overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--surface); color: var(--ink); -webkit-font-smoothing: antialiased;
}

.off-header {
  background: white; border-bottom: 1px solid var(--border);
  padding: 0 20px; display: flex; align-items: center; justify-content: space-between;
  height: 52px; flex-shrink: 0;
}
.off-header-left { display: flex; align-items: center; gap: 10px; }
.off-header-logo {
  width: 28px; height: 28px; border-radius: 7px; background: var(--green);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: white;
}
.off-header-title { font-size: 14px; font-weight: 600; color: var(--ink); letter-spacing: -0.2px; }
.off-header-right { font-size: 12px; color: var(--muted); }

.off-app { display: grid; grid-template-columns: 320px 1fr; flex: 1; overflow: hidden; min-height: 0; }

.off-sidebar { display: flex; flex-direction: column; border-right: 1px solid var(--border); background: white; overflow: hidden; }

.filter-scroll { padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.filter-scroll::-webkit-scrollbar { display: none; }
.filters { display: flex; gap: 6px; }
.fbtn { font-size: 12px; font-family: inherit; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: white; color: var(--sub); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.fbtn:hover { border-color: var(--green); color: var(--green); }
.fbtn.active { background: var(--green); color: white; border-color: var(--green); }

.list-header { padding: 9px 16px; font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: 0.3px; text-transform: uppercase; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.list-count { color: var(--ink); font-weight: 600; }

.initiative-list { overflow-y: auto; flex: 1; }
.init-card { padding: 13px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; display: flex; gap: 11px; align-items: flex-start; }
.init-card:hover { background: var(--surface); }
.init-card.active { background: var(--green-light); border-left: 2px solid var(--green); padding-left: 14px; }
.init-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.init-body { flex: 1; min-width: 0; }
.init-name { font-size: 13px; font-weight: 600; color: var(--ink); line-height: 1.35; }
.init-loc { font-size: 11px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.init-badge { display: inline-flex; align-items: center; font-size: 10px; padding: 2px 7px; border-radius: 5px; margin-top: 5px; font-weight: 500; }

.off-map-area { position: relative; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
#off-map { flex: 1; min-height: 0; display: block; }

.reset-btn { position: absolute; top: 12px; left: 12px; z-index: 900; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 7px 13px; font-size: 12px; font-family: inherit; font-weight: 500; color: var(--ink); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: background 0.12s; }
.reset-btn:hover { background: var(--surface); }

.map-legend { position: absolute; top: 12px; right: 12px; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; z-index: 900; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.legend-item { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; font-size: 11px; color: var(--sub); }
.legend-item:last-child { margin-bottom: 0; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.detail-panel { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid var(--border); padding: 20px 24px 24px; max-height: 300px; overflow-y: auto; z-index: 1000; display: none; box-shadow: 0 -8px 32px rgba(0,0,0,0.07); }
.detail-panel.open { display: block; animation: slideUp 0.18s ease; }
@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.dp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.dp-title { font-size: 15px; font-weight: 700; color: var(--ink); line-height: 1.3; flex: 1; padding-right: 16px; letter-spacing: -0.3px; }
.dp-close { background: none; border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; color: var(--muted); flex-shrink: 0; transition: background 0.12s; }
.dp-close:hover { background: var(--surface); }
.dp-badges { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }
.badge { font-size: 11px; padding: 3px 9px; border-radius: 6px; font-weight: 500; border: 1px solid transparent; }
.dp-desc { font-size: 13px; line-height: 1.7; color: var(--muted); margin-bottom: 14px; }
.dp-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.dp-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; min-width: 80px; }
.dp-stat .sv { font-size: 14px; font-weight: 700; color: var(--ink); }
.dp-stat .sl { font-size: 10px; color: var(--muted); display: block; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
.dp-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.dp-tag { font-size: 10px; padding: 3px 8px; border-radius: 5px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); }

.source-note { position: absolute; bottom: 0; right: 0; font-size: 9px; color: var(--muted); padding: 4px 8px; background: rgba(255,255,255,0.9); border-top-left-radius: 5px; z-index: 900; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function OfficialMapPage() {
  const initialized = useRef(false);

  // Functions stored in refs so JSX onClick can call them after init
  const fns = useRef({
    resetView:   () => {},
    closeDetail: () => {},
  });

  useEffect(() => {
    // Load Leaflet CSS + DM Sans/Mono fonts
    const addLink = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const el = document.createElement("link");
      el.rel = "stylesheet"; el.href = href;
      document.head.appendChild(el);
    };
    addLink("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    addLink("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
  }, []);

  const initMap = () => {
    if (initialized.current) return;
    initialized.current = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    const map = L.map("off-map", { zoomControl: true, preferCanvas: true, zoomSnap: 0.5, zoomDelta: 0.5 });

    const CAMPUS_BOUNDS = L.latLngBounds([53.5210, -113.5340], [53.5320, -113.5170]);
    map.fitBounds(CAMPUS_BOUNDS, { padding: [20, 20] });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19, minZoom: 14,
    }).addTo(map);

    const fix = () => map.invalidateSize(true);
    map.whenReady(() => { fix(); setTimeout(fix, 100); setTimeout(fix, 400); setTimeout(fix, 800); });
    window.addEventListener("resize", fix);

    const makeIcon = (cat: string) => {
      const col = (CATS[cat] || CATS.energy).color;
      const svg = `<svg width="30" height="36" viewBox="0 0 30 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.72 0 0 6.72 0 15c0 9.38 15 21 15 21s15-11.62 15-21C30 6.72 23.28 0 15 0z" fill="${col}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="14.5" r="6" fill="white" fill-opacity="0.95"/>
      </svg>`;
      return L.divIcon({ html: svg, iconSize: [30, 36], iconAnchor: [15, 36], popupAnchor: [0, -38], className: "" });
    };

    // State
    let activeFilter = "all";
    let activeId: number | null = null;
    const markers: Record<number, unknown> = {};

    // Build legend
    const legendEl = document.getElementById("off-legend-items");
    if (legendEl) {
      Object.entries(CATS).forEach(([, cfg]) => {
        const div = document.createElement("div");
        div.className = "legend-item";
        div.innerHTML = `<span class="legend-dot" style="background:${cfg.color}"></span><span>${cfg.emoji} ${cfg.label}</span>`;
        legendEl.appendChild(div);
      });
    }

    // Build filter buttons
    const filterContainer = document.getElementById("off-filter-container");
    if (filterContainer) {
      const allBtn = document.createElement("button");
      allBtn.className = "fbtn active"; allBtn.textContent = "All"; allBtn.dataset.cat = "all";
      allBtn.onclick = () => applyFilter("all");
      filterContainer.appendChild(allBtn);
      Object.entries(CATS).forEach(([key, cfg]) => {
        const btn = document.createElement("button");
        btn.className = "fbtn"; btn.textContent = `${cfg.emoji} ${cfg.label}`; btn.dataset.cat = key;
        btn.onclick = () => applyFilter(key);
        filterContainer.appendChild(btn);
      });
    }

    // Build sidebar list + markers
    const listEl = document.getElementById("off-initiative-list");
    INITIATIVES.forEach(item => {
      const cfg = CATS[item.cat];

      if (listEl) {
        const card = document.createElement("div");
        card.className = "init-card"; card.id = `ocard-${item.id}`; card.dataset.cat = item.cat;
        card.innerHTML = `
          <div class="init-icon" style="background:${cfg.bg}">${cfg.emoji}</div>
          <div class="init-body">
            <div class="init-name">${item.name}</div>
            <div class="init-loc">${item.loc}</div>
            <span class="init-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.label}${item.year ? " · " + item.year : ""}</span>
            ${item.cert ? `<span class="init-badge" style="background:#FDEAE7;color:#B83C2A;margin-left:4px">🏆 ${item.cert}</span>` : ""}
          </div>`;
        card.onclick = () => selectItem(item.id);
        listEl.appendChild(card);
      }

      const marker = L.marker([item.lat, item.lng], { icon: makeIcon(item.cat) }).addTo(map);
      marker.on("click", () => selectItem(item.id));
      markers[item.id] = marker;
    });

    updateCount();

    function updateCount() {
      const el = document.getElementById("off-list-count");
      if (!el) return;
      const n = activeFilter === "all" ? INITIATIVES.length : INITIATIVES.filter(i => i.cat === activeFilter).length;
      el.textContent = `${n} shown`;
    }

    function selectItem(id: number) {
      if (activeId !== null) document.getElementById(`ocard-${activeId}`)?.classList.remove("active");
      activeId = id;
      const item = INITIATIVES.find(i => i.id === id)!;
      const cfg  = CATS[item.cat];

      document.getElementById(`ocard-${id}`)?.classList.add("active");
      document.getElementById(`ocard-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });

      map.invalidateSize();
      map.setView([item.lat, item.lng], Math.max(map.getZoom(), 17), { animate: true });

      const dpTitle = document.getElementById("off-dp-title");
      if (dpTitle) dpTitle.textContent = item.name;

      const dpBadges = document.getElementById("off-dp-badges");
      if (dpBadges) dpBadges.innerHTML = `
        <span class="badge" style="background:${cfg.bg};color:${cfg.color};border-color:${cfg.color}40">${cfg.emoji} ${cfg.label}</span>
        ${item.year ? `<span class="badge" style="background:#ECF0F5;color:#3E5068;border-color:#D0D8E4">📅 ${item.year}</span>` : ""}
        ${item.cert ? `<span class="badge" style="background:#FDEAE7;color:#B83C2A;border-color:#F0A090">🏆 ${item.cert}</span>` : ""}
      `;

      const dpDesc = document.getElementById("off-dp-desc");
      if (dpDesc) dpDesc.textContent = item.desc;

      const dpStats = document.getElementById("off-dp-stats");
      if (dpStats) dpStats.innerHTML = item.stats.map(s => `<div class="dp-stat"><div class="sv">${s.v}</div><span class="sl">${s.l}</span></div>`).join("");

      const dpTags = document.getElementById("off-dp-tags");
      if (dpTags) dpTags.innerHTML = item.tags.map(t => `<span class="dp-tag">${t}</span>`).join("");

      document.getElementById("off-detail-panel")?.classList.add("open");
    }

    function closeDetail() {
      document.getElementById("off-detail-panel")?.classList.remove("open");
      if (activeId !== null) {
        document.getElementById(`ocard-${activeId}`)?.classList.remove("active");
        activeId = null;
      }
    }

    function applyFilter(cat: string) {
      activeFilter = cat;
      document.querySelectorAll(".fbtn").forEach(b => {
        (b as HTMLElement).classList.toggle("active", (b as HTMLElement).dataset.cat === cat);
      });
      INITIATIVES.forEach(item => {
        const visible = cat === "all" || item.cat === cat;
        const cardEl = document.getElementById(`ocard-${item.id}`);
        if (cardEl) cardEl.style.display = visible ? "" : "none";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = markers[item.id] as any;
        if (m) { visible ? (!map.hasLayer(m) && m.addTo(map)) : (map.hasLayer(m) && map.removeLayer(m)); }
      });
      updateCount();
      closeDetail();
    }

    function resetView() {
      map.invalidateSize();
      map.fitBounds(CAMPUS_BOUNDS, { padding: [20, 20], animate: true });
    }

    // Expose to JSX onClick refs
    fns.current.resetView   = resetView;
    fns.current.closeDetail = closeDetail;
  };

  return (
    <>
      <style>{CSS}</style>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onReady={initMap}
      />

      <div className="official-shell">

        {/* Header */}
        <header className="off-header">
          <div className="off-header-left">
            <div className="off-header-logo">U</div>
            <span className="off-header-title">Sustainability Map</span>
          </div>
          <span className="off-header-right">North Campus · E&amp;CA</span>
        </header>

        <div className="off-app">

          {/* Sidebar */}
          <aside className="off-sidebar">

            <div className="filter-scroll">
              <div className="filters" id="off-filter-container"></div>
            </div>

            <div className="list-header">
              <span>Initiatives</span>
              <span className="list-count" id="off-list-count">0 shown</span>
            </div>

            <div className="initiative-list" id="off-initiative-list"></div>
          </aside>

          {/* Map */}
          <div className="off-map-area">
            <div id="off-map" style={{ flex: 1, minHeight: 0 }} />

            <button className="reset-btn" onClick={() => fns.current.resetView()}>
              Full campus
            </button>

            <div className="map-legend">
              <div id="off-legend-items"></div>
            </div>

            <div className="detail-panel" id="off-detail-panel">
              <div className="dp-header">
                <div className="dp-title" id="off-dp-title"></div>
                <button className="dp-close" onClick={() => fns.current.closeDetail()}>✕</button>
              </div>
              <div className="dp-badges" id="off-dp-badges"></div>
              <div className="dp-desc"   id="off-dp-desc"></div>
              <div className="dp-stats"  id="off-dp-stats"></div>
              <div className="dp-tags"   id="off-dp-tags"></div>
            </div>

            <div className="source-note">Sources: UAlberta E&amp;CA · ualberta.ca/energy-climate-action</div>
          </div>

        </div>
      </div>
    </>
  );
}
