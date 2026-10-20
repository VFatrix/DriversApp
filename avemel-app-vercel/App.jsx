import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const RED = "#EA2227";
const DARK = "#1b1b1b";
const LOGO = "data:image/jpeg;base64,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";

const SEED = {
  drivers: [
    "Sizwe Mthethwa", "Cebisani Xhobiso", "Lungisani Lamula",
    "Khethokwakhe Ngcobo", "Xolani Zuma", "Nkosiphendule Zintetweni",
    "Bongani Zulu", "Brighton Zendera", "George Motsi",
    "Nhlakanipho Gumede", "Ayanda Shoba", "Bheki Mkhize",
    "Sbusiso Shezi", "Ndumiso Makatini", "Philani Dlamini",
    "Sibusiso Mtshali", "Luyolo Mavundla", "Sandile Sokhulu",
    "Mlungiseleli Mkhangwana", "Jabulani Mkhize", "Gabriel Maquina",
    "Nkosinathi Ngubane", "Nkanyiso Ntshangase", "Kwanele Mtungwa",
    "Mzimasi Buthi", "Samuel Mutongi", "Sakhiseni Mhlongo",
    "Siphamandla Dikinyeka", "Derrick Mbhele", "Lusindiso Makhasi",
    "Innocent Madonda", "Michael Matema", "Zimisele Mbambo",
    "Irvin Dayi", "Sanele Hadebe", "Eugene Mtshali",
    "Sakhisene Magwaza", "Lucas Langa", "Lereko Nkofo",
    "Mandla Msomi", "Lethuxolo Moloi", "Andile Khanyile",
    "Khetha Zungu", "Mbulisi Gumede", "Bonginkosi Sibiya",
    "Nkosinathi Mndali",
  ],
  vehicles: [
    { reg: "CW61KFZN", make: "MAN TGS 19.360 4X2 BLS TRUCK" },
    { reg: "CN88KDZN", make: "MAN TGS 19 360 4X2 BLS TRUCK" },
    { reg: "CB10WRZN", make: "MAN TGS 19 360 4X2 BLS TRUCK" },
    { reg: "DC26DKZN", make: "MAN TGS 26.440 6X4 BLS-LX" },
    { reg: "CZ60LWZN", make: "MAN TGS 26.440 6X4 BLS-LX" },
    { reg: "DD72NNZN", make: "MAN TGS 26-4406X4BLS-LX" },
    { reg: "DD26CLZN", make: "MAN TGS 26.480 6X4 BLS.LX" },
    { reg: "CJ11SWZN", make: "MAN TGS 26-480 6X4XBLS" },
    { reg: "CH83WFZN", make: "MAN TGS 26-480 6X4XBLS" },
    { reg: "CX47DBZN", make: "MAN 26.480 6X4 BLS LX EL EBA" },
    { reg: "CW24BPZN", make: "MAN 26.480 6X4 BLS LX EL EBA" },
    { reg: "CV39BCZN", make: "MAN 26.480 6X4 BLS LX EL EBA" },
    { reg: "DL19KHZN", make: "MAN TGX 26.520 6x4 BL SA" },
    { reg: "DL19JNZN", make: "MAN TGX 26.520 6x4 BL SA" },
    { reg: "DL63LMZN", make: "MAN TGX 26.520 6x4 BL SA" },
    { reg: "CB63YYZN", make: "Scania R410A 6X4 NZ TRUCK TRACTO" },
    { reg: "CR52PBZN", make: "Scania P360 A6X2NA FC CC" },
    { reg: "CR07DYZN", make: "Scania P360 A6X2NA TRUCK TRACTOR" },
    { reg: "CR95BXZN", make: "Scania P360 A6X2NA TRUCK TRACTOR" },
    { reg: "BD01LHZN", make: "Scania S 770 A6x4 NB" },
    { reg: "BK42SDZN", make: "Scania G460 A6x4 ZN" },
    { reg: "BK42RJZN", make: "Scania G460 A6x4 ZN" },
    { reg: "BL70YRZN", make: "Scania R460 A6x4 ZN Truck Tractor" },
    { reg: "BW37ZPZN", make: "Scania R460 A6x4 ZN" },
    { reg: "DG06MTZN", make: "Scania R460 A6X4NZ Truck Tractor" },
    { reg: "CS51JMZN", make: "Mercedes-Benz MB Actros 1836LS/37 CKD4ZA" },
    { reg: "BZ29XMZN", make: "Mercedes-Benz MB Actros 1836LS/37 CKD4ZA" },
    { reg: "CN13FDZN", make: "Mercedes-Benz MB Actros 1836LS/37 CKD5 ZA" },
    { reg: "CM62WJZN", make: "Mercedes-Benz MB Actros 1836LS/37 CKD5 ZA" },
    { reg: "BH46XVZN", make: "Mercedes-Benz 1836LS/37 4X2 A/T T/T C/C" },
    { reg: "BH46YVZN", make: "Mercedes-Benz 1836LS/37 4X2 A/T T/T C/C" },
    { reg: "BH46YKZN", make: "Mercedes-Benz 1836LS/37 4X2 A/T T/T C/C" },
    { reg: "CC90YMZN", make: "Mercedes-Benz 1836LS/37 4X2 A/T T/T C/C" },
    { reg: "CW04FPZN", make: "UD Trucks UD Trucks Croner PKE 280 (H32) JPCYZ" },
    { reg: "CW04FCZN", make: "UD Trucks UD Trucks Croner PKE 280 (H32) JPCYZ" },
    { reg: "CW23YRZN", make: "UD Trucks UD Trucks Croner PKE 280 (H32) JPCYZ" },
    { reg: "BV49MKZN", make: "UD Trucks QUESTER GWE390 (E53) 6X4 RET A/T T/T C/C" },
    { reg: "CG77TCZN", make: "UD Trucks QUESTER GWE390 (E53) 6X4 RET A/T T/T C/C" },
    { reg: "CK75YRZN", make: "UD Trucks QUESTER GWE390 (E53) 6X4 RET A/T T/T C/C" },
    { reg: "CR07BXZN", make: "UD Trucks QUESTER GWE440 TT AMT HR E55" },
    { reg: "CV86DTZN", make: "UD Trucks QUESTER GWE440 (EDD) 6X4 HR RET A/T T/T C/C" },
    { reg: "CV86FCZN", make: "UD Trucks QUESTER GWE440 (EDD) 6X4 HR RET A/T T/T C/C" },
    { reg: "DC07VTZN", make: "UD Trucks QUESTER GWE440 TT AMT HR E55" },
    { reg: "DK08JHZN", make: "UD Trucks QUESTER GWE440(E55) 6X4 HR RET A/T T/T C/C" },
    { reg: "CG15JCZN", make: "FAW 28 SERIES JH6 28.500FT A/T T" },
    { reg: "DC48XMZN", make: "FAW 16.240FD 4X2 dc" },
    { reg: "CV78GFZN", make: "FAW JH6 28.500FT A/T T/T C/C" },
    { reg: "CW23ZJZN", make: "FAW JH6 28.500FT A/T T/T C/C" },
    { reg: "AVEMELZN", make: "Volvo FH 520 hp, 6x4 tractor FH 64T ZA 01" },
    { reg: "AVEMEL2ZN", make: "Volvo FH 520 hp, 6x4 tractor FH 64T 3L 01" },
    { reg: "AVEMEL3ZN", make: "Volvo FH 520 hp, 6x4 tractor FH 64T 3L 01" },
  ],
  trailers: [
    { reg: "KSS404MP" }, { reg: "KSS406MP" }, { reg: "JTF217MP" },
    { reg: "JTF221MP" }, { reg: "JTY599MP" }, { reg: "JTY604MP" },
    { reg: "CM56YYZN" }, { reg: "CM56ZHZN" }, { reg: "KLX707MP" },
    { reg: "KKF514MP" }, { reg: "CM19LTZN" }, { reg: "JMC423MP" },
    { reg: "JKH532MP" }, { reg: "KDM893MP" }, { reg: "KDM892MP" },
    { reg: "HKF450MP" }, { reg: "KFW492MP" }, { reg: "FYF542MP" },
    { reg: "CV58NBZN" }, { reg: "CB48FZZN" }, { reg: "JWY177MP" },
    { reg: "JWY174MP" }, { reg: "JDH166MP" }, { reg: "DF84DTZN" },
    { reg: "CB95TJZN" }, { reg: "JSJ898MP" }, { reg: "JYD861MP" },
    { reg: "JWS683MP" }, { reg: "CF55GMZN" }, { reg: "DB69JTZN" },
    { reg: "JDD227MP" }, { reg: "JMC416MP" }, { reg: "HHK228MP" },
    { reg: "HMJ556MP" }, { reg: "CY36LLZN" }, { reg: "CY36LCZN" },
    { reg: "CH03HZZN" }, { reg: "CH03LSZN" }, { reg: "FXF156MP" },
    { reg: "FXF161MP" }, { reg: "JJV973MP" }, { reg: "JJV970MP" },
    { reg: "JVJ579MP" }, { reg: "JVJ574MP" }, { reg: "CZ88FTZN" },
    { reg: "KRV560MP" }, { reg: "KRL661MP" }, { reg: "KRL657MP" },
    { reg: "KSK598MP" }, { reg: "CF55GBZN" }, { reg: "KVY217MP" },
    { reg: "KVY214MP" }, { reg: "KVY224MP" }, { reg: "KXD005MP" },
    { reg: "KXD010MP" }, { reg: "KXD003MP" }, { reg: "KYK003MP" },
    { reg: "LGP610MP" }, { reg: "BH46KKZN" }, { reg: "BH46MSZN" },
    { reg: "BH46XJZN" }, { reg: "LBM581MP" }, { reg: "LCR884MP" },
    { reg: "LFM371MP" }, { reg: "LFK876MP" }, { reg: "LGB507MP" },
    { reg: "LGB506MP" }, { reg: "LFK879MP" }, { reg: "LJZ024MP" },
    { reg: "LJZ032MP" }, { reg: "LMG488MP" }, { reg: "LMG492MP" },
    { reg: "LLT381MP" }, { reg: "LMV730MP" }, { reg: "LNP162MP" },
  ],
  balances: {},
  tenure: {
    ["Sizwe Mthethwa"]: 1, ["Cebisani Xhobiso"]: 1,
    ["Lungisani Lamula"]: 1, ["Khethokwakhe Ngcobo"]: 0,
    ["Xolani Zuma"]: 1, ["Nkosiphendule Zintetweni"]: 1,
    ["Bongani Zulu"]: 1, ["Brighton Zendera"]: 4,
    ["George Motsi"]: 1, ["Nhlakanipho Gumede"]: 0,
    ["Ayanda Shoba"]: 1, ["Bheki Mkhize"]: 0,
    ["Sbusiso Shezi"]: 1, ["Ndumiso Makatini"]: 0,
    ["Philani Dlamini"]: 2, ["Sibusiso Mtshali"]: 1,
    ["Luyolo Mavundla"]: 0, ["Sandile Sokhulu"]: 0,
    ["Mlungiseleli Mkhangwana"]: 1, ["Jabulani Mkhize"]: 0,
    ["Gabriel Maquina"]: 0, ["Nkosinathi Ngubane"]: 0,
    ["Nkanyiso Ntshangase"]: 0, ["Kwanele Mtungwa"]: 0,
    ["Mzimasi Buthi"]: 0, ["Samuel Mutongi"]: 4,
    ["Sakhiseni Mhlongo"]: 0, ["Siphamandla Dikinyeka"]: 1,
    ["Derrick Mbhele"]: 1, ["Lusindiso Makhasi"]: 0,
    ["Innocent Madonda"]: 1, ["Michael Matema"]: 4,
    ["Zimisele Mbambo"]: 1, ["Irvin Dayi"]: 1,
    ["Sanele Hadebe"]: 1, ["Eugene Mtshali"]: 1,
    ["Sakhisene Magwaza"]: 4, ["Lucas Langa"]: 1,
    ["Lereko Nkofo"]: 1, ["Mandla Msomi"]: 1,
    ["Lethuxolo Moloi"]: 1, ["Andile Khanyile"]: 1,
    ["Khetha Zungu"]: 1, ["Mbulisi Gumede"]: 0,
    ["Bonginkosi Sibiya"]: 1, ["Nkosinathi Mndali"]: 1,
  },
};

const TRAILER_TYPES = ["Superlink", "Tri-axle", "Single diff", "Interlink", "Tautliner", "Abnormal"];
const LOAD_TYPES = ["Breakbulk", "Container"];
const LEGS = [["import", "Imports"], ["export", "Exports"], ["local", "Local"]];
const LEG_FORM = [["import", "Up leg"], ["export", "Down leg"], ["local", "Local"]];
const LEG_LABEL = { import: "Imports", export: "Exports", local: "Local" };

const OPS_PIN = "Avemel26";
const ADMIN_PIN = "Avemel27";
const WORKSHOP_PIN = "Avemel28";
const FAULT_SEV = ["Minor", "Major", "Critical"];
const FAULT_SEV_COLOR = { Minor: "#b58100", Major: "#d2691e", Critical: "#b00020" };
// Vehicle regs that currently have an unresolved workshop fault.
const faultedRegs = (data) => new Set((data.faults || []).filter(f => f.status === "open").map(f => f.vehicle));
// Session persists only in the deployed build (window.authStore). In the Claude
// preview it stays in memory, so you sign in again after a full reload.
const SESSION_STORE = (typeof window !== "undefined" && window.authStore) ? window.authStore : null;
function loadSession() { try { return SESSION_STORE ? JSON.parse(SESSION_STORE.get() || "null") : null; } catch { return null; } }
function persistSession(s) { try { if (SESSION_STORE) SESSION_STORE.set(s ? JSON.stringify(s) : "null"); } catch {} }
// Tracks the newest announcement this device has seen (for unread badges).
const NOTIF_STORE = (typeof window !== "undefined" && window.notifStore) ? window.notifStore : null;
function loadSeen() { try { return NOTIF_STORE ? Number(NOTIF_STORE.get() || 0) : 0; } catch { return 0; } }
function saveSeen(ts) { try { if (NOTIF_STORE) NOTIF_STORE.set(String(ts)); } catch {} }
const LEAVE_TYPES = ["Annual leave", "Sick leave", "Family responsibility", "Unpaid leave"];
const LEAVE_KEY = { "Annual leave": "annual", "Sick leave": "sick", "Family responsibility": "family" };
const DEFAULT_BALANCE = { annual: 15, sick: 30, family: 3 };
const BAL_LABEL = { annual: "Annual", sick: "Sick", family: "Family resp." };

const TENURE_BANDS = ["0-1 yr / Probation", "1-3 yrs", "3-5 yrs", "5-7 yrs", "7+ yrs"];
const TENURE_SHORT = ["Prob", "1-3", "3-5", "5-7", "7+"];
const RIG = { "Tri-axle": "tri", "Single diff": "tri", "Superlink": "link", "Interlink": "ilink" };

