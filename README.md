Meal-Kit Delivery Database Application

This is a full-stack web application for managing a meal-kit delivery service (DBMS Mini-Project). It uses a three-tier architecture: a responsive frontend, a Node.js/Express backend, and a MySQL database with procedures, views, and triggers.

Project Structure

- frontend/: User interface (HTML + Tailwind CSS + vanilla JS)
- backend/: Node.js/Express API server (MySQL via mysql2/promise)
- database/: SQL scripts for schema (DDL), seed data (DML), triggers, procedures, functions, and views

Prerequisites

- Node.js and npm
- MySQL Server and a client (e.g., MySQL Workbench)

Setup and Run

1) Create the database and objects

Open your MySQL client and run these scripts from the `database/` folder in order:

1. 01_DDL.sql      — creates the schema and tables
2. 02_DML.sql      — inserts seed/sample data
3. 03_Triggers.sql — creates triggers
4. 04_Procedures.sql — creates stored procedures
5. 05_Functions.sql  — creates functions
6. 06_Views.sql      — creates views
7. 07_Auth.sql       — adds Username/Password columns and seeds extra preferences
8. 08_AllergySeeds.sql — seeds additional allergies (Shellfish, Soy, Sesame, Mustard, Sulfites, Celery, Lupin)

Note: The backend expects these objects (e.g., `sp_RegisterCustomer`, `sp_PlaceOrder`, `sp_RecommendMealKits`, and views like `vw_CustomerOrderSummary`, `vw_ActiveOrders`).

2) Configure and run the backend server

In a terminal:

```bash
cd backend
npm install
cp .env.example .env  # On Windows Bash, use: cp backend/.env.example backend/.env from repo root
```

Edit `backend/.env` and set your MySQL credentials:

```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=meal_kit
PORT=3001
```

Start the server:

```bash
npm run dev   # auto-restart with nodemon
# or
npm start     # plain node
```

When running, you should see: `Server is listening on port 3001`.

Admin configuration

- Restrict admin actions to a single person by setting this in `backend/.env`:

```
ADMIN_EMAIL=admin@mealkit.local
```

- Optional: in the frontend you can hint the admin email for showing the Admin button by adding to `frontend/index.html` before loading scripts:

```html
<script>window.ADMIN_EMAIL_OVERRIDE = 'admin@mealkit.local';</script>
```

3) Launch the frontend

Open `frontend/index.html` in your browser (double-click or use a simple static server). The app will call `http://localhost:3001/api` by default.

If your backend runs on a different host/port, set this variable in the browser console before page load or inject it via a small script tag:

```html
<script>window.API_BASE_URL_OVERRIDE = 'http://localhost:4000/api';</script>
```

Key API Endpoints

- GET /api/health — backend + DB health
- GET /api/master-data — allergies and dietary preferences
- POST /api/register — create a customer (uses `sp_RegisterCustomer`)
- POST /api/login — lookup and return customer by email
- POST /api/orders — place an order (uses `sp_PlaceOrder`)
- GET /api/mealkits/recommendations/:customerId — personalized suggestions (uses `sp_RecommendMealKits`)
- GET /api/dashboard/:customerId — summary + active orders (uses views)
- GET /api/orders/history/:customerId — order history
- GET /api/preferences — list dietary preferences
- POST /api/admin/preferences — add a dietary preference (simple admin)

Notes and Guidelines

- Authentication is simplified to email-based lookup for demo purposes; you can extend with passwords/tokens if required by your rubric.
- The UI is componentized with vanilla JS; styles are via Tailwind CDN + a small custom stylesheet.
- CORS is enabled in the backend for local development.

Authentication (Username + Password)

- Registration now supports optional `username` and `password` fields. They are stored in `Customers.Username` and `Customers.Password_Hash` (bcrypt). If you want credentialed login, ensure you applied `database/07_Auth.sql`.
- Login accepts `identifier` (email or username) and `password`.
- For backward-compatibility, email-only login still works if no password is set.

Admin Tools (Preferences)

- Go to the Admin page in the frontend to add new dietary preferences (e.g., Non-Vegetarian, Keto, Mediterranean, South Indian, Mexican).
- The new preferences are immediately available in the registration form and via `/api/master-data`.

Orders History

- Use the Orders page to view past orders. Backend uses a view `vw_OrderHistory` if present, falling back to `Orders`.

Delivery Driver Integration Steps

Below is a lightweight, practical approach you can implement right away (no extra server code required):

1. Capture the full delivery address during registration (already included) or during checkout.
2. Generate a Google Maps navigation link using the address:
	- Pattern: `https://www.google.com/maps/dir/?api=1&destination=<ENCODED_ADDRESS>`
	- Example for a customer: `https://www.google.com/maps/dir/?api=1&destination=221B%20Baker%20Street%2C%20London`
3. Share this link with the delivery driver:
	- Manual: copy/paste into WhatsApp/Email/SMS.
	- Programmatic (optional): integrate an SMS/WhatsApp API like Twilio from the backend to send the link to the driver’s number.
4. (Optional, more robust) Geocode the address for accuracy and ETAs:
	- Use Google Geocoding API or OpenStreetMap Nominatim to turn the address into coordinates.
	- Store lat/lng in a `Deliveries` table along with `Order_ID`, `Driver_ID`, and `Status` (ASSIGNED, OUT_FOR_DELIVERY, DELIVERED).
	- Provide a small driver-facing page showing the destination and a “Start Navigation” button that opens the Maps link.

This approach meets mini-project scope while being easy to demo. You can scale it later with real driver accounts, push notifications, and live tracking.

Troubleshooting

- If the frontend shows errors fetching data, verify the backend is running and `backend/.env` is correct.
- Run `GET http://localhost:3001/api/health` to ensure DB connectivity is OK.
- Ensure all SQL scripts completed successfully and the stored procedures and views exist in your schema.