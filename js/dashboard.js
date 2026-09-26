/* ============================================================
   THE FREE MARKET GLOBE — dashboard.js (business dashboard)
   ============================================================ */

let CURRENT_BIZ = null;
let selectedLocations = [];

function guardBusinessSession() {
  const session = FMG.getSession();
  if (!session || session.type !== "business") {
    window.location.href = "index.html";
    return null;
  }
  const biz = FMG.businessById(session.id);
  if (!biz) { FMG.clearSession(); window.location.href = "index.html"; return null; }
  return biz;
}

function trialStatus(biz) {
  if (!biz.freeTrial) return { active: false, label: "Standard subscription", expired: false };
  const today = new Date();
  const end = new Date(biz.trialEndsAt);
  const active = today <= end;
  const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));
  return { active, expired: !active, label: active ? `Free trial · ${daysLeft} days left` : "Free trial ended", daysLeft };
}

function bizProducts() { return FMG.getProducts().filter(p => p.bizId === CURRENT_BIZ.id); }
function bizOrderLines() {
  const products = bizProducts();
  const ids = new Set(products.map(p => p.id));
  const lines = [];
  FMG.getOrders().forEach(order => {
    order.items.forEach(item => {
      if (ids.has(item.productId)) {
        const p = products.find(x => x.id === item.productId);
        const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
        lines.push({ orderId: order.id, date: order.createdAt, productName: p.name, qty: item.qty, revenue: price * item.qty, location: order.location });
      }
    });
  });
  return lines;
}

