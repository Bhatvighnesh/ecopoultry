# EcoPoultry — Smart Poultry Waste Management and Productivity Analyzer

A sensor-driven IoT web application for poultry coop monitoring: real-time environmental
monitoring with automatic actuator response, measured (not estimated) waste/biogas/fertilizer
projection, automatic productivity metrics (FCR, Hen-Day %), one Decision Tree flock-health
classifier, and sensor-triggered egg freshness testing.

Every metric on the dashboard comes from continuous sensor data. The only manual data entry
anywhere in the system is the Admin Settings panel (flock size, thresholds, periodic bird-weight
updates) — set occasionally, not re-entered per calculation.

## Architecture

```
backend/       Node.js + Express + Mongoose + Socket.IO   (REST ingestion API, real-time layer, auth)
ml-service/    Python + Flask + scikit-learn              (one Decision Tree classifier, served via /predict)
frontend/      React + Vite + Chart.js                    (live dashboard, role-based views)
```

The Node backend is the source of truth: it validates and stores every sensor reading, computes
thresholds/rates/ratios, calls the Flask ML endpoint on every new environment reading, commands
the actuator relay in a closed loop, raises alerts, and broadcasts everything over Socket.IO.
Flask is a thin classifier server with no persistence — Node stores every prediction
(`ProductivityPrediction`) for traceability.

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+ (a venv is recommended)
- MongoDB (local `mongod`, or a MongoDB Atlas connection string)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI, JWT_SECRET, etc.
npm run seed:admin        # creates the first Admin account (see .env for credentials)
npm run dev                # starts on http://localhost:5000
```

No physical ESP32 nodes yet? Run the bundled simulator in a second terminal — it posts to the
same ingestion endpoints at the same cadence real nodes would (see "Hardware mapping" below):

```bash
npm run simulate
```

### 2. ML microservice

```bash
cd ml-service
python -m venv venv
./venv/Scripts/activate    # or `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
python generate_synthetic_data.py   # writes synthetic_training_data.csv
python train_model.py               # trains + saves model/productivity_model.joblib
python app.py                        # starts on http://localhost:5001
```

The Node backend calls this service on every new environment reading (`ml.service.js`). If it's
down, ingestion still succeeds — the backend just skips the classification for that reading.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env       # points at the backend REST + Socket.IO URLs
npm run dev                 # starts on http://localhost:5173
```

Log in with the seeded admin account, then use **Users** (Admin only) to create Farmer accounts.

## Environment variables

### backend/.env
| Variable | Purpose |
|---|---|
| `PORT` | Express server port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `CORS_ORIGIN` | Allowed frontend origin for CORS + Socket.IO |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens — set a long random value |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `ML_SERVICE_URL` | Base URL of the Flask classifier service |
| `STALE_DATA_MS` | If a node hasn't posted within this window, dashboard flags it stale (default 20000) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Used only by `npm run seed:admin` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio credentials for WhatsApp alerts (optional - critical alerts are skipped silently if unset) |
| `TWILIO_WHATSAPP_FROM` / `TWILIO_WHATSAPP_TO` | Twilio WhatsApp sandbox number and the recipient's WhatsApp number, both in `whatsapp:+E164` format |

### frontend/.env
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend REST base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO URL (usually the same host) |

All secrets are environment-variable driven; `.env` files are gitignored.

## Hardware mapping — which node posts where, how often

| Node | Sensors | Endpoint | Cadence |
|---|---|---|---|
| Coop node | DHT11 (temp/humidity), MQ135 (gas, raw 0-4095), PIR (activity count/min) | `POST /api/sensors/environment` | every 5s |
| Feed tray node | Load cell (grams) | `POST /api/sensors/feed` | every 5s |
| Waste tray node | Load cell (grams, separate from feed) | `POST /api/sensors/waste` | every 5s |
| Egg collection sensor | IR break-beam | `POST /api/sensors/egg-event` | one event per egg, as it happens |
| Egg freshness sensor | Dedicated MQ135, held to an egg by a farmer | `POST /api/sensors/freshness-test` | on demand (physical trigger, requires farmer login) |
| Backend → coop node | Relay (fan/heater) | `POST /api/actuators/relay` (also called internally on every critical reading) | on state change only |
| Coop node → backend | Relay state poll | `GET /api/actuators/device-state` | every 5s (coop node polls this and drives its relay pin to match) |

