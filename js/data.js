/* ============================================================
   THE FREE MARKET GLOBE — data.js
   Shared data layer. Everything is stored in the browser via
   localStorage, so this works as a front-end demo without a
   server. Swap the functions in this file for real API calls
   (Node/PHP/Django/etc + a real database) when you connect a
   backend — every other file only talks to the functions below,
   never to localStorage directly, so that swap is contained here.
   ============================================================ */

const FMG_ADMIN = { name: "ADMIN GROUP A", password: "KU MASAKA" };

const FMG_CATEGORIES = [
  { id: "electronics", label: "Electronics", icon: "electronics" },
  { id: "fashion", label: "Fashion", icon: "fashion" },
  { id: "office", label: "Office", icon: "office" },
  { id: "machinery", label: "Machinery", icon: "machinery" },
  { id: "home", label: "Home & Living", icon: "home" },
  { id: "agriculture", label: "Agriculture", icon: "agriculture" }
];

const FMG_LOCATIONS = [
  { id: "masaka", label: "Masaka", lat: -0.3372, lng: 31.7345 },
  { id: "ssembabule", label: "Ssembabule", lat: -0.0904, lng: 31.4534 },
  { id: "kampala", label: "Kampala", lat: 0.3476, lng: 32.5825 },
  { id: "gayaza", label: "Gayaza", lat: 0.4907, lng: 32.6167 },
  { id: "kyotera", label: "Kyotera", lat: -0.6193, lng: 31.5253 },
  { id: "kumasaka", label: "Kampala University Masaka", lat: -0.3406, lng: 31.7331 }
];

const FMG_FREE_TRIAL_LIMIT = 100;
const FMG_FREE_TRIAL_MONTHS = 6;

/* ---------- tiny local "database" helpers ---------- */

function fmgLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function fmgSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage full or unavailable:", e);
  }
}
function fmgId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- placeholder art (no external image hosting needed) ----------
   Businesses upload real photos (stored as compressed data URLs — see
   js/main.js compressImage()). Until a photo is uploaded, or for the demo
   catalogue, we render a light, on-brand SVG tile so the grid never shows
   broken images and never depends on outside servers. */
function fmgPlaceholder(category, seedText) {
  const palettes = {
    electronics: ["#1B2A4A", "#E8A93B"],
    fashion: ["#3B2417", "#E8A93B"],
    office: ["#14110F", "#C7CBD1"],
    machinery: ["#2B2016", "#E8A93B"],
    home: ["#3B2417", "#FBF9F6"],
    agriculture: ["#1B2A4A", "#8FAE6B"]
  };
  const [bg, fg] = palettes[category] || ["#14110F", "#E8A93B"];
  const initials = (seedText || category).trim().slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bg}"/>
    <circle cx="330" cy="40" r="90" fill="${fg}" opacity="0.12"/>
    <circle cx="40" cy="270" r="110" fill="${fg}" opacity="0.1"/>
    <text x="200" y="168" font-family="Georgia, serif" font-size="72" fill="${fg}" text-anchor="middle" opacity="0.9">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ---------- seed content (first run only) ---------- */