const RATE_DEFAULTS = {
  trailers: {
    "Interlink":   { basic: 16500, rates: [900, 950, 1050, 1200, 1300], food: 100, sleepover: 200 },
    "Superlink":   { basic: 14500, rates: [850, 950, 1000, 1050, 1100], food: 100, sleepover: 200 },
    "Tri-axle":    { basic: 13500, rates: [750, 800, 850, 900, 950], food: 100, sleepover: 150 },
    "Single diff": { basic: 12000, rates: [600, 650, 700, 700, 700], food: 55, sleepover: 100 },
  },
  lanes: [
    { k: "DBN-JHB", label: "DBN \u2013 JHB", tri: 1200, link: 1550, ilink: 1700 },
    { k: "DBN-CPT", label: "DBN \u2013 CPT", tri: 1500, link: 2000, ilink: 2000 },
    { k: "CPT-PE", label: "CPT \u2013 PE", tri: 700, link: 900, ilink: 900 },
    { k: "PE-JHB", label: "PE \u2013 JHB", tri: 1000, link: 1350, ilink: 1500 },
    { k: "CPT-JHB", label: "CPT \u2013 JHB", tri: 1300, link: 1650, ilink: 1800 },
  ],
  crossBorder: [
    { k: "ZIM-LINK", label: "Zimbabwe Link", amt: 5000 },
    { k: "ZIM-TRI", label: "Zimbabwe Tri", amt: 4000 },
    { k: "ZAM-LINK", label: "Zambia Link", amt: 7000 },
    { k: "ZAM-TRI", label: "Zambia Tri", amt: 6000 },
  ],
  adjustments: [
    { k: "dbn_local", label: "DBN local (mty)", amt: 150 },
    { k: "dbn_local_del", label: "DBN local delivery", amt: 250 },
    { k: "drop_depot_dbn", label: "Drop at depot \u2013 DBN", amt: -150 },
    { k: "collect_depot_dbn", label: "Collect at depot \u2013 DBN", amt: -150 },
    { k: "stack_depot_dbn", label: "Stack from depot \u2013 DBN", amt: 150 },
    { k: "jhb_local", label: "JHB local (mty)", amt: 150 },
    { k: "jhb_local_del", label: "JHB local delivery", amt: 250 },
    { k: "drop_depot_jhb", label: "Drop at depot \u2013 JHB", amt: -150 },
    { k: "tarping", label: "Link tarping", amt: 250 },
  ],
  foodCap: 2200,
  breakbulkPremium: 250,
  dailyRate: 550,
  satMult: 1.5,
  sunMult: 2,
};

const CHECKLIST = [
  { group: "Tyres & Wheels", items: [
    { id: "tyre_pressure", label: "All tyres at \u2265 650 kPa (6.5 bar)", critical: true },
    { id: "tyre_tread", label: "Tread depth \u2265 4 mm on all tyres", critical: true },
    { id: "wheel_nuts", label: "Wheel nuts & rims secure, none missing", critical: true },
  ]},
  { group: "Coupling & Trailer", items: [
    { id: "fifth_wheel", label: "Fifth wheel / kingpin locked & secured", critical: true },
    { id: "safety_catch", label: "Trailer locking pin / safety catch engaged", critical: true },
    { id: "airlines", label: "Air (suzie) & electrical lines connected", critical: true },
    { id: "landing_legs", label: "Landing legs fully raised", critical: false },
  ]},
  { group: "Lights & Plates", items: [
    { id: "lights", label: "Head, tail, brake, indicators & hazards working", critical: true },
    { id: "plates", label: "Number plates present & correct (truck & trailer)", critical: false },
  ]},
  { group: "Brakes & Engine", items: [
    { id: "brakes", label: "Service & park brakes work, no air leaks", critical: true },
    { id: "fluids", label: "Oil, coolant & water levels OK", critical: false },
    { id: "leaks", label: "No visible oil / fuel / coolant leaks", critical: false },
    { id: "fuel", label: "Fuel level adequate for trip", critical: false },
  ]},
  { group: "Safety & Compliance", items: [
    { id: "cameras", label: "Camera(s) working", critical: false },
    { id: "extinguisher", label: "Fire extinguisher present & charged", critical: false },
    { id: "triangles", label: "Triangles & reflective vest on board", critical: false },
    { id: "firstaid", label: "First aid kit present", critical: false },
  ]},
  { group: "Documents", items: [
    { id: "licence_disc", label: "Vehicle licence disc valid", critical: false },
    { id: "cof", label: "Roadworthy / COF valid", critical: true },
    { id: "driver_licence", label: "Driver's licence & PrDP valid", critical: true },
    { id: "load_docs", label: "Load documents / waybill on board", critical: false },
  ]},
];
const ALL_ITEMS = CHECKLIST.flatMap(g => g.items);
const ANGLES = [["front", "Front"], ["left", "Left side"], ["right", "Right side"], ["rear", "Rear"]];

async function sget(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function sset(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}

function compress(file, max = 900, q = 0.55) {
  return new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => res(null);
      r.readAsDataURL(file);
    };
    img.src = url;
  });
}

function getLoc() {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => res(null), { timeout: 5000 }
    );
  });
}

const fmt = (ts) => new Date(ts).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";
const uid = () => Math.random().toString(36).slice(2, 9);
const rand = (n) => "R" + Number(n || 0).toLocaleString("en-ZA");
const monthKey = (ts) => new Date(ts || Date.now()).toISOString().slice(0, 7);
const monthLabel = (ym) => { const [y, m] = ym.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }); };
const trailerLabel = (t) => {
  if (!t.trailerType && !(t.trailers && t.trailers.length)) return "\u2013";
  const regs = t.trailers && t.trailers.length ? " \u00b7 " + t.trailers.join(", ") : "";
  return (t.trailerType || "Trailer") + regs;
};
const getBal = (fleet, driver) => ({ ...DEFAULT_BALANCE, ...((fleet.balances || {})[driver] || {}) });

function computePayslip(data, driver, ym, rates) {
  const R = rates || RATE_DEFAULTS;
  const trips = data.trips.filter(t => t.driver === driver && monthKey(t.createdAt) === ym);
  const approved = trips.filter(t => t.pay?.status === "approved");
  const income = approved.reduce((s, t) => s + ((t.pay.total || 0) - (t.pay.food || 0) - (t.pay.sleepover || 0)), 0);
  const additional = 0;
  const food = approved.reduce((s, t) => s + (t.pay.food || 0), 0);
  const sleepover = approved.reduce((s, t) => s + (t.pay.sleepover || 0), 0);
  const counts = {};
  trips.forEach(t => { if (t.trailerType) counts[t.trailerType] = (counts[t.trailerType] || 0) + 1; });
  const mainTrailer = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || "";
  const basicDefault = R.trailers[mainTrailer]?.basic || 0;
  const meta = (data.payslips || {})[`${driver}|${ym}`] || {};
  const basic = meta.basic != null ? meta.basic : basicDefault;
  const tripTotal = income + additional;
  const excess = Math.max(0, tripTotal - basic);
  const foodCapped = Math.min(food, R.foodCap);
  const gross = Math.max(basic, tripTotal) + foodCapped + sleepover;
  const deductions = meta.deductions || 0;
  return { trips, approved, income, additional, food, foodCapped, sleepover, mainTrailer, basicDefault, basic, tripTotal, excess, gross, deductions, net: gross - deductions, checkedBy: meta.checkedBy || "", finalisedAt: meta.finalisedAt };
}

const STATUS = {
  assigned: { label: "Pre-trip checklist", c: "#b58100" },
  checklist_done: { label: "Awaiting instruction", c: "#0b69c7" },
  instructed: { label: "Instruction received", c: "#7a2bd1" },
  started: { label: "Accepted \u2013 loading", c: "#7a2bd1" },
  loaded: { label: "Loaded", c: "#0a7d3f" },
  in_transit: { label: "In transit", c: "#0a7d3f" },
  delivered: { label: "Delivered \u2013 POD review", c: "#b58100" },
  closed: { label: "Completed", c: "#0a7d3f" },
  awaiting: { label: "Awaiting next instruction", c: "#0b69c7" },
};
const LEAVE_STATUS = { pending: "#b58100", approved: "#0a7d3f", declined: "#b00020" };

// Export all loads (optionally for one month) to an Excel workbook: one row per
// load plus a per-driver summary sheet.
function exportLoads(trips, ym) {
  const loads = trips
    .filter(t => t.instruction && (!ym || monthKey(t.createdAt) === ym))
    .slice()
    .sort((a, b) => (a.driver || "").localeCompare(b.driver || "") || (a.createdAt || 0) - (b.createdAt || 0));
  if (!loads.length) { alert("No loads to export for this period."); return; }

  const rows = loads.map(t => ({
    Driver: t.driver || "",
    Date: fmtDate(t.createdAt),
    Ref: t.instruction.ref || "",
    Leg: LEG_LABEL[t.instruction.leg] || "Local",
    "Load type": t.instruction.loadType || "",
    Customer: t.instruction.customer || "",
    "2nd customer": t.instruction.customer2 || "",
    "Load site": t.instruction.loadSite || "",
    "Offload site": t.instruction.offSite || "",
    Vehicle: t.vehicle || "",
    Trailer: trailerLabel(t),
    Status: STATUS[t.status]?.label || t.status,
    "Wage (R)": t.pay?.status === "approved" ? (t.pay.total || 0) : "",
    Finalised: t.finalized ? "Yes" : "No",
  }));

  const byDriver = {};
  loads.forEach(t => {
    const d = t.driver || "-";
    byDriver[d] = byDriver[d] || { Driver: d, Loads: 0, "Wages (R)": 0, Finalised: 0 };
    byDriver[d].Loads++;
    if (t.pay?.status === "approved") byDriver[d]["Wages (R)"] += t.pay.total || 0;
    if (t.finalized) byDriver[d].Finalised++;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Loads");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(byDriver)), "Summary by driver");
  XLSX.writeFile(wb, `Avemel-loads-${ym || "all"}.xlsx`);
}

function SignaturePad({ onChange }) {
  const ref = useRef();
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current; const ctx = c.getContext("2d");
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    const pos = (e) => { const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const start = (e) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = (e) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const end = () => { if (drawing.current) { drawing.current = false; onChange(c.toDataURL("image/png")); } };
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    c.addEventListener("touchstart", start, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", end);
    return () => { c.removeEventListener("mousedown", start); c.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end); c.removeEventListener("touchstart", start); c.removeEventListener("touchmove", move); c.removeEventListener("touchend", end); };
  }, []);
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); onChange(null); };
  return (
    <div>
      <canvas ref={ref} width={300} height={120} className="w-full border-2 border-dashed rounded-lg bg-white touch-none" style={{ borderColor: "#ccc" }} />
      <button onClick={clear} className="text-xs mt-1 underline text-gray-500">Clear signature</button>
    </div>
  );
}

function PhotoButton({ label, onPhoto }) {
  const ref = useRef();
  const pick = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const b64 = await compress(f); if (b64) onPhoto(b64);
    e.target.value = "";
  };
  return (
    <>
      <button onClick={() => ref.current.click()} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: DARK }}>{label}</button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
    </>
  );
}

const Tabs = ({ value, onChange, tabs }) => (
  <div className="flex rounded-xl overflow-hidden border mb-4 text-sm" style={{ borderColor: "#e5e5e5" }}>
    {tabs.map(t => (
      <button key={t.k} onClick={() => onChange(t.k)} className="flex-1 py-2 font-semibold flex items-center justify-center gap-1" style={{ background: value === t.k ? RED : "#fff", color: value === t.k ? "#fff" : "#666" }}>
        {t.label}{t.badge ? <span className="text-[10px] px-1.5 rounded-full" style={{ background: value === t.k ? "#fff" : RED, color: value === t.k ? RED : "#fff" }}>{t.badge}</span> : null}
      </button>
    ))}
  </div>
);