Ingestion endpoints (`/environment`, `/feed`, `/waste`, `/egg-event`) and the actuator state poll
(`/actuators/device-state`) are intentionally left open (no JWT) because ESP32 nodes can't
practically hold a user session. **For a real deployment, put a shared device API key check in
front of them** (a small middleware checking a header against an env var) — this was left out
here to keep the IoT-facing surface minimal for a class project, but is called out explicitly as
a gap.

## How the core calculations work

- **Waste rate**: summed only from *positive* deltas between consecutive waste-tray readings
  (a large negative delta means the tray was emptied and is excluded). Extrapolated to kg/day,
  then biogas (`× 0.03 m³/kg`) and fertilizer (`× 0.45 kg/kg`) — both fixed, documented constants.
- **Feed consumed**: summed only from *negative* deltas (drops = consumption; a refill jump is
  excluded the same way).
- **FCR** = feed consumed (kg, auto-summed over the selected period) / weight gain (kg, from the
  periodic Admin Settings entry). Classified `<1.8` Efficient, `1.8–2.2` Average, `>2.2` Needs
  Attention.
- **Hen-Day %** = egg events ÷ (flock size × days elapsed) × 100, recomputed on every new egg
  event and for any custom report date range.
- **Ammonia buildup zone** and **egg freshness** are both simple threshold classifications
  against Admin-configurable cutoffs — no ML involved.

See `backend/src/services/` for the pure, unit-tested implementations.

## The ML classifier (Objective 3)

`ml-service/generate_synthetic_data.py` generates ~600 rows of **synthetic, domain-rule-labeled**
training data — there is no real farm dataset for this project. Rules like "high gas + low
activity + declining feed intake ⇒ Critical" assign labels, with random noise added so the tree
doesn't just memorize thresholds. `train_model.py` trains a single, shallow
`DecisionTreeClassifier` (scikit-learn) on `[temperature, humidity, gas, activity, feedTrend]`
and saves it with `joblib`. `app.py` serves it via one `/predict` endpoint. This is the **only**
ML model in the system.

**To retrain:**
```bash
cd ml-service
python generate_synthetic_data.py   # regenerate the synthetic dataset (edit label_row() to change rules)
python train_model.py               # retrain and overwrite model/productivity_model.joblib
# restart app.py (or it'll lazy-load the new model file on next /predict call after a restart)
```

The dashboard shows the classification alongside the tree's feature importances (which input
most influenced this particular result) via `ProductivityPrediction.featureImportances`.

## Testing

```bash
cd backend
npm test
```

Unit tests cover the three calculations explicitly called out as required: FCR classification
(`tests/fcr.test.js`), Hen-Day % (`tests/henday.test.js`), and waste-rate extraction from raw
load-cell deltas including tray-empty/refill handling (`tests/wasteRate.test.js`).

## Roles

- **Admin**: Settings (thresholds, flock size, bird weight), user management, all data views,
  reports, alert acknowledgement, manual actuator override.
- **Farmer**: live dashboard, alerts (read-only), trigger egg freshness test, productivity/waste
  trends, ML classification. Settings are visible but read-only.

## Known Limitations

- **The productivity classifier is trained on synthetic, domain-rule-labeled data, not real
  flock outcomes.** It encodes reasonable poultry-husbandry heuristics (e.g., high ammonia +
  low activity + falling feed intake is concerning), not a validated relationship between
  sensor readings and actual flock health. Treat its output as a proof-of-concept signal to
  corroborate other readings, not a diagnostic tool.
- No physical ESP32 firmware is included — `backend/scripts/simulate-sensors.js` stands in for
  real nodes during development/demo, posting to the exact same endpoints real hardware would.
- The egg freshness test in the UI simulates the live MQ135 reading a real dedicated sensor
  would provide when a farmer holds an egg to it (there's no such hardware yet); the
  classification logic itself (`threshold.service.js`) is what a real reading would run through.
- Ingestion endpoints have no device authentication (see "Hardware mapping" above) — acceptable
  for a local network deployment/demo, not for an internet-exposed production system.
- Waste/feed rate calculations use a rolling time window; immediately after a fresh deployment
  (before the window has real data spread across it), extrapolated rates can be noisy until
  enough readings accumulate — this is inherent to any short-window rate estimator, not a bug.
- FCR assumes the Admin's periodic bird-weight-gain entry represents the whole flock's gain over
  the stated period — a simplification appropriate for a small-flock final-year project, not a
  precision livestock-farming calculation.