function fmgSeed() {
  if (fmgLoad("fmg_seeded", false)) return;

  const businesses = [
    { id: "biz_kasese_electro", name: "Kasese Electro Hub", email: "kasese.electro@example.com", password: "demo1234",
      category: "electronics", location: "kampala", bio: "Phones, accessories and home electronics at fair prices.",
      joined: "2026-02-11", freeTrial: true, trialEndsAt: "2026-08-11" },
    { id: "biz_masaka_threads", name: "Masaka Threads", email: "masaka.threads@example.com", password: "demo1234",
      category: "fashion", location: "masaka", bio: "Locally tailored fashion for men, women and children.",
      joined: "2026-03-02", freeTrial: true, trialEndsAt: "2026-09-02" },
    { id: "biz_gayaza_office", name: "Gayaza Office Supplies", email: "gayaza.office@example.com", password: "demo1234",
      category: "office", location: "gayaza", bio: "Stationery, furniture and printing supplies for every office.",
      joined: "2026-04-18", freeTrial: true, trialEndsAt: "2026-10-18" },
    { id: "biz_kyotera_agro", name: "Kyotera Agro Machines", email: "kyotera.agro@example.com", password: "demo1234",
      category: "machinery", location: "kyotera", bio: "Farm machinery, irrigation tools and spare parts.",
      joined: "2026-01-27", freeTrial: true, trialEndsAt: "2026-07-27" }
  ];

  const products = [
    { name: "Dual-SIM Smartphone", category: "electronics", bizId: "biz_kasese_electro", price: 620000, discount: 10, stock: 24,
      desc: "6.5\" display, 128GB storage, dual camera. Great value entry smartphone." },
    { name: "Bluetooth Speaker", category: "electronics", bizId: "biz_kasese_electro", price: 95000, discount: 0, stock: 40,
      desc: "Portable speaker with 12-hour battery life and deep bass." },
    { name: "Solar Charging Kit", category: "electronics", bizId: "biz_kasese_electro", price: 180000, discount: 15, stock: 12,
      desc: "Solar panel with two USB ports, ideal for areas with unreliable power." },
    { name: "Men's Tailored Suit", category: "fashion", bizId: "biz_masaka_threads", price: 260000, discount: 0, stock: 8,
      desc: "Made-to-measure two-piece suit, locally tailored in Masaka." },
    { name: "Ankara Print Dress", category: "fashion", bizId: "biz_masaka_threads", price: 85000, discount: 20, stock: 15,
      desc: "Vibrant Ankara print, available in multiple sizes." },
    { name: "Kids School Uniform Set", category: "fashion", bizId: "biz_masaka_threads", price: 45000, discount: 0, stock: 30,
      desc: "Durable school uniform set, sizes for ages 5 to 14." },
    { name: "Office Desk (1.2m)", category: "office", bizId: "biz_gayaza_office", price: 310000, discount: 5, stock: 10,
      desc: "Sturdy wood-finish office desk with drawer storage." },
    { name: "Ream of A4 Paper (5-pack)", category: "office", bizId: "biz_gayaza_office", price: 60000, discount: 0, stock: 100,
      desc: "High quality 80gsm printing paper, five reams." },
    { name: "Ergonomic Office Chair", category: "office", bizId: "biz_gayaza_office", price: 220000, discount: 12, stock: 18,
      desc: "Adjustable height, lumbar support, mesh back." },
    { name: "Water Pump (2 inch)", category: "machinery", bizId: "biz_kyotera_agro", price: 540000, discount: 0, stock: 6,
      desc: "Petrol-powered water pump for irrigation, 2-inch outlet." },
    { name: "Maize Milling Machine", category: "machinery", bizId: "biz_kyotera_agro", price: 2400000, discount: 8, stock: 3,
      desc: "Diesel-powered milling machine, 200kg/hour capacity." },
    { name: "Hand Hoe Set (10-pack)", category: "machinery", bizId: "biz_kyotera_agro", price: 150000, discount: 0, stock: 25,
      desc: "Ten durable hand hoes for farm and garden work." }
  ];

  const seededBiz = businesses.map(b => ({ ...b, role: "business" }));
  const seededProducts = products.map(p => ({
    id: fmgId("prod"),
    name: p.name,
    category: p.category,
    bizId: p.bizId,
    price: p.price,
    discount: p.discount,
    stock: p.stock,
    desc: p.desc,
    image: fmgPlaceholder(p.category, p.name),
    createdAt: new Date().toISOString(),
    views: Math.floor(Math.random() * 300) + 20
  }));

  fmgSave("fmg_businesses", seededBiz);
  fmgSave("fmg_products", seededProducts);
  fmgSave("fmg_users", []);
  fmgSave("fmg_orders", []);
  fmgSave("fmg_cart", []);
  fmgSave("fmg_feedback", [
    { id: fmgId("fb"), from: "user", name: "Grace N.", message: "I love how easy it is to find fashion items from Masaka sellers!", createdAt: "2026-05-02" },
    { id: fmgId("fb"), from: "business", name: "Gayaza Office Supplies", message: "Could you add a bulk-order discount option?", createdAt: "2026-05-14" }
  ]);
  fmgSave("fmg_traffic", fmgGenerateTraffic());
  fmgSave("fmg_payment_accounts", { momo: "+256 700 000 000 (GROUP A KU MASAKA)", mastercard: "Merchant ID: KUM-2026-FMG-001" });
  fmgSave("fmg_registered_business_count", businesses.length);
  fmgSave("fmg_seeded", true);
}

function fmgGenerateTraffic() {
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), visits: Math.floor(Math.random() * 400) + 150 });
  }
  return days;
}

/* ---------- accessors used by the rest of the app ---------- */

const FMG = {
  categories: FMG_CATEGORIES,
  locations: FMG_LOCATIONS,

  getProducts() { return fmgLoad("fmg_products", []); },
  saveProducts(list) { fmgSave("fmg_products", list); },

  getBusinesses() { return fmgLoad("fmg_businesses", []); },
  saveBusinesses(list) { fmgSave("fmg_businesses", list); },

  getUsers() { return fmgLoad("fmg_users", []); },
  saveUsers(list) { fmgSave("fmg_users", list); },

  getOrders() { return fmgLoad("fmg_orders", []); },
  saveOrders(list) { fmgSave("fmg_orders", list); },

  getCart() { return fmgLoad("fmg_cart", []); },
  saveCart(list) { fmgSave("fmg_cart", list); },

  getFeedback() { return fmgLoad("fmg_feedback", []); },
  saveFeedback(list) { fmgSave("fmg_feedback", list); },

  getTraffic() { return fmgLoad("fmg_traffic", []); },

  getPaymentAccounts() { return fmgLoad("fmg_payment_accounts", {}); },
  savePaymentAccounts(v) { fmgSave("fmg_payment_accounts", v); },

  getSession() { return fmgLoad("fmg_session", null); },
  setSession(v) { fmgSave("fmg_session", v); },
  clearSession() { localStorage.removeItem("fmg_session"); },

  getConsent() { return fmgLoad("fmg_consent", null); },
  setConsent(v) { fmgSave("fmg_consent", v); },

  businessById(id) { return this.getBusinesses().find(b => b.id === id); },
  locationById(id) { return FMG_LOCATIONS.find(l => l.id === id); },
  categoryById(id) { return FMG_CATEGORIES.find(c => c.id === id); },

  placeholder: fmgPlaceholder,
  uid: fmgId,

  isFreeTrialAvailable() {
    return fmgLoad("fmg_registered_business_count", 0) < FMG_FREE_TRIAL_LIMIT;
  },
  registerBusinessTrialSlot() {
    const n = fmgLoad("fmg_registered_business_count", 0);
    fmgSave("fmg_registered_business_count", n + 1);
    return n < FMG_FREE_TRIAL_LIMIT;
  }
};

fmgSeed();
