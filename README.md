# LarvaLens 🔬

> **Video-based probable mosquito-larva screening with debris rejection and geotagged evidence.**

LarvaLens is an AI-assisted public-health surveillance and screening prototype. It processes short (5–10s) stagnant-water video clips, detects candidates, verifies morphology against environmental lookalikes (leaves, twigs, dust, ripples), tracks persistent motion with ByteTrack and camera motion compensation, and produces auditable evidence for field workers and health reviewers.

---

## 🏗️ Architecture & Tech Stack

- **Frontend (`apps/web`)**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Supabase JS, Leaflet & OpenStreetMap, Lucide Icons, PWA.
- **Backend (`apps/api`)**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn, OpenCV, PyTorch / Ultralytics, ByteTrack.
- **Database & Auth (`supabase/`)**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth, Private Storage Buckets (`scan-videos`, `scan-evidence`), Realtime Postgres changes.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd apps/api
# Ensure Python 3.11+ is installed
python -m pip install -r requirements.txt
cp ../../.env.example .env
# Start the FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

Backend API will be live at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd apps/web
npm install
cp ../../.env.example .env
npm run dev
```

Frontend application will be live at: `http://localhost:5173`

---

## 📋 Documentation

Detailed specifications and architectural guides are located in `/docs`:
- `01_PRD.md`: Product Requirements Document
- `02_TRD.md`: Technical Requirements Document
- `03_APP_FLOW.md`: Navigation and User Journeys
- `04_UI_UX.md`: UI/UX Design Brief & Tokens
- `05_BACKEND_SCHEMA.md`: Database Schema, RLS & Storage Architecture
- `06_IMPLEMENTATION_PLAN.md`: Implementation Sequence & Acceptance Criteria