function FaultReport({ driver, fleet, data, activeTrip, addFault }) {
  const [veh, setVeh] = useState(activeTrip?.vehicle || "");
  const [sev, setSev] = useState("Major");
  const [desc, setDesc] = useState("");
  const mine = (data.faults || []).filter(f => f.reportedBy === driver);

  const submit = () => {
    if (!veh || !desc.trim()) return;
    addFault({ id: uid(), vehicle: veh, severity: sev, desc: desc.trim(), reportedBy: driver, reportedAt: Date.now(), status: "open" });
    setDesc(""); setSev("Major");
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-4 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
        <h3 className="font-bold mb-1" style={{ color: DARK }}>Report a fault</h3>
        <p className="text-xs text-gray-500 mb-3">The vehicle goes to the workshop and can't be used again until they clear it.</p>

        <label className="text-xs font-semibold text-gray-500">Vehicle</label>
        <select value={veh} onChange={e => setVeh(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
          <option value="">Select vehicle\u2026</option>
          {fleet.vehicles.map(x => <option key={x.reg} value={x.reg}>{x.reg} \u2014 {x.make}</option>)}
        </select>

        <label className="text-xs font-semibold text-gray-500">Severity</label>
        <div className="flex gap-2 mt-1 mb-3">
          {FAULT_SEV.map(s => (
            <button key={s} onClick={() => setSev(s)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ background: sev === s ? FAULT_SEV_COLOR[s] : "#fff", color: sev === s ? "#fff" : "#666", borderColor: sev === s ? FAULT_SEV_COLOR[s] : "#ddd" }}>{s}</button>
          ))}
        </div>

        <label className="text-xs font-semibold text-gray-500">What's wrong?</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the fault" className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />

        <button disabled={!veh || !desc.trim()} onClick={submit} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Report fault to workshop</button>
      </div>

      {mine.length > 0 && (
        <div>
          <h3 className="font-bold mb-2" style={{ color: DARK }}>My reported faults</h3>
          <div className="space-y-2">
            {mine.map(f => (
              <div key={f.id} className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: f.status === "open" ? "#e5e5e5" : "#0a7d3f" }}>
                <div className="flex justify-between items-start">
                  <div className="font-bold" style={{ color: DARK }}>{f.vehicle}</div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: f.status === "open" ? FAULT_SEV_COLOR[f.severity] : "#0a7d3f" }}>{f.status === "open" ? f.severity : "Cleared"}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{f.desc}</div>
                <div className="text-[10px] text-gray-400 mt-1">Reported {fmt(f.reportedAt)}{f.status === "cleared" ? ` \u00b7 cleared by ${f.clearedBy} ${fmt(f.clearedAt)}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FaultRow({ fault, clearFault }) {
  const [open, setOpen] = useState(false);
  const [by, setBy] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: FAULT_SEV_COLOR[fault.severity] }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold" style={{ color: DARK }}>{fault.vehicle}</div>
          <div className="text-xs text-gray-600 mt-0.5">{fault.desc}</div>
          <div className="text-[10px] text-gray-400 mt-1">By {fault.reportedBy} {"\u00b7"} {fmt(fault.reportedAt)}{fault.source === "checklist" ? " \u00b7 from pre-trip checklist" : ""}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: FAULT_SEV_COLOR[fault.severity] }}>{fault.severity}</span>
      </div>
      {open ? (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "#eee" }}>
          <input value={by} onChange={e => setBy(e.target.value)} placeholder="Cleared by" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Work done / note (optional)" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg font-semibold text-sm border" style={{ borderColor: "#ddd", color: "#666" }}>Cancel</button>
            <button onClick={() => clearFault(fault.id, by, note)} className="flex-1 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0a7d3f" }}>Confirm cleared</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-full mt-2 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0a7d3f" }}>Clear vehicle for use</button>
      )}
    </div>
  );
}

function WorkshopView({ data, fleet, addFault, clearFault }) {
  const faults = data.faults || [];
  const open = faults.filter(f => f.status === "open");
  const cleared = faults.filter(f => f.status === "cleared");
  const downRegs = new Set(open.map(f => f.vehicle));
  const [showLog, setShowLog] = useState(false);
  const [veh, setVeh] = useState(""); const [sev, setSev] = useState("Major"); const [desc, setDesc] = useState("");
  const [showHist, setShowHist] = useState(false);

  const log = () => {
    if (!veh || !desc.trim()) return;
    addFault({ id: uid(), vehicle: veh, severity: sev, desc: desc.trim(), reportedBy: "Workshop", reportedAt: Date.now(), status: "open" });
    setVeh(""); setSev("Major"); setDesc(""); setShowLog(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat n={downRegs.size} l="In workshop" hot={downRegs.size > 0} />
        <Stat n={open.length} l="Open faults" hot={open.length > 0} />
      </div>

      <button onClick={() => setShowLog(!showLog)} className="w-full mb-3 py-2.5 rounded-lg font-bold text-white" style={{ background: DARK }}>{showLog ? "Close" : "Log a fault"}</button>
      {showLog && (
        <div className="bg-white rounded-xl p-4 border shadow-sm mb-4" style={{ borderColor: "#e5e5e5" }}>
          <label className="text-xs font-semibold text-gray-500">Vehicle</label>
          <select value={veh} onChange={e => setVeh(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
            <option value="">Select vehicle\u2026</option>
            {fleet.vehicles.map(x => <option key={x.reg} value={x.reg}>{x.reg} \u2014 {x.make}</option>)}
          </select>
          <label className="text-xs font-semibold text-gray-500">Severity</label>
          <div className="flex gap-2 mt-1 mb-3">
            {FAULT_SEV.map(s => <button key={s} onClick={() => setSev(s)} className="flex-1 py-2 rounded-lg text-sm font-semibold border" style={{ background: sev === s ? FAULT_SEV_COLOR[s] : "#fff", color: sev === s ? "#fff" : "#666", borderColor: sev === s ? FAULT_SEV_COLOR[s] : "#ddd" }}>{s}</button>)}
          </div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the fault" className="w-full mb-3 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
          <button disabled={!veh || !desc.trim()} onClick={log} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Log fault</button>
        </div>
      )}

      <h3 className="font-bold mb-2" style={{ color: DARK }}>Vehicles in the workshop</h3>
      {open.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e5e5" }}>No open faults. Whole fleet is available.</div>}
      <div className="space-y-2">
        {open.map(f => <FaultRow key={f.id} fault={f} clearFault={clearFault} />)}
      </div>

      {cleared.length > 0 && (
        <div className="mt-5">
          <button onClick={() => setShowHist(!showHist)} className="text-sm underline text-gray-500">{showHist ? "Hide" : "Show"} cleared history ({cleared.length})</button>
          {showHist && (
            <div className="space-y-2 mt-2">
              {cleared.map(f => (
                <div key={f.id} className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#0a7d3f" }}>
                  <div className="flex justify-between items-start">
                    <div className="font-bold" style={{ color: DARK }}>{f.vehicle}</div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: "#0a7d3f" }}>Cleared</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{f.desc}</div>
                  {f.clearNote && <div className="text-xs text-gray-500 mt-0.5">Work: {f.clearNote}</div>}
                  <div className="text-[10px] text-gray-400 mt-1">Reported by {f.reportedBy} {fmt(f.reportedAt)} {"\u00b7"} cleared by {f.clearedBy} {fmt(f.clearedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnnouncementsPanel({ announcements, seen = 0, onClose }) {
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const enable = async () => {
    if (typeof window !== "undefined" && window.avemelEnablePush) {
      await window.avemelEnablePush();
      setPerm(typeof Notification !== "undefined" ? Notification.permission : "granted");
      return;
    }
    if (typeof Notification !== "undefined") Notification.requestPermission().then(setPerm);
  };
  const isNew = (a) => a.at > seen;
  const list = [...announcements].sort((a, b) => (isNew(b) - isNew(a)) || (b.at - a.at));
  const unread = announcements.filter(isNew).length;
  return (
    <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="max-w-md mx-auto bg-white min-h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold" style={{ color: DARK }}>Announcements{unread > 0 ? <span className="ml-2 text-[10px] font-bold text-white rounded-full px-2 py-0.5" style={{ background: RED }}>{unread} new</span> : null}</div>
          <button onClick={onClose} className="text-sm font-semibold" style={{ color: RED }}>{unread > 0 ? "Mark read" : "Close"}</button>
        </div>
        {perm !== "granted" && perm !== "unsupported" && (
          <button onClick={enable} className="w-full text-left px-4 py-2.5 text-sm border-b" style={{ borderColor: "#eee", color: "#0b69c7" }}>
            Turn on push alerts on this device
          </button>
        )}
        <div className="p-4 space-y-2">
          {list.length === 0 && <div className="text-sm text-gray-400">No announcements yet.</div>}
          {list.map(a => (
            <div key={a.id} className="rounded-xl p-3 border shadow-sm" style={{ borderColor: a.priority === "urgent" ? RED : (isNew(a) ? "#0b69c7" : "#e5e5e5"), background: isNew(a) ? "#f5f9ff" : "#fff" }}>
              <div className="flex justify-between items-start gap-2">
                <div className="font-bold" style={{ color: a.priority === "urgent" ? RED : DARK }}>{a.priority === "urgent" ? "\u26a0 " : ""}{a.title}</div>
                {isNew(a) && <span className="text-[9px] font-bold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: "#0b69c7" }}>NEW</span>}
              </div>
              <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{a.body}</div>
              <div className="text-[10px] text-gray-400 mt-2">{a.by} {"\u00b7"} {fmt(a.at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnounceCompose({ data, addAnnouncement, removeAnnouncement }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [by, setBy] = useState("");
  const list = [...(data.announcements || [])].sort((a, b) => b.at - a.at);

  const post = () => {
    if (!title.trim() || !body.trim()) return;
    addAnnouncement({ id: uid(), title: title.trim(), body: body.trim(), priority: urgent ? "urgent" : "normal", by: by.trim() || "Management", at: Date.now() });
    setTitle(""); setBody(""); setUrgent(false);
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-4 border shadow-sm mb-4" style={{ borderColor: "#e5e5e5" }}>
        <h3 className="font-bold mb-1" style={{ color: DARK }}>New announcement</h3>
        <p className="text-xs text-gray-500 mb-3">Goes to everyone signed in - drivers, control room and workshop.</p>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Message" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
        <input value={by} onChange={e => setBy(e.target.value)} placeholder="From (optional)" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
        <label className="flex items-center gap-2 mb-3 text-sm" style={{ color: DARK }}>
          <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} /> Mark as urgent
        </label>
        <button disabled={!title.trim() || !body.trim()} onClick={post} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Post announcement</button>
      </div>

      <h3 className="font-bold mb-2" style={{ color: DARK }}>Posted</h3>
      {list.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e5e5" }}>Nothing posted yet.</div>}
      <div className="space-y-2">
        {list.map(a => (
          <div key={a.id} className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: a.priority === "urgent" ? RED : "#e5e5e5" }}>
            <div className="flex justify-between items-start">
              <div className="font-bold" style={{ color: a.priority === "urgent" ? RED : DARK }}>{a.priority === "urgent" ? "\u26a0 " : ""}{a.title}</div>
              <button onClick={() => removeAnnouncement(a.id)} className="text-xs underline text-gray-400">Delete</button>
            </div>
            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{a.body}</div>
            <div className="text-[10px] text-gray-400 mt-2">{a.by} {"\u00b7"} {fmt(a.at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginGate({ signIn }) {
  const [mode, setMode] = useState("choose");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const card = "w-full text-left px-4 py-4 rounded-xl bg-white border shadow-sm font-semibold flex justify-between items-center";

  if (mode === "choose") {
    return (
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: DARK }}>Sign in</h2>
        <p className="text-sm text-gray-500 mb-4">Choose how you're signing in.</p>
        <div className="space-y-2">
          <button onClick={() => signIn({ role: "driver", driver: null })} className={card} style={{ borderColor: "#e5e5e5" }}>
            <span>Driver<span className="block text-xs font-normal text-gray-400">Start your shift</span></span><span style={{ color: RED }}>{"\u203a"}</span>
          </button>
          <button onClick={() => { setMode("ops"); setPin(""); setErr(""); }} className={card} style={{ borderColor: "#e5e5e5" }}>
            <span>Operations<span className="block text-xs font-normal text-gray-400">Control room - PIN required</span></span><span style={{ color: RED }}>{"\u203a"}</span>
          </button>
          <button onClick={() => { setMode("admin"); setPin(""); setErr(""); }} className={card} style={{ borderColor: "#e5e5e5" }}>
            <span>Admin &amp; Payroll<span className="block text-xs font-normal text-gray-400">PIN required</span></span><span style={{ color: RED }}>{"\u203a"}</span>
          </button>
          <button onClick={() => { setMode("workshop"); setPin(""); setErr(""); }} className={card} style={{ borderColor: "#e5e5e5" }}>
            <span>Workshop<span className="block text-xs font-normal text-gray-400">Fault clearing - PIN required</span></span><span style={{ color: RED }}>{"\u203a"}</span>
          </button>
        </div>
      </div>
    );
  }

  const META = { ops: { label: "Operations", pin: OPS_PIN }, admin: { label: "Admin & Payroll", pin: ADMIN_PIN }, workshop: { label: "Workshop", pin: WORKSHOP_PIN } };
  const m = META[mode];
  const submit = () => { if (pin === m.pin) signIn({ role: mode, driver: null }); else setErr("Incorrect PIN. Try again."); };
  return (
    <div>
      <button onClick={() => { setMode("choose"); setErr(""); }} className="text-xs underline text-gray-500 mb-3">{"\u2039"} Back</button>
      <h2 className="text-lg font-bold mb-1" style={{ color: DARK }}>{m.label}</h2>
      <p className="text-sm text-gray-500 mb-4">Enter your PIN to continue.</p>
      <input autoFocus type="password" value={pin} onChange={e => { setPin(e.target.value); setErr(""); }} onKeyDown={e => { if (e.key === "Enter") submit(); }}
        placeholder="PIN" className="w-full px-3 py-3 rounded-xl border text-sm mb-2" style={{ borderColor: err ? RED : "#ddd" }} />
      {err && <div className="text-xs mb-2" style={{ color: RED }}>{err}</div>}
      <button onClick={submit} disabled={!pin} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Unlock</button>
    </div>
  );
}

export default function App() {
  const saved = loadSession();
  const [session, setSession] = useState(saved);
  const [view, setView] = useState("driver");
  const [data, setData] = useState({ trips: [], leave: [], payslips: {}, faults: [], announcements: [], updatedAt: 0 });
  const [fleet, setFleet] = useState({ ...SEED, rates: RATE_DEFAULTS, updatedAt: 0 });
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data); useEffect(() => { dataRef.current = data; }, [data]);
  const fleetRef = useRef(fleet); useEffect(() => { fleetRef.current = fleet; }, [fleet]);

  const [driver, setDriver] = useState(saved?.driver || null);
  const [opsTrip, setOpsTrip] = useState(null);
  const [seen, setSeen] = useState(loadSeen());
  const [bellOpen, setBellOpen] = useState(false);
  const notifiedRef = useRef(Date.now());

  useEffect(() => {
    const fresh = (data.announcements || []).filter(a => a.at > notifiedRef.current);
    if (fresh.length) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        fresh.forEach(a => { try { new Notification(a.priority === "urgent" ? "\u26a0 " + a.title : a.title, { body: a.body }); } catch {} });
      }
      notifiedRef.current = Math.max(notifiedRef.current, ...fresh.map(a => a.at));
    }
  }, [data.announcements]);

  useEffect(() => {
    if (session && (data.announcements || []).some(a => a.at > seen)) setBellOpen(true);
  }, [data.announcements, seen, session]);

  const signIn = (s) => { setSession(s); if (s.role === "driver") setDriver(s.driver || null); persistSession(s); };
  const signOut = () => { setSession(null); setDriver(null); setOpsTrip(null); persistSession(null); };
  const setDriverPersist = (d) => { setDriver(d); if (session?.role === "driver") { const ns = { role: "driver", driver: d }; setSession(ns); persistSession(ns); } };

  useEffect(() => {
    (async () => {
      const d = await sget("avemel:data:v2");
      const f = await sget("avemel:fleet:v3");
      setData(d ? { trips: d.trips || [], leave: d.leave || [], payslips: d.payslips || {}, faults: d.faults || [], announcements: d.announcements || [], updatedAt: d.updatedAt || 0 } : { trips: [], leave: [], payslips: {}, faults: [], announcements: [], updatedAt: 0 });
      if (f) setFleet({ ...f, balances: f.balances || {}, tenure: f.tenure || {}, rates: f.rates || RATE_DEFAULTS }); else sset("avemel:fleet:v3", { ...SEED, rates: RATE_DEFAULTS, updatedAt: Date.now() });
      setReady(true);
    })();
    const iv = setInterval(async () => {
      const d = await sget("avemel:data:v2");
      if (d && (d.updatedAt || 0) > dataRef.current.updatedAt) setData({ trips: d.trips || [], leave: d.leave || [], payslips: d.payslips || {}, faults: d.faults || [], announcements: d.announcements || [], updatedAt: d.updatedAt || 0 });
      const f = await sget("avemel:fleet:v3");
      if (f && (f.updatedAt || 0) > fleetRef.current.updatedAt) setFleet({ ...f, balances: f.balances || {}, tenure: f.tenure || {}, rates: f.rates || RATE_DEFAULTS });
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const saveData = (next) => { next.updatedAt = Date.now(); setData(next); sset("avemel:data:v2", next); };
  const saveFleet = (next) => { next.updatedAt = Date.now(); setFleet(next); sset("avemel:fleet:v3", next); };
  const addTrip = (t) => saveData({ ...dataRef.current, trips: [t, ...dataRef.current.trips] });
  const updTrip = (id, fn) => saveData({ ...dataRef.current, trips: dataRef.current.trips.map(t => t.id === id ? fn({ ...t }) : t) });
  const addLeave = (a) => saveData({ ...dataRef.current, leave: [a, ...(dataRef.current.leave || [])] });
  const addFault = (f) => saveData({ ...dataRef.current, faults: [f, ...(dataRef.current.faults || [])] });
  const clearFault = (id, by, note) => saveData({ ...dataRef.current, faults: (dataRef.current.faults || []).map(x => x.id === id ? { ...x, status: "cleared", clearedBy: by || "Workshop", clearedAt: Date.now(), clearNote: note || "" } : x) });
  const addAnnouncement = (a) => { saveData({ ...dataRef.current, announcements: [a, ...(dataRef.current.announcements || [])] }); try { if (window.avemelSendPush) window.avemelSendPush(a); } catch {} };
  const removeAnnouncement = (id) => saveData({ ...dataRef.current, announcements: (dataRef.current.announcements || []).filter(a => a.id !== id) });
  const submitChecklist = (id, checklist) => {
    const cur = dataRef.current;
    const trip = cur.trips.find(t => t.id === id);
    const newFaults = (checklist.defects || []).map(d => ({
      id: uid(), vehicle: trip?.vehicle || "", severity: d.critical ? "Critical" : "Major",
      desc: `Pre-trip checklist: ${d.label}${d.note ? ` - ${d.note}` : ""}`,
      reportedBy: trip?.driver || "Driver", reportedAt: Date.now(), status: "open", source: "checklist", tripId: id,
    }));
    const n = (checklist.defects || []).length;
    saveData({
      ...cur,
      trips: cur.trips.map(t => t.id === id ? { ...t, status: "checklist_done", checklist,
        timeline: [...t.timeline, { e: `Pre-trip checklist completed${n ? ` \u2013 ${n} defect(s) logged, vehicle flagged to workshop` : " \u2013 all clear"}`, ts: Date.now() }] } : t),
      faults: [...newFaults, ...(cur.faults || [])],
    });
  };
  const decideLeave = (id, approve, approver) => {
    const app = (dataRef.current.leave || []).find(l => l.id === id);
    saveData({ ...dataRef.current, leave: dataRef.current.leave.map(l => l.id === id ? { ...l, status: approve ? "approved" : "declined", decidedBy: approver || "Management", decidedAt: Date.now() } : l) });
    if (approve && app) {
      const key = LEAVE_KEY[app.type];
      if (key) {
        const bal = getBal(fleetRef.current, app.driver);
        bal[key] = Math.max(0, bal[key] - app.days);
        saveFleet({ ...fleetRef.current, balances: { ...(fleetRef.current.balances || {}), [app.driver]: bal } });
      }
    }
  };
  const saveBalances = (map) => saveFleet({ ...fleetRef.current, balances: { ...(fleetRef.current.balances || {}), ...map } });
  const saveTenure = (driver, idx) => saveFleet({ ...fleetRef.current, tenure: { ...(fleetRef.current.tenure || {}), [driver]: idx } });
  const saveRates = (r) => saveFleet({ ...fleetRef.current, rates: r });
  const savePayslip = (key, patch) => saveData({ ...dataRef.current, payslips: { ...(dataRef.current.payslips || {}), [key]: { ...((dataRef.current.payslips || {})[key] || {}), ...patch } } });
  const approvePod = (id, by) => {
    const cur = dataRef.current;
    const done = cur.trips.find(x => x.id === id);
    if (!done) return;
    const trips = cur.trips.map(x => x.id === id
      ? { ...x, status: "closed", podApprovedBy: by || "Operations", podApprovedAt: Date.now(),
          timeline: [...x.timeline, { e: `POD approved by ${by || "Operations"} - driver released for next instruction`, ts: Date.now() }] }
      : x);
    const next = { id: uid(), driver: done.driver, vehicle: done.vehicle, trailerType: done.trailerType, trailers: done.trailers,
      status: "awaiting", checklist: done.checklist, instruction: null, requested: false, pods: [], loadPhotos: [], signature: null, receiver: "", pay: null,
      timeline: [{ e: "Awaiting next instruction", ts: Date.now() }], createdAt: Date.now() };
    saveData({ ...cur, trips: [next, ...trips] });
  };

  const rates = fleet.rates || RATE_DEFAULTS;
  const activeTrip = driver ? data.trips.find(t => t.driver === driver && t.status !== "closed") : null;

  if (!ready) return <div className="p-8 text-center text-gray-400">Loading\u2026</div>;

  const role = session?.role;
  const roleLabel = !session ? "" : { driver: "Driver App", ops: "Control Room", admin: "Admin & Payroll", workshop: "Workshop" }[role];
  const unread = (data.announcements || []).filter(a => a.at > seen).length;
  const openBell = () => setBellOpen(true);
  const closeBell = () => { setBellOpen(false); const now = Date.now(); setSeen(now); saveSeen(now); };

  return (
    <div className="max-w-md mx-auto min-h-screen" style={{ background: "#f4f4f5", fontFamily: "system-ui, sans-serif" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b" style={{ borderColor: "#e5e5e5" }}>
        <img src={LOGO} alt="Avemel - The Leader in Logistics" className="h-9 w-auto" />
        {session ? (
          <div className="flex items-center gap-4">
            <button onClick={openBell} className="relative" aria-label="Announcements" style={{ fontSize: 20, lineHeight: 1 }}>
              {"\uD83D\uDD14"}
              {unread > 0 && <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white rounded-full flex items-center justify-center" style={{ background: RED, minWidth: 15, height: 15, padding: "0 3px" }}>{unread}</span>}
            </button>
            <button onClick={signOut} className="text-xs font-semibold underline" style={{ color: RED }}>Sign out</button>
          </div>
        ) : <span className="text-xs font-semibold" style={{ color: "#9a9a9a" }}>Sign in</span>}
      </div>

      {bellOpen && <AnnouncementsPanel announcements={data.announcements || []} seen={seen} onClose={closeBell} />}

      {!session ? (
        <div className="px-4 py-6"><LoginGate signIn={signIn} /></div>
      ) : (
        <>
          <div className="px-4 pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "#9a9a9a" }}>{roleLabel}</span>
            {role === "driver" && driver && <span className="text-xs text-gray-400">{driver}</span>}
          </div>
          <div className="px-4 pb-4 pt-2">
            {role === "driver" && <DriverView {...{ driver, setDriver: setDriverPersist, fleet, data, activeTrip, addTrip, updTrip, saveFleet, addLeave, addFault, submitChecklist }} />}
            {role === "ops" && <OpsView {...{ data, fleet, updTrip, saveFleet, opsTrip, setOpsTrip, approvePod }} />}
            {role === "admin" && <AdminView {...{ data, fleet, rates, updTrip, decideLeave, saveBalances, savePayslip, saveRates, saveTenure, addAnnouncement, removeAnnouncement }} />}
            {role === "workshop" && <WorkshopView {...{ data, fleet, addFault, clearFault }} />}
          </div>
        </>
      )}
    </div>
  );
}

// ============ DRIVER ============
function DriverView({ driver, setDriver, fleet, data, activeTrip, addTrip, updTrip, saveFleet, addLeave, addFault, submitChecklist }) {
  const [newName, setNewName] = useState("");
  const [tab, setTab] = useState("trip");

  if (!driver) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: DARK }}>Who's driving?</h2>
        <p className="text-sm text-gray-500 mb-4">Select your name to start your shift.</p>
        <div className="space-y-2">
          {fleet.drivers.map(d => (
            <button key={d} onClick={() => setDriver(d)} className="w-full text-left px-4 py-3 rounded-xl bg-white border shadow-sm font-semibold flex justify-between items-center" style={{ borderColor: "#e5e5e5" }}>
              {d} <span style={{ color: RED }}>{"\u203a"}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Add a driver" className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
          <button onClick={() => { if (newName.trim()) { saveFleet({ ...fleet, drivers: [...fleet.drivers, newName.trim()] }); setNewName(""); } }} className="px-4 rounded-lg text-white font-semibold" style={{ background: DARK }}>Add</button>
        </div>
      </div>
    );
  }

  const myPending = (data.leave || []).filter(l => l.driver === driver && l.status === "pending").length;
  const myOpenFaults = (data.faults || []).filter(f => f.reportedBy === driver && f.status === "open").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div><div className="text-xs text-gray-400">Driver</div><div className="font-bold" style={{ color: DARK }}>{driver}</div></div>
        <button onClick={() => setDriver(null)} className="text-xs underline text-gray-500">Switch</button>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ k: "trip", label: "My Trip" }, { k: "leave", label: "Leave", badge: myPending || null }, { k: "faults", label: "Faults", badge: myOpenFaults || null }]} />
      {tab === "trip"
        ? (!activeTrip ? <AssignStep {...{ driver, fleet, addTrip, data }} /> : <TripFlow {...{ trip: activeTrip, updTrip, submitChecklist }} />)
        : tab === "leave"
        ? <LeaveDriver {...{ driver, fleet, data, addLeave }} />
        : <FaultReport {...{ driver, fleet, data, activeTrip, addFault }} />}
    </div>
  );
}

function LeaveDriver({ driver, fleet, data, addLeave }) {
  const bal = getBal(fleet, driver);
  const [type, setType] = useState("Annual leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const mine = (data.leave || []).filter(l => l.driver === driver);
  const calc = (a, b) => { if (!a || !b) return ""; const d = Math.round((new Date(b) - new Date(a)) / 86400000) + 1; return d > 0 ? d : ""; };
  const onFrom = (v) => { setFrom(v); setDays(calc(v, to)); };
  const onTo = (v) => { setTo(v); setDays(calc(from, v)); };
  const submit = () => {
    if (!from || !to || !days) return;
    addLeave({ id: uid(), driver, type, from, to, days: Number(days), reason, status: "pending", appliedAt: Date.now() });
    setFrom(""); setTo(""); setDays(""); setReason("");
  };
  const pendingByKey = {};
  mine.filter(l => l.status === "pending").forEach(l => { const k = LEAVE_KEY[l.type]; if (k) pendingByKey[k] = (pendingByKey[k] || 0) + l.days; });
  const key = LEAVE_KEY[type];
  const over = key && Number(days) > bal[key];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Leave balance</div>
        <div className="grid grid-cols-3 gap-2">
          {["annual", "sick", "family"].map(k => (
            <div key={k} className="bg-white rounded-xl p-2 text-center border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
              <div className="text-xl font-extrabold" style={{ color: DARK }}>{bal[k]}</div>
              <div className="text-[10px] text-gray-500">{BAL_LABEL[k]} days</div>
              {pendingByKey[k] ? <div className="text-[9px]" style={{ color: "#b58100" }}>{pendingByKey[k]} pending</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
        <div className="font-bold text-sm mb-3" style={{ color: DARK }}>Apply for leave</div>
        <label className="text-xs font-semibold text-gray-500">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border" style={{ borderColor: "#ddd" }}>
          {LEAVE_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <div className="flex gap-2 mb-3">
          <div className="flex-1"><label className="text-xs font-semibold text-gray-500">From</label><input type="date" value={from} onChange={e => onFrom(e.target.value)} className="w-full mt-1 px-2 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
          <div className="flex-1"><label className="text-xs font-semibold text-gray-500">To</label><input type="date" value={to} onChange={e => onTo(e.target.value)} className="w-full mt-1 px-2 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
          <div className="w-16"><label className="text-xs font-semibold text-gray-500">Days</label><input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-full mt-1 px-2 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
        </div>
        {over ? <div className="text-xs mb-2" style={{ color: RED }}>That's more than your {BAL_LABEL[key].toLowerCase()} balance of {bal[key]} \u2013 management will review.</div> : null}
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm mb-3" style={{ borderColor: "#ddd" }} />
        <button disabled={!from || !to || !days} onClick={submit} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Submit application</button>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">My applications</div>
        {mine.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-3 border" style={{ borderColor: "#e5e5e5" }}>No applications yet.</div>}
        <div className="space-y-2">
          {mine.map(l => (
            <div key={l.id} className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm" style={{ color: DARK }}>{l.type} \u2013 {l.days} day{l.days > 1 ? "s" : ""}</div>
                  <div className="text-xs text-gray-500">{fmtDate(l.from)} \u2192 {fmtDate(l.to)}</div>
                  {l.reason && <div className="text-xs text-gray-400 mt-0.5">{l.reason}</div>}
                  {l.status !== "pending" && <div className="text-[10px] text-gray-400 mt-0.5">{l.status === "approved" ? "Approved" : "Declined"} by {l.decidedBy}</div>}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white capitalize" style={{ background: LEAVE_STATUS[l.status] }}>{l.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssignStep({ driver, fleet, addTrip, data }) {
  const [v, setV] = useState("");
  const faulted = faultedRegs(data);
  const [tt, setTt] = useState("");
  const [trailers, setTrailers] = useState([]);
  const [pickT, setPickT] = useState("");
  const addTrailer = () => { if (pickT && !trailers.includes(pickT)) { setTrailers([...trailers, pickT]); setPickT(""); } };
  const go = () => {
    addTrip({ id: uid(), driver, vehicle: v, trailerType: tt, trailers, status: "assigned",
      checklist: null, instruction: null, requested: false, pods: [], loadPhotos: [], signature: null, receiver: "", pay: null,
      timeline: [{ e: `Trip started \u2013 ${v} / ${tt}${trailers.length ? " (" + trailers.join(", ") + ")" : ""} assigned`, ts: Date.now() }], createdAt: Date.now() });
  };
  const twoTrailer = tt === "Superlink" || tt === "Interlink";
  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
      <h3 className="font-bold mb-3" style={{ color: DARK }}>Assign your combination</h3>

      <label className="text-xs font-semibold text-gray-500">Truck</label>
      <select value={v} onChange={e => setV(e.target.value)} className="w-full mt-1 mb-1 px-3 py-2 rounded-lg border" style={{ borderColor: "#ddd" }}>
        <option value="">Select truck\u2026</option>
        {fleet.vehicles.map(x => { const down = faulted.has(x.reg); return <option key={x.reg} value={x.reg} disabled={down}>{x.reg} \u2014 {x.make}{down ? " (in workshop)" : ""}</option>; })}
      </select>
      {faulted.size > 0 && <div className="text-[11px] mb-3" style={{ color: RED }}>{faulted.size} vehicle(s) are in the workshop and can't be selected until cleared.</div>}
      {faulted.size === 0 && <div className="mb-3" />}

      <label className="text-xs font-semibold text-gray-500">Trailer type</label>
      <select value={tt} onChange={e => setTt(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border" style={{ borderColor: "#ddd" }}>
        <option value="">Select trailer type\u2026</option>
        {TRAILER_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
      </select>

      <label className="text-xs font-semibold text-gray-500">Trailer unit(s) <span className="text-gray-400 font-normal">optional</span></label>
      {twoTrailer && <div className="text-[11px] text-gray-400 mt-0.5">{tt} usually runs two trailers \u2013 add both.</div>}
      <div className="flex gap-2 mt-1">
        <select value={pickT} onChange={e => setPickT(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{ borderColor: "#ddd" }}>
          <option value="">Select unit\u2026</option>
          {fleet.trailers.filter(x => !trailers.includes(x.reg)).map(x => <option key={x.reg} value={x.reg}>{x.reg}</option>)}
        </select>
        <button onClick={addTrailer} disabled={!pickT} className="px-4 rounded-lg text-white font-semibold disabled:opacity-40" style={{ background: DARK }}>Add</button>
      </div>
      {trailers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {trailers.map(r => (
            <span key={r} className="text-xs px-2 py-1 rounded-full bg-gray-100 flex items-center gap-1">{r}
              <button onClick={() => setTrailers(trailers.filter(x => x !== r))} className="text-gray-400 font-bold">{"\u00d7"}</button>
            </span>
          ))}
        </div>
      )}

      <button disabled={!v || !tt} onClick={go} className="w-full mt-4 py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>
        Continue to pre-trip checklist
      </button>
    </div>
  );
}

function TripFlow({ trip, updTrip, submitChecklist }) {
  if (trip.status === "assigned") return <ChecklistStep {...{ trip, submitChecklist }} />;
  if (trip.status === "checklist_done") return <AwaitStep {...{ trip, updTrip }} />;
  if (trip.status === "awaiting") return <AwaitNextStep {...{ trip, updTrip }} />;
  return <RunStep {...{ trip, updTrip }} />;
}

function AwaitNextStep({ trip, updTrip }) {
  const endShift = () => updTrip(trip.id, t => ({ ...t, status: "closed", timeline: [...t.timeline, { e: "Shift ended / vehicle released", ts: Date.now() }] }));
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-5 border shadow-sm text-center" style={{ borderColor: "#e5e5e5" }}>
        <div className="text-4xl mb-2">{"\u2705"}</div>
        <h3 className="font-bold" style={{ color: DARK }}>POD approved</h3>
        <p className="text-sm text-gray-500 mt-1">{trip.vehicle} + {trailerLabel(trip)}</p>
        <div className="text-sm mt-3 rounded-lg p-3" style={{ background: "#eef4ff", color: "#0b69c7" }}>{"\u23f3"} Awaiting your next instruction from base. This screen updates automatically.</div>
      </div>
      <button onClick={endShift} className="w-full py-2.5 rounded-xl font-semibold border" style={{ borderColor: "#ddd", color: "#666", background: "#fff" }}>End shift / change vehicle</button>
    </div>
  );
}

function ChecklistStep({ trip, submitChecklist }) {
  const [ans, setAns] = useState({});
  const [photos, setPhotos] = useState({});
  const set = (id, patch) => setAns(a => ({ ...a, [id]: { ...a[id], ...patch } }));
  const answered = ALL_ITEMS.every(i => ans[i.id]?.status);
  const failsNeedNote = ALL_ITEMS.filter(i => ans[i.id]?.status === "fail" && !ans[i.id]?.note?.trim());
  const photoCount = ANGLES.filter(([k]) => photos[k]).length;
  const hasDefect = ALL_ITEMS.some(i => ans[i.id]?.status === "fail");
  const canComplete = answered && failsNeedNote.length === 0;

  const complete = () => {
    const defects = ALL_ITEMS.filter(i => ans[i.id]?.status === "fail")
      .map(i => ({ id: i.id, label: i.label, critical: i.critical, note: ans[i.id].note }));
    submitChecklist(trip.id, { items: ans, defects, vehiclePhotos: photos, criticalFail: defects.some(d => d.critical), completedAt: Date.now() });
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3 text-sm" style={{ borderColor: "#e5e5e5" }}>
        <span className="font-semibold">{trip.vehicle}</span> + <span className="font-semibold">{trailerLabel(trip)}</span>
        <div className="text-xs text-gray-500 mt-1">Complete every item to receive your instruction. Photos are optional - capture any side that shows damage. Standards: 6.5 bar / 4 mm.</div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Damage photos <span className="font-normal normal-case text-gray-400">- optional, only if there's damage</span></div>
        <div className="bg-white rounded-xl border shadow-sm p-3 grid grid-cols-2 gap-2" style={{ borderColor: "#e5e5e5" }}>
          {ANGLES.map(([k, lbl]) => (
            <div key={k} className="rounded-lg border p-2 flex flex-col items-center gap-1.5" style={{ borderColor: photos[k] ? "#0a7d3f" : "#ddd" }}>
              <div className="text-xs font-semibold" style={{ color: DARK }}>{lbl}</div>
              {photos[k]
                ? <img src={photos[k]} className="h-20 w-full object-cover rounded-md" alt={lbl} />
                : <div className="h-20 w-full rounded-md flex items-center justify-center text-2xl" style={{ background: "#f4f4f5" }}>{"\ud83d\udcf7"}</div>}
              <PhotoButton label={photos[k] ? "Retake" : "Capture"} onPhoto={b => setPhotos(p => ({ ...p, [k]: b }))} />
            </div>
          ))}
        </div>
        {hasDefect && photoCount === 0 && (
          <div className="text-xs mt-2 font-semibold" style={{ color: RED }}>You've logged a defect - please photograph the damage.</div>
        )}
      </div>

      {CHECKLIST.map(g => (
        <div key={g.group} className="mb-3">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{g.group}</div>
          <div className="bg-white rounded-xl border shadow-sm divide-y" style={{ borderColor: "#e5e5e5" }}>
            {g.items.map(i => {
              const a = ans[i.id] || {};
              return (
                <div key={i.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm flex-1">{i.label}{i.critical && <span className="ml-1 text-[10px] font-bold" style={{ color: RED }}>CRITICAL</span>}</div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => set(i.id, { status: "pass" })} className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: a.status === "pass" ? "#0a7d3f" : "#eee", color: a.status === "pass" ? "#fff" : "#888" }}>{"\u2713"}</button>
                      <button onClick={() => set(i.id, { status: "fail" })} className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: a.status === "fail" ? RED : "#eee", color: a.status === "fail" ? "#fff" : "#888" }}>{"\u2717"}</button>
                    </div>
                  </div>
                  {a.status === "fail" && (
                    <div className="mt-2">
                      <input value={a.note || ""} onChange={e => set(i.id, { note: e.target.value })} placeholder="Describe the defect (required)" className="w-full px-2 py-1.5 rounded-lg border text-xs" style={{ borderColor: RED }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl p-3 border shadow-sm sticky bottom-2" style={{ borderColor: "#e5e5e5" }}>
        <div className="text-xs text-gray-500 mb-2">
          {ALL_ITEMS.filter(i => ans[i.id]?.status).length} / {ALL_ITEMS.length} checked \u00b7 {photoCount} damage photo{photoCount === 1 ? "" : "s"}
          {failsNeedNote.length ? ` \u2013 ${failsNeedNote.length} defect note(s) needed` : ""}
        </div>
        <button disabled={!canComplete} onClick={complete} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>
          Submit checklist & request instruction
        </button>
      </div>
    </div>
  );
}

function AwaitStep({ trip, updTrip }) {
  const request = () => updTrip(trip.id, t => ({ ...t, requested: true, timeline: [...t.timeline, { e: "Instruction requested from base", ts: Date.now() }] }));
  const cf = trip.checklist?.criticalFail;
  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm text-center" style={{ borderColor: "#e5e5e5" }}>
      <div className="text-4xl mb-2">{"\u2705"}</div>
      <h3 className="font-bold" style={{ color: DARK }}>Checklist complete</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{trip.vehicle} + {trailerLabel(trip)}</p>
      {trip.checklist?.defects?.length > 0 && (
        <div className="text-xs text-left rounded-lg p-3 mb-4" style={{ background: cf ? "#fdecec" : "#fff7e6", color: cf ? RED : "#8a6d00" }}>
          {trip.checklist.defects.length} defect(s) logged{cf ? " \u2013 includes CRITICAL items. Base must authorise departure." : "."}
        </div>
      )}
      {!trip.requested
        ? <button onClick={request} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: RED }}>Request instruction from base</button>
        : <div className="text-sm text-gray-500">{"\u23f3"} Waiting for base to issue your loading instruction\u2026<div className="text-xs mt-1">This screen updates automatically.</div></div>}
    </div>
  );
}

function RunStep({ trip, updTrip }) {
  const ins = trip.instruction;
  const [note, setNote] = useState("");
  const [pending, setPending] = useState([]);
  const [receiver, setReceiver] = useState(trip.receiver || "");
  const [sig, setSig] = useState(trip.signature || null);

  const addPhoto = async (b) => { const loc = await getLoc(); setPending(p => [...p, { b, loc }]); };
  const addLoadPhoto = (b) => updTrip(trip.id, t => ({ ...t, loadPhotos: [...(t.loadPhotos || []), b] }));
  const loadPics = trip.loadPhotos || [];
  const savePod = () => {
    if (!pending.length && !note.trim()) return;
    updTrip(trip.id, t => ({ ...t, pods: [...t.pods, { id: uid(), photos: pending.map(p => p.b), note, location: pending[0]?.loc || null, ts: Date.now() }],
      timeline: [...t.timeline, { e: `POD captured (${pending.length} photo${pending.length === 1 ? "" : "s"})`, ts: Date.now() }] }));
    setPending([]); setNote("");
  };
  const advance = (status, label) => updTrip(trip.id, t => ({ ...t, status, timeline: [...t.timeline, { e: label, ts: Date.now() }] }));
  const saveSignoff = () => updTrip(trip.id, t => ({ ...t, receiver, signature: sig,
    timeline: [...t.timeline, { e: `Delivery signed off - received by ${receiver || "n/a"}`, ts: Date.now() }] }));

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 text-white" style={{ background: STATUS[trip.status].c }}>
        <div className="text-xs opacity-80">Current status</div>
        <div className="font-bold">{STATUS[trip.status].label}</div>
      </div>

      {ins && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e5e5" }}>
          <div className="px-3 py-2 text-white text-sm font-bold flex justify-between" style={{ background: DARK }}>
            <span>Instruction from base</span><span className="opacity-70">{ins.ref}</span>
          </div>
          <div className="p-3 text-sm">
            {(ins.bookingNo || ins.bookingTime) && (<>
              <div className="font-bold text-xs uppercase tracking-wide mb-1" style={{ color: RED }}>Booking</div>
              <Row k="Booking #" v={ins.bookingNo} /><Row k="Booking time" v={ins.bookingTime} />
            </>)}
            <div className="font-bold text-xs uppercase tracking-wide mt-3 mb-1" style={{ color: RED }}>Loading</div>
            <Row k="Load type" v={ins.loadType} /><Row k="Site" v={ins.loadSite} /><Row k="Contact" v={ins.loadContact} /><Row k="Cargo" v={ins.cargo} /><Row k="Time" v={ins.loadTime} />{ins.loadNotes && <Row k="Notes" v={ins.loadNotes} />}
            <div className="font-bold text-xs uppercase tracking-wide mt-3 mb-1" style={{ color: RED }}>Offloading</div>
            <Row k="Destination" v={ins.offSite} /><Row k="Contact" v={ins.offContact} />{ins.offReq && <Row k="Requirements" v={ins.offReq} />}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
        {trip.status === "instructed" && <button onClick={() => advance("started", "Trip accepted by driver - en route to load")} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: RED }}>Accept trip</button>}
        {trip.status === "started" && <>
          <button onClick={() => advance("loaded", `Confirmed loaded - ${loadPics.length} load photos`)} disabled={loadPics.length < 3} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Confirm loaded</button>
          {loadPics.length < 3 && <div className="text-center text-xs mt-2" style={{ color: "#8a6d00" }}>Add at least 3 load photos below ({loadPics.length}/3) to confirm loaded.</div>}
        </>}
        {trip.status === "loaded" && <button onClick={() => advance("in_transit", "Trip started - in transit")} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: RED }}>Start trip</button>}
        {trip.status === "in_transit" && <button onClick={() => advance("delivered", "Arrived & marked delivered")} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: RED }}>Arrived - mark delivered</button>}
        {trip.status === "delivered" && <div className="text-center text-sm" style={{ color: "#b58100" }}>{"\u2705"} Delivered. Capture your POD below - base will approve it to release your next instruction.</div>}
      </div>

      {(trip.status === "started" || loadPics.length > 0) && (
        <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: trip.status === "started" && loadPics.length < 3 ? RED : "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Load photos {trip.status === "started" && <span className="text-xs font-normal text-gray-400">min 3 to confirm loaded</span>}</div>
          <div className="flex gap-2 flex-wrap mb-2 items-center">
            {loadPics.map((p, i) => <img key={i} src={p} className="h-16 rounded-lg border" style={{ borderColor: "#ddd" }} alt="" />)}
            {trip.status === "started" && <PhotoButton label={"\ud83d\udcf7 Add load photo"} onPhoto={addLoadPhoto} />}
          </div>
          {trip.status === "started" && <div className="text-xs" style={{ color: loadPics.length >= 3 ? "#0a7d3f" : "#8a6d00" }}>{loadPics.length} / 3 minimum{loadPics.length >= 3 ? " \u2713" : ""}</div>}
        </div>
      )}

      {["in_transit", "delivered"].includes(trip.status) && (
        <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: trip.status === "delivered" ? RED : "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Proof of delivery / documents</div>
          <div className="flex gap-2 flex-wrap mb-2 items-center">
            {pending.map((p, i) => <img key={i} src={p.b} className="h-16 rounded-lg border" style={{ borderColor: "#ddd" }} alt="" />)}
            <PhotoButton label={"\ud83d\udcf7 Take photo"} onPhoto={addPhoto} />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reference / note (e.g. waybill no.)" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
          <button onClick={savePod} disabled={!pending.length && !note.trim()} className="w-full py-2 rounded-lg font-semibold text-white disabled:opacity-40" style={{ background: DARK }}>Upload POD</button>
          {trip.pods.length > 0 && <div className="text-xs text-gray-500 mt-2">{trip.pods.length} POD record(s) uploaded for this trip.</div>}
        </div>
      )}

      {trip.status === "delivered" && (
        <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Receiver sign-off</div>
          {!trip.pods.length && <div className="text-xs mb-2" style={{ color: RED }}>Upload at least one POD photo above.</div>}
          <input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Received by (name)" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
          <div className="text-xs text-gray-500 mb-1">Receiver signature</div>
          <SignaturePad onChange={setSig} />
          <button onClick={saveSignoff} className="w-full py-2.5 mt-2 rounded-lg font-bold text-white" style={{ background: DARK }}>Save sign-off</button>
          {trip.signature && <div className="text-[11px] mt-2" style={{ color: "#0a7d3f" }}>{"\u2713"} Sign-off saved{trip.receiver ? ` - ${trip.receiver}` : ""}. Waiting for base to approve your POD.</div>}
        </div>
      )}

      <Timeline t={trip} />
    </div>
  );
}

const Row = ({ k, v }) => v ? <div className="flex gap-2 py-0.5"><span className="text-gray-400 w-24 shrink-0">{k}</span><span className="font-medium">{v}</span></div> : null;
const Line = ({ k, v }) => (
  <div className="flex justify-between"><span className="text-gray-500">{k}</span><span style={{ color: v < 0 ? RED : "#333" }}>{v < 0 ? "\u2212" : ""}{rand(Math.abs(v))}</span></div>
);
const Stat = ({ n, l, hot }) => (
  <div className="rounded-xl p-2 text-center bg-white border shadow-sm" style={{ borderColor: hot ? RED : "#e5e5e5" }}>
    <div className="text-xl font-extrabold" style={{ color: hot ? RED : DARK }}>{n}</div>
    <div className="text-[10px] text-gray-500">{l}</div>
  </div>
);
const I = ({ label, v, on, ph }) => (
  <div className="mb-1.5">
    <label className="text-[10px] font-semibold text-gray-500">{label}</label>
    <input value={v} onChange={e => on(e.target.value)} placeholder={ph || ""} className="w-full px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
  </div>
);
function NB({ v, on, w }) {
  const [s, setS] = useState(String(v));
  return <input value={s} inputMode="decimal" onChange={e => { setS(e.target.value); const n = e.target.value === "" ? 0 : Number(e.target.value); if (!isNaN(n)) on(n); }} className={(w || "w-16") + " px-1.5 py-1 rounded border text-xs text-right"} style={{ borderColor: "#ddd" }} />;
}
const ESection = ({ title, children }) => <div className="mb-3"><div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{title}</div>{children}</div>;
const EField = ({ label, children }) => <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-600">{label}</span>{children}</div>;

function Timeline({ t }) {
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
      <div className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Trip log</div>
      <div className="space-y-1.5">
        {t.timeline.map((e, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="text-gray-400 w-24 shrink-0">{fmt(e.ts)}</span>
            <span>{e.e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ OPS / CONTROL ROOM ============
function OpsView({ data, fleet, updTrip, saveFleet, opsTrip, setOpsTrip, approvePod }) {
  const [tab, setTab] = useState("trips");
  const sel = opsTrip ? data.trips.find(t => t.id === opsTrip) : null;
  const customers = [...new Set(data.trips.flatMap(t => [t.instruction?.customer, t.instruction?.customer2]).filter(Boolean))].sort();
  if (sel) return <OpsTrip {...{ trip: sel, updTrip, fleet, customers, back: () => setOpsTrip(null) }} />;

  const awaitingPod = data.trips.filter(t => t.status === "delivered").length;

  return (
    <div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { k: "trips", label: "Trips" },
        { k: "pods", label: "POD Approvals", badge: awaitingPod || null },
      ]} />
      {tab === "trips" && <OpsTrips {...{ data, fleet, setOpsTrip, saveFleet }} />}
      {tab === "pods" && <PodApprovals {...{ data, updTrip, approvePod }} />}
    </div>
  );
}

function AdminView({ data, fleet, rates, updTrip, decideLeave, saveBalances, savePayslip, saveRates, saveTenure, addAnnouncement, removeAnnouncement }) {
  const [tab, setTab] = useState("leave");
  const [priceId, setPriceId] = useState(null);
  const sel = priceId ? data.trips.find(t => t.id === priceId) : null;
  if (sel) return <PriceTrip {...{ trip: sel, updTrip, fleet, rates, saveTenure, back: () => setPriceId(null) }} />;

  const pendingLeave = (data.leave || []).filter(l => l.status === "pending").length;
  const toPrice = data.trips.filter(t => t.status === "closed" && t.instruction && t.pay?.status !== "approved").length;

  return (
    <div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { k: "leave", label: "Leave", badge: pendingLeave || null },
        { k: "payroll", label: "Payroll", badge: toPrice || null },
        { k: "announce", label: "Announce" },
      ]} />
      {tab === "leave" && <LeaveOps {...{ data, fleet, decideLeave, saveBalances }} />}
      {tab === "payroll" && <WagesOps {...{ data, rates, setPriceTrip: setPriceId, savePayslip, saveRates }} />}
      {tab === "announce" && <AnnounceCompose {...{ data, addAnnouncement, removeAnnouncement }} />}
    </div>
  );
}

function OpsTrips({ data, fleet, setOpsTrip, saveFleet }) {
  const [leg, setLeg] = useState("import");
  const trips = data.trips;
  const active = trips.filter(t => !["delivered", "closed"].includes(t.status));
  const awaitingCount = trips.filter(t => t.status === "checklist_done").length;
  const defects = trips.filter(t => t.checklist?.defects?.length);
  const today = trips.filter(t => ["delivered", "closed"].includes(t.status) && new Date(t.timeline.at(-1).ts).toDateString() === new Date().toDateString());

  const pending = trips.filter(t => !t.instruction && t.status !== "closed");
  const legged = trips.filter(t => t.instruction && (t.instruction.leg || "local") === leg);
  const legCount = (k) => trips.filter(t => t.instruction && (t.instruction.leg || "local") === k && t.status !== "closed").length;

  const card = (t) => {
    const s = STATUS[t.status];
    const cf = t.checklist?.criticalFail;
    return (
      <button key={t.id} onClick={() => setOpsTrip(t.id)} className="w-full text-left bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: cf ? RED : "#e5e5e5" }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold" style={{ color: DARK }}>{t.driver}</div>
            <div className="text-xs text-gray-500">{t.vehicle || "\u2013"} + {trailerLabel(t)}</div>
            {t.instruction && <div className="text-[11px] text-gray-400">{[[t.instruction.customer, t.instruction.customer2].filter(Boolean).join(" + "), t.instruction.loadType].filter(Boolean).join(" \u00b7 ")}</div>}
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: s.c }}>{s.label}</span>
        </div>
        <div className="flex gap-2 mt-2 text-[10px] font-semibold flex-wrap">
          {((t.status === "checklist_done" && t.requested) || t.status === "awaiting") && <span className="px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>NEEDS INSTRUCTION</span>}
          {t.status === "delivered" && <span className="px-2 py-0.5 rounded-full text-white" style={{ background: "#b58100" }}>POD REVIEW</span>}
          {t.status === "closed" && <span className="px-2 py-0.5 rounded-full" style={{ background: "#eafaf0", color: "#0a7d3f" }}>COMPLETED</span>}
          {t.checklist?.defects?.length > 0 && <span className="px-2 py-0.5 rounded-full" style={{ background: cf ? "#fdecec" : "#fff7e6", color: cf ? RED : "#8a6d00" }}>{t.checklist.defects.length} defect{t.checklist.defects.length > 1 ? "s" : ""}</span>}
          {t.pods?.length > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.pods.length} POD</span>}
          {t.pay?.status === "approved" && <span className="px-2 py-0.5 rounded-full" style={{ background: "#eafaf0", color: "#0a7d3f" }}>{rand(t.pay.total)}</span>}
        </div>
      </button>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat n={active.length} l="Active" />
        <Stat n={awaitingCount} l="Awaiting" hot={awaitingCount > 0} />
        <Stat n={defects.length} l="Defects" hot={defects.length > 0} />
        <Stat n={today.length} l="Delivered" />
      </div>

      {pending.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Awaiting instruction <span className="font-normal normal-case">(assign a leg when you issue)</span></div>
          <div className="space-y-2">{pending.map(card)}</div>
        </div>
      )}

      <Tabs value={leg} onChange={setLeg} tabs={LEGS.map(([k, label]) => ({ k, label, badge: legCount(k) || null }))} />
      <div className="text-[11px] text-gray-400 -mt-2 mb-2">{leg === "import" ? "Up-country (ex-port inland)" : leg === "export" ? "Down to port" : "Local / metro"}</div>

      {legged.length === 0
        ? <div className="text-sm text-gray-400 bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e5e5" }}>No {LEG_LABEL[leg].toLowerCase()} trips yet.</div>
        : <div className="space-y-2">{legged.map(card)}</div>}

      <FleetAdmin {...{ fleet, saveFleet }} />
    </div>
  );
}

function RateEditor({ rates, saveRates }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(null);
  const start = () => { setD(JSON.parse(JSON.stringify(rates))); setOpen(true); };
  const upd = (fn) => setD(prev => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });

  if (!open) return <button onClick={start} className="text-sm underline text-gray-500 mb-3">Edit rate sheet</button>;

  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm mb-4" style={{ borderColor: RED }}>
      <div className="flex justify-between items-center mb-3">
        <div className="font-bold text-sm" style={{ color: DARK }}>Edit rate sheet</div>
        <div className="flex gap-2">
          <button onClick={() => { setOpen(false); setD(null); }} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: "#ddd" }}>Cancel</button>
          <button onClick={() => { saveRates(d); setOpen(false); setD(null); }} className="text-xs px-3 py-1 rounded-lg text-white font-semibold" style={{ background: "#0a7d3f" }}>Save</button>
        </div>
      </div>

      <ESection title="Trip rate by trailer & tenure">
        <div className="flex gap-1 mb-1">
          <div className="flex-1" />
          {TENURE_SHORT.map((b, i) => <div key={i} className="w-16 text-[8px] text-gray-400 text-center">{b}</div>)}
        </div>
        {Object.keys(d.trailers).map(tt => (
          <div key={tt} className="mb-2 pb-2 border-b" style={{ borderColor: "#f0f0f0" }}>
            <div className="flex items-center gap-1 mb-1">
              <div className="flex-1 text-xs font-semibold" style={{ color: DARK }}>{tt}</div>
              {d.trailers[tt].rates.map((rt, i) => <NB key={i} v={rt} on={v => upd(n => { n.trailers[tt].rates[i] = v; })} />)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>Basic</span><NB v={d.trailers[tt].basic} on={v => upd(n => { n.trailers[tt].basic = v; })} w="w-20" />
              <span>Food</span><NB v={d.trailers[tt].food} on={v => upd(n => { n.trailers[tt].food = v; })} w="w-14" />
              <span>Sleep</span><NB v={d.trailers[tt].sleepover} on={v => upd(n => { n.trailers[tt].sleepover = v; })} w="w-14" />
            </div>
          </div>
        ))}
      </ESection>

      <ESection title="Long-haul lanes (Tri / Link / I-Link)">
        {d.lanes.map((l, i) => (
          <div key={l.k} className="flex items-center gap-1 mb-1">
            <div className="flex-1 text-xs">{l.label}</div>
            <NB v={l.tri} on={v => upd(n => { n.lanes[i].tri = v; })} />
            <NB v={l.link} on={v => upd(n => { n.lanes[i].link = v; })} />
            <NB v={l.ilink} on={v => upd(n => { n.lanes[i].ilink = v; })} />
          </div>
        ))}
      </ESection>

      <ESection title="Cross-border (flat)">
        {d.crossBorder.map((l, i) => (
          <EField key={l.k} label={l.label}><NB v={l.amt} on={v => upd(n => { n.crossBorder[i].amt = v; })} w="w-20" /></EField>
        ))}
      </ESection>

      <ESection title="Adjustments">
        {d.adjustments.map((a, i) => (
          <EField key={a.k} label={a.label}><NB v={a.amt} on={v => upd(n => { n.adjustments[i].amt = v; })} w="w-20" /></EField>
        ))}
      </ESection>

      <ESection title="Allowances & rules">
        <EField label="Daily local rate"><NB v={d.dailyRate} on={v => upd(n => { n.dailyRate = v; })} w="w-20" /></EField>
        <EField label="Saturday multiplier"><NB v={d.satMult} on={v => upd(n => { n.satMult = v; })} w="w-16" /></EField>
        <EField label="Sunday multiplier"><NB v={d.sunMult} on={v => upd(n => { n.sunMult = v; })} w="w-16" /></EField>
        <EField label="Breakbulk premium"><NB v={d.breakbulkPremium} on={v => upd(n => { n.breakbulkPremium = v; })} w="w-20" /></EField>
        <EField label="Food cap (monthly)"><NB v={d.foodCap} on={v => upd(n => { n.foodCap = v; })} w="w-20" /></EField>
      </ESection>
    </div>
  );
}

function WagesOps({ data, rates, setPriceTrip, savePayslip, saveRates }) {
  const months = [...new Set(data.trips.map(t => monthKey(t.createdAt)))].sort().reverse();
  const [ym, setYm] = useState(months[0] || monthKey(Date.now()));
  const [driver, setDriver] = useState(null);

  if (driver) return <Payslip {...{ data, rates, ym, driver, back: () => setDriver(null), setPriceTrip, savePayslip }} />;

  const drivers = [...new Set(data.trips.filter(t => monthKey(t.createdAt) === ym && t.instruction).map(t => t.driver))];
  return (
    <div>
      <RateEditor {...{ rates, saveRates }} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500">Month</span>
        <select value={ym} onChange={e => setYm(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
          {(months.length ? months : [ym]).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>
      <button onClick={() => exportLoads(data.trips, ym)} className="w-full mb-3 py-2.5 rounded-lg font-bold text-white" style={{ background: DARK }}>Export loads to Excel ({monthLabel(ym)})</button>
      <h3 className="font-bold mb-2" style={{ color: DARK }}>Driver wages</h3>
      {drivers.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e5e5" }}>No trips logged this month.</div>}
      <div className="space-y-2">
        {drivers.map(dr => {
          const p = computePayslip(data, dr, ym, rates);
          const unpaid = p.trips.filter(t => t.status === "delivered" && t.pay?.status !== "approved").length;
          return (
            <button key={dr} onClick={() => setDriver(dr)} className="w-full text-left bg-white rounded-xl p-3 border shadow-sm flex justify-between items-center" style={{ borderColor: p.finalisedAt ? "#0a7d3f" : "#e5e5e5" }}>
              <div>
                <div className="font-bold" style={{ color: DARK }}>{dr}</div>
                <div className="text-xs text-gray-500">{p.approved.length} trip(s) priced{unpaid ? ` \u00b7 ${unpaid} pending` : ""}{p.mainTrailer ? ` \u00b7 ${p.mainTrailer}` : ""}</div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: "#0a7d3f" }}>{rand(p.net)}</div>
                <div className="text-[10px] text-gray-400">{p.finalisedAt ? "finalised" : "net"}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Payslip({ data, rates, ym, driver, back, setPriceTrip, savePayslip }) {
  const p = computePayslip(data, driver, ym, rates);
  const key = `${driver}|${ym}`;
  const [basic, setBasic] = useState(String(p.basic));
  const [ded, setDed] = useState(String(p.deductions));
  const [by, setBy] = useState(p.checkedBy);
  useEffect(() => { setBasic(String(p.basic)); setDed(String(p.deductions)); setBy(p.checkedBy); }, [driver, ym]);

  const basicN = Number(basic) || 0;
  const tripTotal = p.tripTotal;
  const excess = Math.max(0, tripTotal - basicN);
  const gross = Math.max(basicN, tripTotal) + p.foodCapped + p.sleepover;
  const net = gross - (Number(ded) || 0);
  const save = (finalise) => savePayslip(key, { basic: basicN, deductions: Number(ded) || 0, checkedBy: by, ...(finalise ? { finalisedAt: Date.now() } : {}) });

  const L = ({ k, v, bold, color }) => (
    <div className="flex justify-between py-1" style={{ borderTop: bold ? "1px solid #e5e5e5" : "none" }}>
      <span className={bold ? "font-bold" : "text-gray-600"} style={{ color: bold ? DARK : undefined }}>{k}</span>
      <span className="font-semibold" style={{ color: color || DARK }}>{rand(v)}</span>
    </div>
  );

  return (
    <div>
      <button onClick={back} className="text-sm mb-3 underline text-gray-500">{"\u2039"} All drivers</button>
      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
        <div className="font-bold text-lg" style={{ color: DARK }}>{driver}</div>
        <div className="text-sm text-gray-500">{monthLabel(ym)} \u00b7 {p.mainTrailer || "\u2013"}</div>
      </div>

      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3 text-sm" style={{ borderColor: "#e5e5e5" }}>
        <L k="Trip earnings (excl. food & sleepover)" v={p.income} />
        <L k="Trip total" v={tripTotal} bold />
        <div className="flex justify-between items-center py-1 mt-1">
          <span className="text-gray-600">Guaranteed basic ({p.mainTrailer || "set"})</span>
          <input type="number" value={basic} onChange={e => setBasic(e.target.value)} className="w-24 px-2 py-1 rounded border text-sm text-right" style={{ borderColor: "#ddd" }} />
        </div>
        <L k="Trip allowance / overtime" v={excess} />
        <L k={`Food (capped ${rand(rates.foodCap)})`} v={p.foodCapped} />
        <L k="Sleepover" v={p.sleepover} />
        <L k="Gross pay" v={gross} bold color="#0a7d3f" />
        <div className="flex justify-between items-center py-1 mt-1" style={{ borderTop: "1px solid #e5e5e5" }}>
          <span className="text-gray-600">Loans / fines</span>
          <input type="number" value={ded} onChange={e => setDed(e.target.value)} className="w-24 px-2 py-1 rounded border text-sm text-right" style={{ borderColor: "#ddd" }} />
        </div>
        <L k="Net pay (less deductions)" v={net} bold color={RED} />
      </div>

      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
        <label className="text-[10px] font-semibold text-gray-500">Checked by</label>
        <input value={by} onChange={e => setBy(e.target.value)} placeholder="e.g. Aven Naidu" className="w-full mt-1 mb-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
        <div className="flex gap-2">
          <button onClick={() => save(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-white" style={{ background: DARK }}>Save</button>
          <button onClick={() => save(true)} className="flex-1 py-2.5 rounded-lg font-bold text-white" style={{ background: "#0a7d3f" }}>Finalise</button>
        </div>
        {p.finalisedAt && <div className="text-[11px] text-center mt-2" style={{ color: "#0a7d3f" }}>Finalised {fmt(p.finalisedAt)}</div>}
      </div>

      <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Trips this month</div>
      <div className="space-y-2">
        {p.trips.filter(t => t.instruction).map(t => (
          <button key={t.id} onClick={() => setPriceTrip(t.id)} className="w-full text-left bg-white rounded-xl p-3 border shadow-sm flex justify-between items-center" style={{ borderColor: t.pay?.status === "approved" ? "#0a7d3f" : RED }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{t.instruction ? `${t.instruction.loadSite} \u2192 ${t.instruction.offSite}` : STATUS[t.status].label}</div>
              <div className="text-xs text-gray-500">{fmtDate(new Date(t.createdAt).toISOString())} \u00b7 {t.trailerType}{t.instruction?.loadType ? ` \u00b7 ${t.instruction.loadType}` : ""}</div>
            </div>
            {t.pay?.status === "approved"
              ? <span className="text-sm font-bold" style={{ color: "#0a7d3f" }}>{rand(t.pay.total)}</span>
              : <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: "#b58100" }}>Price</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeaveOps({ data, fleet, decideLeave, saveBalances }) {
  const leave = data.leave || [];
  const pending = leave.filter(l => l.status === "pending");
  const history = leave.filter(l => l.status !== "pending");
  const [approver, setApprover] = useState("");
  const [editBal, setEditBal] = useState(false);
  const [draft, setDraft] = useState({});

  const openBal = () => { const m = {}; fleet.drivers.forEach(d => { m[d] = getBal(fleet, d); }); setDraft(m); setEditBal(true); };
  const setD = (driver, key, val) => setDraft(o => ({ ...o, [driver]: { ...o[driver], [key]: Number(val) || 0 } }));
  const saveBal = () => { saveBalances(draft); setEditBal(false); };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
        <label className="text-xs font-semibold text-gray-500">Approved / declined by</label>
        <input value={approver} onChange={e => setApprover(e.target.value)} placeholder="Manager name (e.g. Sharitha Naidoo)" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Pending approval</div>
        {pending.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-3 border" style={{ borderColor: "#e5e5e5" }}>No leave requests waiting.</div>}
        <div className="space-y-2">
          {pending.map(l => {
            const bal = getBal(fleet, l.driver);
            const key = LEAVE_KEY[l.type];
            const over = key && l.days > bal[key];
            return (
              <div key={l.id} className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: over ? RED : "#e5e5e5" }}>
                <div className="font-bold" style={{ color: DARK }}>{l.driver}</div>
                <div className="text-sm">{l.type} \u2013 {l.days} day{l.days > 1 ? "s" : ""}</div>
                <div className="text-xs text-gray-500">{fmtDate(l.from)} \u2192 {fmtDate(l.to)}</div>
                {l.reason && <div className="text-xs text-gray-400 mt-0.5">{l.reason}</div>}
                {key && <div className="text-[11px] mt-1" style={{ color: over ? RED : "#666" }}>Balance: {bal[key]} {BAL_LABEL[key].toLowerCase()} days{over ? " \u2013 exceeds balance" : ""}</div>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => decideLeave(l.id, true, approver)} className="flex-1 py-2 rounded-lg text-white text-sm font-bold" style={{ background: "#0a7d3f" }}>Approve</button>
                  <button onClick={() => decideLeave(l.id, false, approver)} className="flex-1 py-2 rounded-lg text-white text-sm font-bold" style={{ background: RED }}>Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Leave balances</div>
          <button onClick={editBal ? saveBal : openBal} className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{ background: editBal ? "#0a7d3f" : DARK }}>{editBal ? "Save" : "Edit"}</button>
        </div>
        <div className="bg-white rounded-xl border shadow-sm divide-y" style={{ borderColor: "#e5e5e5" }}>
          {fleet.drivers.map(d => {
            const b = editBal ? (draft[d] || getBal(fleet, d)) : getBal(fleet, d);
            return (
              <div key={d} className="p-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold flex-1" style={{ color: DARK }}>{d}</div>
                {["annual", "sick", "family"].map(k => (
                  <div key={k} className="text-center w-14">
                    {editBal
                      ? <input type="number" value={b[k]} onChange={e => setD(d, k, e.target.value)} className="w-full px-1 py-1 rounded border text-sm text-center" style={{ borderColor: "#ddd" }} />
                      : <div className="font-bold text-sm">{b[k]}</div>}
                    <div className="text-[9px] text-gray-400">{BAL_LABEL[k]}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">History</div>
          <div className="space-y-2">
            {history.map(l => (
              <div key={l.id} className="bg-white rounded-xl p-3 border shadow-sm flex justify-between items-start" style={{ borderColor: "#e5e5e5" }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: DARK }}>{l.driver} \u2013 {l.type}</div>
                  <div className="text-xs text-gray-500">{fmtDate(l.from)} \u2192 {fmtDate(l.to)} \u00b7 {l.days}d</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">By {l.decidedBy}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white capitalize" style={{ background: LEAVE_STATUS[l.status] }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PayCard({ trip, updTrip, fleet, rates, saveTenure }) {
  const r = rates.trailers[trip.trailerType];
  const rigKey = RIG[trip.trailerType] || "tri";
  const isBB = trip.instruction?.loadType === "Breakbulk";
  const ex = trip.pay;
  const [payMode, setPayMode] = useState(ex?.mode || "trip");
  const [tenure, setTenure] = useState(ex?.tenureIdx ?? (fleet.tenure?.[trip.driver] ?? 0));
  const [dir, setDir] = useState(ex?.direction || "UP");
  const [baseOv, setBaseOv] = useState(ex?.base != null && ex?.mode !== "daily" ? String(ex.base) : "");
  const [laneK, setLaneK] = useState(ex?.laneK || "");
  const [adj, setAdj] = useState(ex?.adj || []);
  const [bb, setBb] = useState(ex ? !!ex.bbPremium : isBB);
  const [foodDays, setFoodDays] = useState(ex?.foodDays ?? 0);
  const [sleepovers, setSleepovers] = useState(ex?.sleepovers ?? 0);
  const [by, setBy] = useState(ex?.approvedBy || "");
  const [nd, setNd] = useState(ex?.normalDays ?? 0);
  const [sat, setSat] = useState(ex?.saturdays ?? 0);
  const [sun, setSun] = useState(ex?.sundays ?? 0);
  const [finalTouched, setFinalTouched] = useState(!!ex?.overridden);
  const [finalStr, setFinalStr] = useState(ex?.total != null ? String(ex.total) : "");

  const toggleAdj = (k) => setAdj(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k]);
  const baseAuto = r ? r.rates[tenure] : 0;
  const base = baseOv !== "" ? Number(baseOv) : baseAuto;
  const lane = [...rates.lanes, ...rates.crossBorder].find(l => l.k === laneK);
  const laneAmt = lane ? (lane.amt != null ? lane.amt : lane[rigKey]) : 0;
  const bbAmt = bb ? rates.breakbulkPremium : 0;
  const adjAmt = adj.reduce((s, k) => s + (rates.adjustments.find(a => a.k === k)?.amt || 0), 0) + laneAmt + bbAmt;
  const food = (r ? r.food : 0) * foodDays;
  const sleep = (r ? r.sleepover : 0) * sleepovers;
  const tripTotal = base + adjAmt + food + sleep;
  const dailyTotal = nd * rates.dailyRate + sat * rates.dailyRate * rates.satMult + sun * rates.dailyRate * rates.sunMult;
  const total = payMode === "daily" ? dailyTotal : tripTotal;
  const suggested = total;
  const finalAmt = finalTouched ? (Number(finalStr) || 0) : suggested;

  const approve = () => {
    const pay = payMode === "daily"
      ? { mode: "daily", normalDays: nd, saturdays: sat, sundays: sun, dailyRate: rates.dailyRate, base: finalAmt, adjAmt: 0, food: 0, sleepover: 0, total: finalAmt, suggested, overridden: finalTouched }
      : { mode: "trip", tenureIdx: tenure, tenureLabel: TENURE_BANDS[tenure], direction: dir, base,
          laneK, laneLabel: lane?.label || "", laneAmt, bbPremium: bbAmt, adj, adjAmt, foodDays, food, sleepovers, sleepover: sleep, total: finalAmt, suggested, overridden: finalTouched };
    updTrip(trip.id, t => ({ ...t, pay: { ...pay, status: "approved", approvedBy: by || "Management", approvedAt: Date.now() },
      timeline: [...t.timeline, { e: `Pay approved ${rand(finalAmt)}${finalTouched ? ` (suggested ${rand(suggested)})` : ""} by ${by || "Management"}`, ts: Date.now() }] }));
    if (payMode === "trip") saveTenure(trip.driver, tenure);
  };

  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: ex?.status === "approved" ? "#0a7d3f" : RED }}>
      <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Driver pay</div>
      {ex?.status === "approved" && <div className="text-xs mb-2 rounded-lg p-2" style={{ background: "#eafaf0", color: "#0a7d3f" }}>Approved {rand(ex.total)} by {ex.approvedBy} \u00b7 {fmt(ex.approvedAt)}</div>}

      <div className="flex rounded-lg overflow-hidden border mb-3 text-sm" style={{ borderColor: "#ddd" }}>
        {[["trip", "Trip pay"], ["daily", "Daily (local)"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setPayMode(k)} className="flex-1 py-1.5 font-semibold" style={{ background: payMode === k ? RED : "#fff", color: payMode === k ? "#fff" : "#666" }}>{lbl}</button>
        ))}
      </div>

      {payMode === "daily" ? (
        <div>
          <div className="text-[11px] text-gray-400 mb-2">{rand(rates.dailyRate)}/day \u00b7 Sat \u00d7{rates.satMult} \u00b7 Sun \u00d7{rates.sunMult}</div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1"><label className="text-[10px] font-semibold text-gray-500">Normal days</label><input type="number" value={nd} onChange={e => setNd(Number(e.target.value) || 0)} className="w-full mt-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
            <div className="flex-1"><label className="text-[10px] font-semibold text-gray-500">Saturdays</label><input type="number" value={sat} onChange={e => setSat(Number(e.target.value) || 0)} className="w-full mt-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
            <div className="flex-1"><label className="text-[10px] font-semibold text-gray-500">Sundays</label><input type="number" value={sun} onChange={e => setSun(Number(e.target.value) || 0)} className="w-full mt-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
          </div>
          <div className="rounded-lg p-2 text-xs space-y-0.5 mb-2" style={{ background: "#f7f7f8" }}>
            <Line k={`Normal \u00d7 ${nd}`} v={nd * rates.dailyRate} />
            {sat ? <Line k={`Sat \u00d7 ${sat} (\u00d7${rates.satMult})`} v={sat * rates.dailyRate * rates.satMult} /> : null}
            {sun ? <Line k={`Sun \u00d7 ${sun} (\u00d7${rates.sunMult})`} v={sun * rates.dailyRate * rates.sunMult} /> : null}
            <div className="flex justify-between font-bold pt-1 mt-1 border-t" style={{ borderColor: "#e5e5e5", color: DARK }}><span>Total</span><span>{rand(dailyTotal)}</span></div>
          </div>
        </div>
      ) : (
        <div>
          {!r && <div className="text-xs mb-2" style={{ color: "#8a6d00" }}>No standard rate for {trip.trailerType || "this trailer"} \u2013 enter base manually.</div>}
          {r && <div className="text-[11px] text-gray-400 mb-2">Guaranteed basic: {rand(r.basic)}/month (carried in the wage statement)</div>}

          <label className="text-[10px] font-semibold text-gray-500">Tenure band</label>
          <select value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full mt-1 mb-2 px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
            {TENURE_BANDS.map((b, i) => <option key={i} value={i}>{b}</option>)}
          </select>

          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500">Direction</label>
              <div className="flex rounded-lg overflow-hidden border mt-1" style={{ borderColor: "#ddd" }}>
                {["UP", "DOWN"].map(x => <button key={x} onClick={() => setDir(x)} className="flex-1 py-1.5 text-sm font-semibold" style={{ background: dir === x ? RED : "#fff", color: dir === x ? "#fff" : "#666" }}>{x}</button>)}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500">Base {r ? `(auto ${rand(baseAuto)})` : ""}</label>
              <input type="number" value={baseOv} onChange={e => setBaseOv(e.target.value)} placeholder={String(baseAuto)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
            </div>
          </div>

          <button onClick={() => setBb(!bb)} className="w-full mb-2 px-2 py-2 rounded-lg border text-left text-sm flex justify-between items-center" style={{ borderColor: bb ? RED : "#ddd", background: bb ? "#fdecec" : "#fff", color: bb ? RED : "#555" }}>
            <span>Breakbulk premium{isBB ? " (load is breakbulk)" : ""}</span><span className="font-bold">+{rates.breakbulkPremium}</span>
          </button>

          <label className="text-[10px] font-semibold text-gray-500">Lane</label>
          <select value={laneK} onChange={e => setLaneK(e.target.value)} className="w-full mt-1 mb-2 px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
            <option value="">None / local only</option>
            <optgroup label="Long-haul lane">
              {rates.lanes.map(l => <option key={l.k} value={l.k}>{l.label} ({rand(l[rigKey])})</option>)}
            </optgroup>
            <optgroup label="Cross-border (flat)">
              {rates.crossBorder.map(l => <option key={l.k} value={l.k}>{l.label} ({rand(l.amt)})</option>)}
            </optgroup>
          </select>

          <label className="text-[10px] font-semibold text-gray-500">Adjustments</label>
          <div className="grid grid-cols-2 gap-1 mt-1 mb-2">
            {rates.adjustments.map(a => (
              <button key={a.k} onClick={() => toggleAdj(a.k)} className="text-[11px] px-2 py-1.5 rounded-lg border text-left" style={{ borderColor: adj.includes(a.k) ? RED : "#ddd", background: adj.includes(a.k) ? "#fdecec" : "#fff", color: adj.includes(a.k) ? RED : "#555" }}>
                {a.label} <span className="font-bold">{a.amt < 0 ? "\u2212" : "+"}{Math.abs(a.amt)}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-1"><label className="text-[10px] font-semibold text-gray-500">Food days ({rand(r ? r.food : 0)})</label><input type="number" value={foodDays} onChange={e => setFoodDays(Number(e.target.value) || 0)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
            <div className="flex-1"><label className="text-[10px] font-semibold text-gray-500">Sleepovers ({rand(r ? r.sleepover : 0)})</label><input type="number" value={sleepovers} onChange={e => setSleepovers(Number(e.target.value) || 0)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /></div>
          </div>

          <div className="rounded-lg p-2 text-xs space-y-0.5 mb-2" style={{ background: "#f7f7f8" }}>
            <Line k={`Base \u2013 ${TENURE_BANDS[tenure]}`} v={base} />
            {bbAmt ? <Line k="Breakbulk premium" v={bbAmt} /> : null}
            {laneAmt ? <Line k={`Lane \u2013 ${lane.label}`} v={laneAmt} /> : null}
            {adj.map(k => { const a = rates.adjustments.find(x => x.k === k); return <Line key={k} k={a.label} v={a.amt} />; })}
            {food ? <Line k={`Food \u00d7 ${foodDays}`} v={food} /> : null}
            {sleep ? <Line k={`Sleepover \u00d7 ${sleepovers}`} v={sleep} /> : null}
            <div className="flex justify-between font-bold pt-1 mt-1 border-t" style={{ borderColor: "#e5e5e5", color: DARK }}><span>Trip total</span><span>{rand(tripTotal)}</span></div>
          </div>
        </div>
      )}

      <div className="rounded-lg p-2 mb-2 flex items-center justify-between gap-2" style={{ background: "#fff7e6", border: "1px solid #f0e0b0" }}>
        <div>
          <div className="text-[11px] font-bold" style={{ color: "#8a6d00" }}>Amount to pay</div>
          <div className="text-[10px] text-gray-500">Auto-suggested {rand(suggested)}{finalTouched && finalAmt !== suggested ? " \u00b7 edited by payroll" : ""}{finalTouched ? <button onClick={() => { setFinalTouched(false); setFinalStr(""); }} className="underline ml-1">reset</button> : ""}</div>
        </div>
        <input inputMode="decimal" value={finalTouched ? finalStr : String(suggested)} onChange={e => { setFinalTouched(true); setFinalStr(e.target.value); }} className="w-28 px-2 py-1.5 rounded-lg border text-base text-right font-extrabold" style={{ borderColor: "#ddd", color: DARK }} />
      </div>

      <input value={by} onChange={e => setBy(e.target.value)} placeholder="Approved by (manager name)" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
      <button onClick={approve} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: ex?.status === "approved" ? "#0a7d3f" : RED }}>
        {ex?.status === "approved" ? "Update approval" : "Approve pay"}
      </button>
    </div>
  );
}

function OpsTrip({ trip, updTrip, fleet, customers = [], back }) {
  const [f, setF] = useState({ ref: "AVE-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 90 + 10), leg: "", customer: "", customer2: "", bookingNo: "", bookingTime: "", loadType: "", loadSite: "", loadContact: "", cargo: "", loadTime: "", loadNotes: "", offSite: "", offContact: "", offReq: "" });
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const issue = () => updTrip(trip.id, t => ({ ...t, status: "instructed", instruction: f, timeline: [...t.timeline, { e: `Instruction ${f.ref} issued by base${f.customer ? ` \u2013 ${f.customer}` : ""}`, ts: Date.now() }] }));
  const cl = trip.checklist;
  const isBB = f.loadType === "Breakbulk";

  return (
    <div>
      <button onClick={back} className="text-sm mb-3 underline text-gray-500">{"\u2039"} Back</button>
      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
        <div className="font-bold text-lg" style={{ color: DARK }}>{trip.driver}</div>
        <div className="text-sm text-gray-500">{trip.vehicle} + {trailerLabel(trip)}</div>
        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: STATUS[trip.status].c }}>{STATUS[trip.status].label}</span>
      </div>

      {cl && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: cl.criticalFail ? RED : "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Pre-trip checklist <span className="text-xs font-normal text-gray-400">{fmt(cl.completedAt)}</span></div>
          {cl.defects.length === 0
            ? <div className="text-sm" style={{ color: "#0a7d3f" }}>{"\u2713"} All items passed \u2013 no defects.</div>
            : <div className="space-y-2">
                {cl.criticalFail && <div className="text-xs font-bold" style={{ color: RED }}>{"\u26a0"} Critical defect present \u2013 issuing an instruction authorises departure.</div>}
                {cl.defects.map(d => (
                  <div key={d.id} className="text-xs rounded-lg p-2" style={{ background: d.critical ? "#fdecec" : "#fff7e6" }}>
                    <div className="font-semibold" style={{ color: d.critical ? RED : "#8a6d00" }}>{d.label}{d.critical && " (CRITICAL)"}</div>
                    <div className="text-gray-600">{d.note}</div>
                  </div>
                ))}
              </div>}
        </div>
      )}

      {cl?.vehiclePhotos && Object.keys(cl.vehiclePhotos).length > 0 && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Damage photos</div>
          <div className="grid grid-cols-2 gap-2">
            {ANGLES.map(([k, lbl]) => cl.vehiclePhotos[k] && (
              <a key={k} href={cl.vehiclePhotos[k]} target="_blank" rel="noreferrer">
                <img src={cl.vehiclePhotos[k]} className="h-24 w-full object-cover rounded-lg border" style={{ borderColor: "#ddd" }} alt={lbl} />
                <div className="text-[10px] text-center text-gray-500 mt-0.5">{lbl}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {(trip.status === "checklist_done" || trip.status === "awaiting") && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: RED }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Issue loading / offloading instruction</div>
          <I label="Ref" v={f.ref} on={v => set("ref", v)} />

          <div className="mt-2 mb-1.5">
            <label className="text-[10px] font-semibold text-gray-500">Trip leg</label>
            <select value={f.leg} onChange={e => set("leg", e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: f.leg ? "#ddd" : RED }}>
              <option value="">Select leg\u2026</option>
              {LEG_FORM.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
            </select>
          </div>

          <div className="text-xs font-bold uppercase tracking-wide mt-2 mb-1" style={{ color: RED }}>Customer <span className="font-normal normal-case text-gray-400">- internal, not sent to driver</span></div>
          <div className="mb-1.5">
            <label className="text-[10px] font-semibold text-gray-500">Customer</label>
            <input list="ave-customers" value={f.customer} onChange={e => set("customer", e.target.value)} placeholder="Type or select a customer" className="w-full px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
          </div>
          <div className="mb-1.5">
            <label className="text-[10px] font-semibold text-gray-500">Secondary customer (optional)</label>
            <input list="ave-customers" value={f.customer2} onChange={e => set("customer2", e.target.value)} placeholder="Type or select a customer" className="w-full px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
          </div>
          <datalist id="ave-customers">{customers.map(c => <option key={c} value={c} />)}</datalist>

          <div className="text-xs font-bold uppercase tracking-wide mt-2 mb-1" style={{ color: RED }}>Booking</div>
          <div className="flex gap-2">
            <div className="flex-1"><I label="Booking no. (optional)" v={f.bookingNo} on={v => set("bookingNo", v)} /></div>
            <div className="flex-1"><I label="Booking time (optional)" v={f.bookingTime} on={v => set("bookingTime", v)} ph="e.g. 08:00, 12 Jun" /></div>
          </div>

          <div className="text-xs font-bold uppercase tracking-wide mt-2 mb-1" style={{ color: RED }}>Loading</div>
          <div className="mb-1.5">
            <label className="text-[10px] font-semibold text-gray-500">Load type</label>
            <select value={f.loadType} onChange={e => set("loadType", e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }}>
              <option value="">Select\u2026</option>
              {LOAD_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <I label="Site" v={f.loadSite} on={v => set("loadSite", v)} ph="e.g. Unica Iron & Steel, Hammanskraal" />
          <I label="Cargo" v={f.cargo} on={v => set("cargo", v)} ph="e.g. 1 x 40ft container TCLU3143195" />
          <I label="Time" v={f.loadTime} on={v => set("loadTime", v)} />
          {isBB && <I label="Loading contact" v={f.loadContact} on={v => set("loadContact", v)} ph="breakbulk - site contact" />}
          <I label="Notes" v={f.loadNotes} on={v => set("loadNotes", v)} ph="e.g. Do NOT off-hook trailer \u2013 stay coupled" />

          <div className="text-xs font-bold uppercase tracking-wide mt-2 mb-1" style={{ color: RED }}>Offloading</div>
          <I label="Destination" v={f.offSite} on={v => set("offSite", v)} />
          {isBB && <I label="Offloading contact" v={f.offContact} on={v => set("offContact", v)} ph="breakbulk - receiver contact" />}
          <I label="Requirements" v={f.offReq} on={v => set("offReq", v)} />
          {isBB && <div className="text-[10px] text-gray-400 mt-1">Contact fields shown because the load is breakbulk.</div>}
          <button disabled={!f.leg || !f.customer || !f.loadSite || !f.offSite || !f.loadType} onClick={issue} className="w-full py-3 mt-2 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: RED }}>Send instruction to driver</button>
        </div>
      )}

      {trip.instruction && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-1" style={{ color: DARK }}>Instruction {trip.instruction.ref} <span className="text-xs font-normal text-gray-400">{[trip.instruction.loadType, trip.instruction.leg && LEG_LABEL[trip.instruction.leg]].filter(Boolean).join(" \u00b7 ")}</span></div>
          {trip.instruction.customer && <div className="text-xs text-gray-600">Customer: {trip.instruction.customer}{trip.instruction.customer2 ? ` + ${trip.instruction.customer2}` : ""}{trip.instruction.bookingNo ? ` \u00b7 #${trip.instruction.bookingNo}` : ""}</div>}
          <div className="text-xs text-gray-600">Load: {trip.instruction.loadSite} {"\u2192"} {trip.instruction.offSite}</div>
        </div>
      )}

      {trip.loadPhotos?.length > 0 && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Load photos <span className="text-xs font-normal text-gray-400">{trip.loadPhotos.length}</span></div>
          <div className="grid grid-cols-3 gap-2">
            {trip.loadPhotos.map((ph, i) => <a key={i} href={ph} target="_blank" rel="noreferrer"><img src={ph} className="h-20 w-full object-cover rounded-lg border" style={{ borderColor: "#ddd" }} alt="" /></a>)}
          </div>
        </div>
      )}

      {trip.pods.length > 0 && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Proof of delivery</div>
          {trip.pods.map(p => (
            <div key={p.id} className="mb-2 pb-2 border-b last:border-0" style={{ borderColor: "#eee" }}>
              <div className="flex gap-2 flex-wrap">{p.photos.map((ph, i) => <a key={i} href={ph} target="_blank" rel="noreferrer"><img src={ph} className="h-20 rounded-lg border" style={{ borderColor: "#ddd" }} alt="" /></a>)}</div>
              <div className="text-xs text-gray-500 mt-1">{fmt(p.ts)}{p.note ? ` \u2013 ${p.note}` : ""}{p.location ? ` \u2013 \ud83d\udccd ${p.location.lat}, ${p.location.lng}` : ""}</div>
            </div>
          ))}
        </div>
      )}

      {trip.signature && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-1" style={{ color: DARK }}>Received by: {trip.receiver || "\u2013"}</div>
          <img src={trip.signature} className="h-20 border rounded bg-white" style={{ borderColor: "#ddd" }} alt="signature" />
        </div>
      )}

      <Timeline t={trip} />
    </div>
  );
}