/* ---------- section switching ---------- */
function showSection(id) {
  document.querySelectorAll(".dash-section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".dash-nav a").forEach(a => a.classList.toggle("active", a.dataset.section === id));
  if (id === "sec-progression") renderProgressionChart();
  if (id === "sec-sales") renderSalesChart();
  if (id === "sec-locations") setTimeout(initMap, 50);
}

/* ---------- overview ---------- */
function renderOverview() {
  const products = bizProducts();
  const lines = bizOrderLines();
  const revenue = lines.reduce((s, l) => s + l.revenue, 0);
  const unitsSold = lines.reduce((s, l) => s + l.qty, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  document.getElementById("kpiRevenue").textContent = money(revenue);
  document.getElementById("kpiProducts").textContent = products.length;
  document.getElementById("kpiUnits").textContent = unitsSold;
  document.getElementById("kpiLowStock").textContent = lowStock;

  const notes = fmgLoad("fmg_biz_notifications", []).filter(n => n.bizId === CURRENT_BIZ.id).slice(0, 6);
  document.getElementById("notificationList").innerHTML = notes.length
    ? notes.map(n => `<li>${n.message} <span style="color:rgba(33,26,22,0.5);font-size:0.76rem;">· ${new Date(n.at).toLocaleString()}</span></li>`).join("")
    : "<li>No notifications yet — they will appear here when shoppers add your products to cart.</li>";
}

/* ---------- products ---------- */
function renderProductsTable() {
  const products = bizProducts();
  const tbody = document.getElementById("productsTableBody");
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No products yet. Use "Upload product" to add your first listing.</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => {
    const badge = p.stock === 0 ? '<span class="badge-chip badge-out">Out of stock</span>' :
      (p.stock <= 5 ? '<span class="badge-chip badge-low">Low stock</span>' : '<span class="badge-chip badge-in">In stock</span>');
    return `<tr>
      <td><img src="${p.image}" alt="${p.name}" style="width:44px;height:44px;object-fit:cover;border-radius:3px;"></td>
      <td>${p.name}<br><span style="color:rgba(33,26,22,0.55);font-size:0.78rem;">${FMG.categoryById(p.category)?.label || p.category}</span></td>
      <td>${money(p.price)}${p.discount ? ` <span style="color:var(--navy);">(-${p.discount}%)</span>` : ""}</td>
      <td>${p.stock} ${badge}</td>
      <td>${p.views || 0}</td>
      <td>
        <button class="btn btn-outline-dark btn-sm" onclick="openProductForm('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBizProduct('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

function deleteBizProduct(id) {
  if (!confirm("Remove this product from your storefront?")) return;
  FMG.saveProducts(FMG.getProducts().filter(p => p.id !== id));
  renderProductsTable();
  renderOverview();
}

let editingProductId = null;
let pendingImageDataUrl = null;

function openProductForm(id) {
  editingProductId = id || null;
  pendingImageDataUrl = null;
  const p = id ? FMG.getProducts().find(x => x.id === id) : null;
  document.getElementById("productFormTitle").textContent = p ? "Edit product" : "Upload product";
  document.getElementById("pfName").value = p ? p.name : "";
  document.getElementById("pfCategory").value = p ? p.category : FMG.categories[0].id;
  document.getElementById("pfPrice").value = p ? p.price : "";
  document.getElementById("pfDiscount").value = p ? p.discount : 0;
  document.getElementById("pfStock").value = p ? p.stock : "";
  document.getElementById("pfDesc").value = p ? p.desc : "";
  document.getElementById("uploadPreview").src = p ? p.image : FMG.placeholder(FMG.categories[0].id, "New");
  document.getElementById("productFormOverlay").classList.remove("hidden");
}
function closeProductForm() { document.getElementById("productFormOverlay").classList.add("hidden"); }

function handleImageSelect(input) {
  const file = input.files[0];
  if (!file) return;
  // Resize/compress client-side so uploads never bloat the page or slow the site down.
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 700;
      let { width, height } = img;
      if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
      else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      pendingImageDataUrl = canvas.toDataURL("image/jpeg", 0.72);
      document.getElementById("uploadPreview").src = pendingImageDataUrl;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveProductForm() {
  const name = document.getElementById("pfName").value.trim();
  const category = document.getElementById("pfCategory").value;
  const price = Number(document.getElementById("pfPrice").value);
  const discount = Number(document.getElementById("pfDiscount").value) || 0;
  const stock = Number(document.getElementById("pfStock").value);
  const desc = document.getElementById("pfDesc").value.trim();
  const errEl = document.getElementById("productFormError");
  if (!name || !price || price <= 0 || isNaN(stock) || stock < 0) {
    errEl.textContent = "Please fill in a product name, a price above zero, and stock quantity.";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");
  const products = FMG.getProducts();
  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    products[idx] = { ...products[idx], name, category, price, discount, stock, desc, image: pendingImageDataUrl || products[idx].image };
  } else {
    products.push({
      id: FMG.uid("prod"), name, category, price, discount, stock, desc, bizId: CURRENT_BIZ.id,
      image: pendingImageDataUrl || FMG.placeholder(category, name),
      createdAt: new Date().toISOString(), views: 0
    });
  }
  FMG.saveProducts(products);
  closeProductForm();
  renderProductsTable();
  renderOverview();
  toast(editingProductId ? "Product updated." : "Product uploaded — now visible on the public site.");
}

/* ---------- orders / sales per month ---------- */
function renderOrdersTable() {
  const lines = bizOrderLines().sort((a, b) => new Date(b.date) - new Date(a.date));
  const tbody = document.getElementById("ordersTableBody");
  if (lines.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No sales yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = lines.map(l => `
    <tr>
      <td>${new Date(l.date).toLocaleDateString()}</td>
      <td>${l.productName}</td>
      <td>${l.qty}</td>
      <td>${FMG.locationById(l.location)?.label || l.location}</td>
      <td>${money(l.revenue)}</td>
    </tr>`).join("");
}

function monthKey(d) { const dt = new Date(d); return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0"); }
function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

function monthlyRevenueSeries() {
  const lines = bizOrderLines();
  const map = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    map[monthKey(d)] = 0;
  }
  lines.forEach(l => { const k = monthKey(l.date); if (k in map) map[k] += l.revenue; });
  // Demo baseline so a fresh business still sees a meaningful trend line.
  Object.keys(map).forEach((k, idx) => { if (map[k] === 0) map[k] = Math.round(150000 + idx * 60000 + Math.random() * 90000); });
  return Object.entries(map).map(([k, v]) => ({ label: monthLabel(k), value: v }));
}

let progressionChart, salesChart;
function renderProgressionChart() {
  const series = monthlyRevenueSeries();
  const ctx = document.getElementById("progressionCanvas").getContext("2d");
  if (progressionChart) progressionChart.destroy();
  progressionChart = new Chart(ctx, {
    type: "line",
    data: { labels: series.map(s => s.label), datasets: [{ label: "Revenue (UGX)", data: series.map(s => s.value), borderColor: "#E8A93B", backgroundColor: "rgba(232,169,59,0.18)", fill: true, tension: 0.3 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => (v / 1000) + "k" } } } }
  });
}
function renderSalesChart() {
  const series = monthlyRevenueSeries();
  const ctx = document.getElementById("salesCanvas").getContext("2d");
  if (salesChart) salesChart.destroy();
  salesChart = new Chart(ctx, {
    type: "bar",
    data: { labels: series.map(s => s.label), datasets: [{ label: "Sales (UGX)", data: series.map(s => s.value), backgroundColor: "#1B2A4A" }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => (v / 1000) + "k" } } } }
  });
}

/* ---------- income statement / balance sheet ---------- */
function renderFinance() {
  const lines = bizOrderLines();
  const revenue = lines.reduce((s, l) => s + l.revenue, 0);
  const cogs = Math.round(revenue * 0.6);
  const grossProfit = revenue - cogs;
  const status = trialStatus(CURRENT_BIZ);
  const platformFeeRate = status.active ? 0 : 0.05;
  const platformFee = Math.round(revenue * platformFeeRate);
  const netProfit = grossProfit - platformFee;

  document.getElementById("incomeStatement").innerHTML = `
    <table class="data-table">
      <tr><td>Sales revenue</td><td style="text-align:right;">${money(revenue)}</td></tr>
      <tr><td>Estimated cost of goods sold</td><td style="text-align:right;">(${money(cogs)})</td></tr>
      <tr><th>Gross profit</th><th style="text-align:right;">${money(grossProfit)}</th></tr>
      <tr><td>Platform fee ${status.active ? "(waived — free trial)" : "(5%)"}</td><td style="text-align:right;">(${money(platformFee)})</td></tr>
      <tr><th>Net profit</th><th style="text-align:right;">${money(netProfit)}</th></tr>
    </table>
    <p class="form-note">Cost of goods and fees are estimates for demonstration. Connect real accounting figures once a backend is in place.</p>`;

  const products = bizProducts();
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const cash = revenue;
  const totalAssets = inventoryValue + cash;
  const liabilities = status.expired ? Math.round(revenue * 0.05) : 0;
  const equity = totalAssets - liabilities;

  document.getElementById("balanceSheet").innerHTML = `
    <table class="data-table">
      <tr><th colspan="2">Assets</th></tr>
      <tr><td>Cash from sales</td><td style="text-align:right;">${money(cash)}</td></tr>
      <tr><td>Inventory on hand (at listed price)</td><td style="text-align:right;">${money(inventoryValue)}</td></tr>
      <tr><th>Total assets</th><th style="text-align:right;">${money(totalAssets)}</th></tr>
      <tr><th colspan="2">Liabilities &amp; equity</th></tr>
      <tr><td>Platform fees owed</td><td style="text-align:right;">${money(liabilities)}</td></tr>
      <tr><th>Owner's equity</th><th style="text-align:right;">${money(equity)}</th></tr>
    </table>`;
}

/* ---------- delivery & pickup locations ---------- */
function renderLocationChips() {
  selectedLocations = fmgLoad("fmg_biz_locations_" + CURRENT_BIZ.id, [CURRENT_BIZ.location]);
  const list = document.getElementById("locationChips");
  list.innerHTML = FMG.locations.map(l => `
    <button type="button" class="location-chip ${selectedLocations.includes(l.id) ? "selected" : ""}" data-loc="${l.id}">${l.label}</button>`).join("");
  list.querySelectorAll(".location-chip").forEach(btn => {
    btn.onclick = () => {
      const loc = btn.dataset.loc;
      if (selectedLocations.includes(loc)) selectedLocations = selectedLocations.filter(x => x !== loc);
      else selectedLocations.push(loc);
      fmgSave("fmg_biz_locations_" + CURRENT_BIZ.id, selectedLocations);
      btn.classList.toggle("selected");
      initMap();
    };
  });
}

let bizMap = null;
function initMap() {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;
  if (bizMap) { bizMap.remove(); bizMap = null; }
  bizMap = L.map("map").setView([0.0, 31.9], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors", maxZoom: 17
  }).addTo(bizMap);
  FMG.locations.forEach(loc => {
    const active = selectedLocations.includes(loc.id);
    const marker = L.circleMarker([loc.lat, loc.lng], {
      radius: active ? 9 : 6, color: active ? "#E8A93B" : "#1B2A4A", fillColor: active ? "#E8A93B" : "#1B2A4A", fillOpacity: 0.85
    }).addTo(bizMap);
    marker.bindPopup(`<strong>${loc.label}</strong><br>${active ? "Active pickup/delivery point" : "Not selected"}`);
  });
}

/* ---------- messages / feedback ---------- */
function renderMessages() {
  const feedback = FMG.getFeedback().filter(f => f.from === "business" && f.targetName === CURRENT_BIZ.name);
  const list = document.getElementById("messagesList");
  list.innerHTML = feedback.length
    ? feedback.map(f => `<div class="panel" style="margin-bottom:10px;padding:14px 16px;">
        <strong>${f.name}</strong> <span style="color:rgba(33,26,22,0.5);font-size:0.78rem;">· ${f.createdAt}</span>
        <p style="margin:6px 0 0;">${f.message}</p></div>`).join("")
    : `<p style="color:rgba(33,26,22,0.6);">No messages from shoppers yet.</p>`;
}

/* ---------- chatbot settings ---------- */
function renderChatbotSettings() {
  const saved = fmgLoad("fmg_biz_chatbot_" + CURRENT_BIZ.id, { persona: "friendly", greeting: `Hi! Thanks for visiting ${CURRENT_BIZ.name}. How can I help?` });
  document.getElementById("chatbotPersona").value = saved.persona;
  document.getElementById("chatbotGreeting").value = saved.greeting;
}
function saveChatbotSettings() {
  const persona = document.getElementById("chatbotPersona").value;
  const greeting = document.getElementById("chatbotGreeting").value.trim();
  fmgSave("fmg_biz_chatbot_" + CURRENT_BIZ.id, { persona, greeting });
  toast("Chat assistant settings saved.");
}

/* ---------- bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  CURRENT_BIZ = guardBusinessSession();
  if (!CURRENT_BIZ) return;

  document.getElementById("bizNameLabel").textContent = CURRENT_BIZ.name;
  const status = trialStatus(CURRENT_BIZ);
  const pill = document.getElementById("trialPill");
  pill.textContent = status.label;
  pill.classList.toggle("expired", status.expired);

  renderOverview();
  renderProductsTable();
  renderOrdersTable();
  renderFinance();
  renderLocationChips();
  renderMessages();
  renderChatbotSettings();

  document.querySelectorAll(".dash-nav a").forEach(a => {
    a.addEventListener("click", (e) => { e.preventDefault(); showSection(a.dataset.section); });
  });
  document.getElementById("logoutBtn").onclick = logout;
  document.getElementById("addProductBtn").onclick = () => openProductForm(null);
  document.getElementById("productFormClose").onclick = closeProductForm;
  document.getElementById("productFormSave").onclick = saveProductForm;
  document.getElementById("imageInput").addEventListener("change", (e) => handleImageSelect(e.target));
  document.getElementById("chatbotSaveBtn").onclick = saveChatbotSettings;

  showSection("sec-overview");
});
