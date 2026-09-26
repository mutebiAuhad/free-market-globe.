# THE FREE MARKET GLOBE

A working front-end prototype of the marketplace described in the brief: a public
storefront, user accounts, business accounts with a full dashboard, and an admin
panel — built as static HTML/CSS/JS so you can open it immediately or host it
anywhere (GitHub Pages, Netlify, your own server) and swap in a real backend later.

## Files

```
index.html                 Public marketplace: search, categories, product grid,
                            sign up / log in, cart, checkout, chatbot, feedback
business-dashboard.html    Business account area (see below)
admin.html                 Admin login gate + admin panel
css/style.css              All styling (black / dark brown / gold / white / navy)
js/data.js                 Seed data + the storage layer (see "How data is stored")
js/main.js                 Public site behaviour
js/dashboard.js            Business dashboard behaviour
js/admin.js                Admin panel behaviour
```

Open `index.html` in a browser to try it, or push the whole folder to your
GitHub repo and enable GitHub Pages / any static host.

## Demo logins

- **Admin:** name `ADMIN GROUP A`, password `KU MASAKA` (as specified in the brief).
- **Sample business:** `masaka.threads@example.com` / `demo1234` (three other
  seeded businesses use the same password — see `js/data.js`).
- **Users:** sign up fresh from the "Sign up" button — no seeded user accounts.

## What's implemented

- Public site with category browsing, keyword search, product detail view,
  cart, and a demo checkout (MTN MoMo / Mastercard fields).
- Sign up / log in as a **user** or a **business**; admin login is a separate,
  fixed credential as specified.
- **Business dashboard:** upload/edit/delete products (photo, category, price,
  discount, stock), sales & orders list, income statement, balance sheet,
  a 6-month progression graph, sales-per-month chart, a map (OpenStreetMap +
  Leaflet) of the six delivery/pickup towns with multi-select, a chat
  assistant settings panel, and shopper messages/feedback.
- **Admin panel:** users list, businesses list, all product listings with
  delete, web-traffic chart, user/business growth graphs, a downloadable
  report, all feedback (from shoppers, businesses, and general site feedback),
  and a place to set the MoMo/Mastercard accounts businesses pay into.
- First-100-businesses free-for-6-months logic: the counter lives in
  `localStorage` (`fmg_registered_business_count`) and each new business
  signup checks and decrements the remaining slots.
- A cookie/data-use consent banner gates nothing but is shown until accepted
  or declined, with a full terms modal, per the brief's data-mining consent
  requirement.
- Product photos are resized/compressed in the browser (max 700px, JPEG ~72%
  quality) before saving, so uploads don't bloat or slow the page down.
- Rule-based chat assistant on the public site (delivery points, payment
  methods, discounts, cart questions) and a per-business assistant settings
  screen on the dashboard.
- Responsive layout: the same pages work on desktop and phone screens.

## How data is stored (important)

This prototype has **no server** — every account, product, order and message
lives in the browser's `localStorage`, seeded on first load by `js/data.js`.
That makes it fully working as a demo/prototype, but it means:

- Data is **per-browser**. A product a business uploads on their laptop won't
  appear on someone else's phone until you connect a real backend.
- It is **not secure storage** — passwords are stored in plain text in
  `localStorage`. Do not use real passwords or go live with this as-is.
- Payments are **simulated**. The checkout screen collects a phone number or
  card number and marks the order "paid (demo)" — no money moves. To accept
  real MTN MoMo or Mastercard payments you must integrate MTN's Mobile Money
  API and a card processor (e.g. Flutterwave, Pesapal, or a direct Mastercard
  gateway) on a real server, and never handle raw card numbers/PINs in
  client-side JavaScript.

Every place that reads or writes data goes through the small `FMG` object at
the bottom of `js/data.js` (`FMG.getProducts()`, `FMG.saveProducts()`, etc.),
so connecting a real backend means rewriting the inside of those functions to
call your API instead of `localStorage` — the rest of the app doesn't need to
change.

## Turning this into a production site

To go live for real users you will need, at minimum:

1. **A backend + database** (Node/Express, Django, Laravel, etc. with
   PostgreSQL/MySQL/MongoDB) to replace `localStorage`, so data is shared
   across devices and not editable by users in their browser console.
2. **Real authentication** — hashed passwords (never plain text), sessions or
   JWTs, and the admin credential moved server-side rather than sitting in
   the front-end JavaScript.
3. **Real payment integration** — MTN Mobile Money Open API (or an aggregator
   that supports it) and a card gateway that supports Mastercard, both called
   from your server, with webhooks to confirm payment before marking an
   order paid.
4. **Image storage** — move uploaded photos to a service like S3/Cloudinary
   instead of storing base64 in the database, and serve them through a CDN.
5. **HTTPS everywhere**, and a privacy policy matching whatever real data
   mining/analytics you turn on for businesses.

## Colour & type system

- Colours: black `#14110F`, dark brown `#3B2417`, gold `#E8A93B`, white
  `#FBF9F6`, navy `#1B2A4A` — matching the brief.
- Type: "Fraunces" for headings, "Work Sans" for body/UI text (Google Fonts,
  loaded via `<link>` in each HTML file).

## Footer

Every page carries the required footer line:
"All rights reserved to GROUP A MEMBERS KU MASAKA E-commerce 2026"
# free-market-globe.
