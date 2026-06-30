# 🏛️ NagarSeva — AI-Powered Civic Issue Management Platform

> **"NagarSeva"** means *"Service to the City"* in Kannada/Hindi.
> A hyperlocal community issue reporting and resolution platform for Indian cities, starting with **Belagavi, Karnataka**.

---

## 🌐 Live Demo
**URL:** https://nagarseva-5e75a.web.app
**Backend API Docs (Swagger):** https://nagarseva-backend-1063854489421.asia-south1.run.app/docs

---

## 📌 One-Line Summary

> NagarSeva is like **Zomato for civic problems** — citizens report potholes, broken lights, or water leaks, and Google's AI automatically classifies the issue, routes it to the correct government department, tracks SLA deadlines, and sends the ward officer a weekly performance report — **all without any human doing the routing.**

---

## 🎯 The Problem We're Solving

India's cities face massive civic infrastructure challenges that affect **millions of citizens daily**:

| Problem | Impact |
|---|---|
| Citizens don't know **where to report** issues | Issues go unreported |
| Reports are **lost in bureaucracy** with no tracking | No accountability |
| **Duplicate complaints** waste administrative bandwidth | Inefficiency |
| Ward officers have **no data visibility** | Poor prioritization |
| Issues with **no political pressure** are ignored | Inequitable service |

**NagarSeva fixes all of this with AI automation.**

---

## 💡 Our Solution

NagarSeva creates a **transparent, data-driven civic pipeline** where:

1. 📸 A citizen reports an issue with a **photo + GPS location**
2. 🤖 **AI automatically classifies** the issue type, severity, and responsible department
3. 🗺️ The issue gets **tracked publicly** on a live map
4. 👍 Other citizens **upvote** to increase priority
5. ⏱️ **AI agents autonomously monitor** resolution time and escalate if deadlines are missed
6. 📧 Ward officers receive **automated weekly reports** on civic performance

---

## 🤖 The 5 AI Agents — The Heart of the Project

This is what makes NagarSeva truly unique. The platform runs **5 fully autonomous AI agents** powered by **Google Gemini 1.5 Pro**.

---

### 🧠 Agent 1 — Vision Classifier
**Trigger:** Every time a citizen submits a report
**Technology:** Gemini 1.5 Pro Vision API

**What it does:**
- Receives the photo and text description from the citizen
- Uses Gemini Vision to analyze the image in real-time
- Automatically identifies:
  - `Issue Type` → Pothole / Water Leak / Broken Light / Garbage / Encroachment
  - `Severity` → Scale of 1–5
  - `Responsible Department` → PWD / BMC / BESCOM / BBMP
  - `Confidence Score` → 0.0 to 1.0

**Example AI Output:**
```json
{
  "type": "Pothole",
  "severity": 4,
  "department": "PWD (Public Works Department)",
  "confidence": 0.91
}
```

**Why it matters:** Zero human intervention in routing — no call centers, no manual triage.

---

### 🔀 Agent 2 — Duplicate Merger
**Trigger:** Runs every 5 minutes automatically (APScheduler)
**Technology:** Gemini `text-embedding-004` + Haversine Formula

**What it does:**
- Scans all open issues in Firestore database
- Uses **Haversine distance** to find issues within 100 meters of each other
- Uses **Gemini text-embedding-004** to compute semantic similarity of descriptions
- If two issues are about the same thing in the same area → **automatically merges them** and consolidates upvotes
- Prevents the same pothole from being reported 20 times separately

**Why it matters:** Cleaner data = better prioritization. No more noise for ward officers.

---

### ⏱️ Agent 3 — SLA Watchdog
**Trigger:** Runs every 2 minutes automatically (APScheduler)
**Technology:** Firestore querying + Gemini escalation logic

**SLA Targets:**
| Severity | Label | Resolution Deadline |
|---|---|---|
| 5 | Critical | 24 hours |
| 4 | High | 48 hours |
| 3 | Medium | 72 hours |
| 1–2 | Low | 7 days |

**What it does:**
- Checks every open issue against defined SLA targets
- If a deadline is breached → auto-escalates (status → "Escalated")
- Logs all SLA violations for the weekly audit report
- Notifies the relevant department head

**Why it matters:** Issues can **no longer be silently ignored.**

---

### 🗺️ Agent 4 — Predictive Hotspot Forecaster
**Trigger:** Runs every 30 minutes (weekly in production)
**Technology:** Gemini 1.5 Pro + Firestore historical data

**What it does:**
- Analyzes multi-year historical issue data (by ward, by season, by category)
- Feeds raw trend data to Gemini with a civic analyst prompt
- Gemini generates a **natural language forecast**:

  > *"Ward 12 has shown a consistent 45% spike in Pothole reports during June–August over the last 3 years. High risk of road deterioration expected this monsoon season. Recommend preventive maintenance before June 15."*