// ============ PODs & PAYROLL ============
function PodApprovals({ data, updTrip, approvePod }) {
  const [by, setBy] = useState("");
  const awaiting = data.trips.filter(t => t.status === "delivered");
  const closed = data.trips.filter(t => t.status === "closed").slice(0, 8);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: "#e5e5e5" }}>
        <label className="text-xs font-semibold text-gray-500">Approved by</label>
        <input value={by} onChange={e => setBy(e.target.value)} placeholder="Controller / manager name" className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} />
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Awaiting POD approval</div>
        {awaiting.length === 0 && <div className="text-sm text-gray-400 bg-white rounded-xl p-3 border" style={{ borderColor: "#e5e5e5" }}>Nothing waiting. Approving a POD releases the driver for their next instruction and unlocks the trip for payroll.</div>}
        <div className="space-y-3">
          {awaiting.map(t => <PodCard key={t.id} {...{ trip: t, updTrip, approve: () => approvePod(t.id, by) }} />)}
        </div>
      </div>

      {closed.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Recently completed</div>
          <div className="space-y-2">
            {closed.map(t => (
              <div key={t.id} className="bg-white rounded-xl p-3 border shadow-sm flex justify-between items-center" style={{ borderColor: "#e5e5e5" }}>
                <div>
                  <div className="font-semibold text-sm" style={{ color: DARK }}>{t.driver}</div>
                  <div className="text-xs text-gray-500">{t.instruction ? `${t.instruction.loadSite} \u2192 ${t.instruction.offSite}` : trailerLabel(t)}</div>
                  {t.podApprovedBy && <div className="text-[10px] text-gray-400 mt-0.5">Approved by {t.podApprovedBy}</div>}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#eafaf0", color: "#0a7d3f" }}>{t.pay?.status === "approved" ? rand(t.pay.total) : "Completed"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PodCard({ trip, updTrip, approve }) {
  const [pending, setPending] = useState([]);
  const [note, setNote] = useState("");
  const addPhoto = async (b) => { const loc = await getLoc(); setPending(p => [...p, { b, loc }]); };
  const addOfficePod = () => {
    if (!pending.length && !note.trim()) return;
    updTrip(trip.id, t => ({ ...t, pods: [...t.pods, { id: uid(), photos: pending.map(p => p.b), note: note ? `[office] ${note}` : "[office upload]", location: pending[0]?.loc || null, ts: Date.now() }],
      timeline: [...t.timeline, { e: "POD document added at office", ts: Date.now() }] }));
    setPending([]); setNote("");
  };
  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm" style={{ borderColor: RED }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold" style={{ color: DARK }}>{trip.driver}</div>
          <div className="text-xs text-gray-500">{trip.vehicle} + {trailerLabel(trip)}</div>
          {trip.instruction && <div className="text-[11px] text-gray-400">{trip.instruction.loadSite} {"\u2192"} {trip.instruction.offSite}</div>}
          {trip.instruction?.customer && <div className="text-[11px] text-gray-400">{[trip.instruction.customer, trip.instruction.customer2].filter(Boolean).join(" + ")}</div>}
        </div>
        <span className="text-[10px] text-gray-400">{fmt(trip.timeline.at(-1).ts)}</span>
      </div>

      {trip.pods.length > 0 ? (
        <div className="space-y-2 mb-2">
          {trip.pods.map(p => (
            <div key={p.id}>
              <div className="flex gap-2 flex-wrap">{p.photos.map((ph, i) => <a key={i} href={ph} target="_blank" rel="noreferrer"><img src={ph} className="h-20 rounded-lg border" style={{ borderColor: "#ddd" }} alt="" /></a>)}</div>
              {p.note && <div className="text-xs text-gray-500 mt-0.5">{p.note}</div>}
            </div>
          ))}
        </div>
      ) : <div className="text-xs mb-2" style={{ color: RED }}>No POD captured by the driver - upload the waybill below before approving.</div>}

      {trip.signature && (
        <div className="mb-2">
          <div className="text-[11px] text-gray-500">Received by: {trip.receiver || "\u2013"}</div>
          <img src={trip.signature} className="h-16 border rounded bg-white" style={{ borderColor: "#ddd" }} alt="signature" />
        </div>
      )}

      <div className="rounded-lg border p-2 mb-2" style={{ borderColor: "#eee" }}>
        <div className="text-[11px] font-semibold text-gray-500 mb-1">Add office POD doc (optional)</div>
        <div className="flex gap-2 flex-wrap items-center mb-1">
          {pending.map((p, i) => <img key={i} src={p.b} className="h-14 rounded border" style={{ borderColor: "#ddd" }} alt="" />)}
          <PhotoButton label={"\ud83d\udcce Upload"} onPhoto={addPhoto} />
        </div>
        <div className="flex gap-2">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Waybill no. / note" className="flex-1 px-2 py-1.5 rounded-lg border text-xs" style={{ borderColor: "#ddd" }} />
          <button onClick={addOfficePod} disabled={!pending.length && !note.trim()} className="px-3 rounded-lg text-white text-xs font-semibold disabled:opacity-40" style={{ background: DARK }}>Add</button>
        </div>
      </div>

      <button onClick={approve} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: "#0a7d3f" }}>Approve POD & release driver</button>
    </div>
  );
}

