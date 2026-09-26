# THE FREE MARKET GLOBE

A responsive marketplace front-end for GROUP A MEMBERS KU MASAKA E-commerce 2026.

## Included
- Public marketplace with category and business-name/product search.
- User sign-up/login, cart, checkout flow and feedback.
- Business registration and dashboard for products, stock, discounts, sales and charts.
- Admin dashboard for users, businesses, products, traffic, progression and feedback.
- Six pickup/delivery locations with coordinates stored for future map integration.
- Consent-first cookies/data-use prompt.
- Client-side image compression and lazy loading for product images.
- MTN MoMo and Mastercard payment-method UI.
- Responsive desktop/mobile styling in black, dark brown, yellow, white and navy.

## Important deployment note
This ZIP is a browser-based prototype/demo: its current data layer uses `localStorage`. That means separate visitors do NOT share one production database, and the payment button records a demo order rather than charging a real MoMo/card account.

For production Git deployment, connect `js/data.js` to your server API/database and connect the checkout endpoint to an approved MTN MoMo and card payment gateway. Do not put payment secrets, database passwords, or admin passwords in browser JavaScript.

The UI is intentionally structured so the browser data layer can be replaced by API calls without rebuilding the pages.

## Local test
Open `index.html` in a modern browser. For the most reliable local testing use a static server, e.g.:
`python3 -m http.server 8080`
then open `http://localhost:8080/` from the `fmg` directory.

Demo admin credentials currently displayed by the prototype:
ADMIN GROUP A / KU MASAKA

Change these before production and move authentication to the server.


## GitHub deployment
Upload the contents of this package to the root of the repository so that
`index.html` is at the repository root. If GitHub Pages is used, set the
publishing source to the branch and folder containing `index.html`.

For production use, replace the browser `localStorage` data layer with a
server API and database, and connect checkout to approved payment providers.
The demo credentials in the prototype must not be used as production
credentials.