- Forecasts are saved to Firestore and displayed on the public dashboard

**Why it matters:** Shifts civic maintenance from **reactive → proactive.**

---

### 📧 Agent 5 — Weekly Digest Generator
**Trigger:** Runs every 30 minutes (every Monday 8 AM in production)
**Technology:** Gemini 1.5 Pro + Firestore aggregation

**What it does:**
- Scrapes the last 7 days of civic activity from Firestore
- Computes key metrics: Issues Opened, Resolved, Avg Resolution Time, Category Breakdown, SLA Compliance Rate
- Sends raw JSON to Gemini which autonomously drafts a **professional Markdown report** for the Ward Officer
- Highlights critical "Areas of Concern" based on the numbers
- Saves the digest to the `weekly_digests` collection in Firestore

**Example Digest Excerpt:**
> **Week of June 17–24, 2026 | Ward 12 Report**
> 🔴 Area of Concern: 8 pothole complaints opened, only 2 resolved (75% SLA breach rate). Immediate action required.

---

## 🗺️ Google Maps Integration

The platform features a **live civic heatmap** powered by Google Maps:

- **Issue Clustering:** Dozens of issues in the same area are grouped into a numbered cluster bubble, preventing map clutter
- **Severity Heatmap:** Red zones = dangerous high-severity areas, Green = safe zones. Color intensity updates in real-time
- **Interactive Markers:** Click any marker to see the photo, AI classification, upvote count, and current status

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React PWA)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Login   │ │   Home   │ │  Report  │ │  Map View  │ │
│  │  (OTP)   │ │  Feed    │ │  Form    │ │  Heatmap   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────┐
│               BACKEND (FastAPI / Python 3.11)            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              APScheduler (Background)             │   │
│  │  Agent 2 (5m) │ Agent 3 (2m) │ Agent 4/5 (30m)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  POST /issues ──► Agent 1 (Vision Classifier)            │
│  POST /agents/sla-watchdog ──► Agent 3                   │
│  POST /agents/duplicate-merger ──► Agent 2               │
│  POST /agents/predictive-engine ──► Agent 4              │
│  POST /agents/weekly-digest ──► Agent 5                  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      DATA LAYER                          │
│   Firebase Auth    │  Firestore DB   │  Firebase Storage │
│   (Phone OTP)      │  (Issues,       │  (Photo uploads)  │
│                    │   Digests,      │                   │
│                    │   Forecasts)    │                   │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   GOOGLE AI LAYER                        │
│   Gemini 1.5 Pro Vision  │  text-embedding-004           │
│   (Image Classification) │  (Semantic Similarity)        │
│   (Digest Generation)    │  (Duplicate Detection)        │
│   (Hotspot Forecasting)  │                               │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Full Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | PWA, mobile-first UI |
| **Styling** | Vanilla CSS (design tokens, glassmorphism) | Premium visual design |
| **Routing** | React Router v7 | SPA navigation |
| **Maps** | Google Maps JS API + Heatmap Library | Live civic map |
| **Auth** | Firebase Authentication (Phone OTP) | Secure login |
| **Database** | Cloud Firestore | Real-time issue tracking |
| **Storage** | Firebase Storage | Photo uploads |
| **Backend** | Python 3.11 + FastAPI | REST API + agent orchestration |
| **AI/ML** | Google Gemini 1.5 Pro + text-embedding-004 | 5 AI agents |
| **Scheduling** | APScheduler | Background agent execution |
| **Hosting** | Firebase Hosting | Frontend deployment |
| **Backend Hosting** | Google Cloud Run | Containerized backend |

---

## 🏆 Hackathon Evaluation Alignment

| Criteria | Weight | How NagarSeva Addresses It |
|---|---|---|
| **Problem Solving** | 20% | Solves a real, painful problem affecting millions of Indians — broken civic accountability |
| **Agentic Depth** | 20% | 5 fully autonomous AI agents (Vision, Dedup, SLA, Predictive, Digest) running on schedules |
| **Innovation** | 20% | Proactive AI forecasting + automatic escalation — not just a simple reporting form |
| **Google Technologies** | 15% | Gemini 1.5 Pro, text-embedding-004, Firebase Auth/Firestore/Storage, Google Maps API, Cloud Run |
| **Product Experience** | 10% | PWA, mobile-first UI, glassmorphism design, offline capability |
| **Technical Implementation** | 10% | Clean FastAPI + React architecture, Docker-ready, proper error handling |
| **Completeness** | 5% | Auth → Report → Map → Agent Pipeline → Dashboard → Digest. All flows functional. |

---