function FinalizeCard({ trip, updTrip }) {
  const fin = trip.finalized;
  const [pod, setPod] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [by, setBy] = useState("");

  const finalize = () => {
    updTrip(trip.id, t => ({ ...t, finalized: { pod: true, sheet: true, by: by || "Admin", at: Date.now() },
      timeline: [...t.timeline, { e: `Trip finalised - original POD & trip sheet handed in (${by || "Admin"})`, ts: Date.now() }] }));
  };

  return (
    <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: fin ? "#0a7d3f" : RED }}>
      <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Finalise trip</div>
      {fin ? (
        <div className="text-xs rounded-lg p-2" style={{ background: "#eafaf0", color: "#0a7d3f" }}>
          Finalised by {fin.by} {"\u00b7"} {fmt(fin.at)}
          <div className="mt-0.5">Original POD and trip sheet handed in {"\u2713"}</div>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-2">Confirm the physical paperwork is in before closing this trip off.</div>
          <label className="flex items-center gap-2 mb-2 text-sm" style={{ color: DARK }}>
            <input type="checkbox" checked={pod} onChange={e => setPod(e.target.checked)} /> Original POD handed in
          </label>
          <label className="flex items-center gap-2 mb-3 text-sm" style={{ color: DARK }}>
            <input type="checkbox" checked={sheet} onChange={e => setSheet(e.target.checked)} /> Trip sheet handed in
          </label>
          <input value={by} onChange={e => setBy(e.target.value)} placeholder="Finalised by" className="w-full px-3 py-2 rounded-lg border text-sm mb-2" style={{ borderColor: "#ddd" }} />
          <button disabled={!pod || !sheet} onClick={finalize} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: "#0a7d3f" }}>Finalise trip</button>
        </>
      )}
    </div>
  );
}

