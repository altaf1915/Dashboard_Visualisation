# SLU International Student Compliance Dashboard

Full-stack dashboard with React, Express, MongoDB, JWT authentication, CSV ingestion, protected routes, analytics pages, SQL validation views, and upload/re-ingestion tools.

## Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- npm

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=8001
MONGO_URL=mongodb://127.0.0.1:27017/dashboard_validation
DB_NAME=dashboard_validation
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8001
```

`JWT_SECRET` should be a long private string in real deployments. `CORS_ORIGINS` must include the frontend URL. `MONGO_URL` and `DB_NAME` control where user accounts are stored.

## Install and Run

```bash
npm install
npm run install:all
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
npm run dev
```

Open `http://localhost:3000`, register a new user, then log in. The backend runs on `http://localhost:8001`.

## Scripts

- `npm run dev` starts frontend and backend together.
- `npm run build` builds the frontend.
- `npm run start` starts the backend only.
- `npm run install:all` installs backend and frontend dependencies.
- `npm run seed --prefix backend` validates CSV ingestion without starting the API.

## What Was Fixed

- Replaced the incomplete Python backend runtime with a Node.js/Express backend.
- Added MongoDB-backed user registration, login, logout, `/api/auth/me`, JWT signing, and protected API middleware.
- Preserved the dashboard API routes used by the React pages.
- Added CSV ingestion for `data/connect.csv` and `data/sevis.csv`, including Connect deduplication by latest `Modified_At`.
- Added protected React routes, auth context, token persistence, API authorization headers, and logout navigation.
- Replaced brittle Create React App/CRACO setup with Vite.
- Added root, frontend, and backend package scripts.
- Added `.env.example` files with all required variables.

## API

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /health`

Protected:

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/filters/options`
- `GET /api/metrics/overview`
- `GET /api/metrics/eligibility`
- `GET /api/metrics/documents`
- `GET /api/metrics/fees`
- `GET /api/metrics/regional`
- `GET /api/sql/validations`
- `GET /api/insights`
- `POST /api/ingest`
- `POST /api/upload/connect`
- `POST /api/upload/sevis`

## Data

The backend loads the included CSVs at startup. Uploading a replacement CSV from the Data Upload page writes to the `data` folder and immediately re-ingests the dashboard data.