## 📱 Key User Flows

### Citizen Flow
1. Open app → Login with Phone OTP (Firebase Auth)
2. Browse Home Feed → See all reported issues with severity badges
3. Tap **Report** → Upload photo + add description + GPS auto-detected
4. AI Vision Agent classifies the issue in real-time (~2 seconds)
5. Issue appears on the live map immediately
6. Upvote issues you've also seen → boosts their priority

### Ward Officer Flow
1. Login → View Impact Dashboard with city-wide statistics
2. See which wards have highest SLA breach rates
3. Receive Monday morning Weekly Digest email with Gemini-drafted report
4. Monitor escalated issues on the map

---

## 📁 Project Structure

```
civic/
├── frontend/                   # React PWA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Phone OTP auth
│   │   │   ├── Home.tsx        # Issue feed
│   │   │   ├── Report.tsx      # Issue reporting form
│   │   │   ├── MapViewer.tsx   # Google Maps + Heatmap
│   │   │   ├── Profile.tsx     # Civic points + badges
│   │   │   └── Impact.tsx      # City-wide stats dashboard
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Firebase Auth provider
│   │   └── lib/
│   │       └── firebase.ts     # Firebase config
│   └── .env.local              # API keys
│
└── backend/                    # FastAPI Python server
    ├── main.py                 # App entry point + APScheduler
    ├── app/
    │   ├── api/
    │   │   ├── issues.py       # CRUD endpoints for issues
    │   │   └── agents.py       # Agent trigger endpoints
    │   ├── services/
    │   │   ├── agent_vision.py     # Agent 1: Gemini Vision
    │   │   ├── agent_duplicate.py  # Agent 2: Dedup + Merge
    │   │   ├── agent_sla.py        # Agent 3: SLA Watchdog
    │   │   ├── agent_predictive.py # Agent 4: Forecaster
    │   │   └── agent_digest.py     # Agent 5: Weekly Report
    │   ├── models/
    │   │   └── issue.py        # Pydantic data models
    │   └── core/
    │       └── config.py       # Firebase initialization
    ├── Dockerfile              # For Google Cloud Run
    └── requirements.txt        # Python dependencies
```

---

## 🧠 Key Technical Innovations

### 1. Multi-Agent Agentic Architecture
Each agent is completely autonomous with a single responsibility:
- **Agent 1** handles intake and classification using **Gemini Vision**
- **Agent 2** runs continuous deduplication using **vector embeddings + spatial indexing**
- **Agent 3** enforces SLA compliance through **scheduled polling**
- **Agents 4 & 5** handle **predictive analytics and automated reporting**

### 2. Semantic Deduplication
Combining **geographic proximity** (Haversine formula) with **semantic text similarity** (Gemini embeddings) to detect duplicate reports — a novel approach to civic data quality.

### 3. Proactive AI Forecasting
Instead of just reacting to issues, Agent 4 analyzes historical trends and **predicts future problem hotspots** before they occur — shifting government from reactive to preventive maintenance.

### 4. Zero-Human Routing
From citizen photo submission to department assignment — the entire intake pipeline requires **zero human intervention** thanks to Gemini Vision's real-time classification.

---

## 🎯 Impact & Scalability

- **Belagavi, Karnataka** — initial target city with 5 wards
- Architecture designed to scale to any Indian city with **ward-level configuration**
- Firestore's real-time capabilities support **thousands of concurrent users**
- Cloud Run backend auto-scales based on load
- Progressive Web App (PWA) works on **any device, no app store needed**

---

## 👨‍💻 For Technical Judges

> *"We built a multi-agent agentic system where each autonomous agent has a distinct responsibility in the civic issue lifecycle. Agent 1 handles intake and classification using Gemini Vision. Agent 2 runs continuous deduplication using vector embeddings and spatial indexing. Agent 3 enforces SLA compliance through scheduled polling. Agents 4 and 5 handle predictive analytics and automated reporting using Gemini's generative capabilities. The entire backend is event-driven and cloud-native, designed for Google Cloud Run deployment."*

---

## 🗣️ For Non-Technical Judges

> *"Imagine you see a giant pothole and want to report it. Right now, you don't know who to call, and even if you do, nothing happens. With NagarSeva, you just open the app, take a photo, and tap Submit. The AI reads the photo, figures out it's a pothole, and tells the Roads Department about it. If they don't fix it in 48 hours, the app automatically escalates it to the department head. Every Monday, the ward officer gets a neat report telling them how their team performed. The AI also predicts where new potholes are likely to appear before monsoon — so the government can fix roads before they break!"*

---

*Built with ❤️ for Belagavi, Karnataka — and every city that deserves better civic services.*

**Live at:** https://nagarseva-5e75a.web.app