function PriceTrip({ trip, updTrip, fleet, rates, saveTenure, back }) {
  return (
    <div>
      <button onClick={back} className="text-sm mb-3 underline text-gray-500">{"\u2039"} Back</button>
      <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
        <div className="font-bold text-lg" style={{ color: DARK }}>{trip.driver}</div>
        <div className="text-sm text-gray-500">{trip.vehicle} + {trailerLabel(trip)}</div>
        {trip.instruction?.customer && <div className="text-xs text-gray-500 mt-1">Customer: {trip.instruction.customer}{trip.instruction.customer2 ? ` + ${trip.instruction.customer2}` : ""}</div>}
        {trip.instruction && <div className="text-xs text-gray-500">{trip.instruction.loadSite} {"\u2192"} {trip.instruction.offSite}{trip.instruction.loadType ? ` \u00b7 ${trip.instruction.loadType}` : ""}</div>}
        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: STATUS[trip.status].c }}>{STATUS[trip.status].label}</span>
      </div>

      {trip.pods.length > 0 && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mb-3" style={{ borderColor: "#e5e5e5" }}>
          <div className="font-bold text-sm mb-2" style={{ color: DARK }}>Proof of delivery</div>
          {trip.pods.map(p => (
            <div key={p.id} className="mb-2 pb-2 border-b last:border-0" style={{ borderColor: "#eee" }}>
              <div className="flex gap-2 flex-wrap">{p.photos.map((ph, i) => <a key={i} href={ph} target="_blank" rel="noreferrer"><img src={ph} className="h-20 rounded-lg border" style={{ borderColor: "#ddd" }} alt="" /></a>)}</div>
              {p.note && <div className="text-xs text-gray-500 mt-1">{p.note}</div>}
            </div>
          ))}
        </div>
      )}

      {trip.status === "closed"
        ? <PayCard {...{ trip, updTrip, fleet, rates, saveTenure }} />
        : <div className="bg-white rounded-xl p-4 border shadow-sm text-sm text-gray-500" style={{ borderColor: RED }}>Wages can be priced once the POD has been approved under POD Approvals.</div>}

      {trip.status === "closed" && trip.pay?.status === "approved" && <FinalizeCard {...{ trip, updTrip }} />}

      <Timeline t={trip} />
    </div>
  );
}

function FleetAdmin({ fleet, saveFleet }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(""); const [vr, setVr] = useState(""); const [vm, setVm] = useState(""); const [tr, setTr] = useState(""); const [imp, setImp] = useState("");
  return (
    <div className="mt-5">
      <button onClick={() => setOpen(o => !o)} className="text-sm underline text-gray-500">{open ? "Hide" : "Manage"} fleet & drivers</button>
      {open && (
        <div className="bg-white rounded-xl p-3 border shadow-sm mt-2 space-y-3" style={{ borderColor: "#e5e5e5" }}>
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">Add driver</div>
            <div className="flex gap-2"><input value={d} onChange={e => setD(e.target.value)} placeholder="Name" className="flex-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /><button onClick={() => { if (d.trim()) { saveFleet({ ...fleet, drivers: [...fleet.drivers, d.trim()] }); setD(""); } }} className="px-3 rounded-lg text-white text-sm font-semibold" style={{ background: DARK }}>+</button></div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">Add truck</div>
            <div className="flex gap-2"><input value={vr} onChange={e => setVr(e.target.value)} placeholder="Reg" className="w-1/3 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /><input value={vm} onChange={e => setVm(e.target.value)} placeholder="Make" className="flex-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /><button onClick={() => { if (vr.trim()) { saveFleet({ ...fleet, vehicles: [...fleet.vehicles, { reg: vr.trim(), make: vm.trim() }] }); setVr(""); setVm(""); } }} className="px-3 rounded-lg text-white text-sm font-semibold" style={{ background: DARK }}>+</button></div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">Add trailer unit</div>
            <div className="flex gap-2"><input value={tr} onChange={e => setTr(e.target.value)} placeholder="Reg" className="flex-1 px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#ddd" }} /><button onClick={() => { if (tr.trim()) { saveFleet({ ...fleet, trailers: [...fleet.trailers, { reg: tr.trim() }] }); setTr(""); } }} className="px-3 rounded-lg text-white text-sm font-semibold" style={{ background: DARK }}>+</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
