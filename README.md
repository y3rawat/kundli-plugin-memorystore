# MemoryStore Kundli & Astrology Video Analyzer Plugin

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmemorystorein%2Fkundli-plugin-memorystore&env=GEMINI_API_KEY,MEMORYSTORE_PLUGIN_SECRET,FIREBASE_SERVICE_ACCOUNT_KEY&project-name=memorystore-kundli-plugin&repository-name=kundli-plugin-memorystore)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://ai.google.dev/)

An open-source, production-ready plugin for **[MemoryStore](https://memorystore.in)** that personalizes social media astrology videos (Instagram Reels, YouTube Shorts, TikToks) to a user's exact Vedic birth chart (Kundli).

---

## 🌟 What This Plugin Does

When users save astrology videos discussing planetary transits (e.g., *"Saturn entering 8th house"* or *"Jupiter transit remedies"*), this plugin:
1. **Computes the User's Natal Chart (Kundli)**: Uses high-precision Sidereal astronomical algorithms (Lahiri Ayanamsa) from Date of Birth, Time of Birth, and Place.
2. **Handles Unknown Birth Times (Chandra Kundali)**: If the user doesn't know their exact birth time, it automatically generates their **Moon Chart (Chandra Lagna)**, which is the classical Vedic baseline for transit predictions.
3. **Cross-Verifies Stated Rashi**: Validates user-stated Moon/Sun signs against calculated positions to ensure data integrity.
4. **AI Video & Transit Synthesis**: Uses **Google Gemini** to compare the video's claims and planetary combinations against the user's specific activated houses.
5. **Interactive Result Visualization**: Renders an interactive North Indian SVG Kundli diagram, transit impact breakdown, active house themes, and practical remedies directly inside MemoryStore.

---

## 🏗️ Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant MS as MemoryStore Host App
    participant Plugin as Kundli Plugin Server (Vercel)
    participant DB as Firebase Firestore
    participant AI as Google Gemini AI

    Note over User,MS: Phase 1: Onboarding Setup
    User->>MS: Taps [ Add to Library ] on Kundli Plugin
    MS->>Plugin: Opens Iframe Modal (GET /setup)
    User->>Plugin: Enters DOB, Time (or toggles Unknown), City, Rashi
    Plugin->>DB: Saves full chart in `astrology_user_profiles`
    Plugin-->>MS: Handshake via window.parent.postMessage({ profile_id, dob, moon_sign })
    MS->>MS: Stores profile_id in `user_plugins.user_config`

    Note over User,MS: Phase 2: Video Save & Webhook Trigger
    User->>MS: Saves astrology reel via ShareSheet or "@memorystore.in kundli"
    MS->>Plugin: POST /webhook (HMAC-SHA256 Signed Payload)
    Plugin-->>MS: 200 OK Accepted (Async background job starts)

    Note over Plugin,AI: Phase 3: AI Synthesis & Callback
    Plugin->>DB: Loads full natal chart using `profile_id`
    Plugin->>AI: Prompts Gemini: "Synthesize reel claims vs user's natal placements"
    AI-->>Plugin: Returns personalized transit impact, house activations & remedies
    Plugin->>DB: Saves analysis report in `astrology_video_analyses`
    Plugin->>MS: POST /api/plugins/results/callback (Signed with X-Plugin-Signature)
    MS->>MS: Marks result completed & binds result_url

    Note over User,MS: Phase 4: Interactive Result View
    User->>MS: Taps completed result in MemoryStore Library
    MS->>Plugin: Loads GET /view/:resultId in modal iframe
    Plugin-->>User: Renders SVG North Indian Kundli + Personalized Action Plan
```

---

## 🚀 1-Click Deployment (Vercel)

Click the button below to deploy your own instance of this plugin to Vercel in 1 click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmemorystorein%2Fkundli-plugin-memorystore&env=GEMINI_API_KEY,MEMORYSTORE_PLUGIN_SECRET,FIREBASE_SERVICE_ACCOUNT_KEY&project-name=memorystore-kundli-plugin&repository-name=kundli-plugin-memorystore)

---

## 🛠️ Local Development & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/memorystorein/kundli-plugin-memorystore.git
cd kundli-plugin-memorystore
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=3456
SERVER_BASE_URL=http://localhost:3456
MEMORYSTORE_PLUGIN_SECRET=mst_plugin_secret_astrology_123

# Google Gemini API Key (for AI video synthesis)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Service Account (Optional for local testing - runs in local storage mode if omitted)
FIREBASE_PROJECT_ID=memorystore-kundli-plugin
FIREBASE_CLIENT_EMAIL=your_service_account_email@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Start the Server
```bash
npm start
# or for auto-reloading:
npm run dev
```

Server endpoints:
* **Setup Iframe UI:** `http://localhost:3456/setup`
* **Webhook Endpoint:** `http://localhost:3456/webhook`
* **Health Check:** `http://localhost:3456/health`

### 5. Run the End-to-End Simulation
To test the complete workflow locally without needing live Instagram webhooks:
```bash
npm run simulate
```
This will:
1. Simulate a user onboarding via `/api/setup-chart` (calculating chart & saving profile).
2. Dispatch a signed HMAC-SHA256 webhook for an astrology video.
3. Run the AI synthesis worker.
4. Output a direct clickable link to view the resulting dashboard in your browser (`http://localhost:3456/view/res_...`).

---

## 🔒 Security & Privacy Architecture

This plugin adheres strictly to **MemoryStore's Zero-Leak Architecture**:
* **Locked Database Security:** Firebase Firestore security rules remain 100% locked to the public (`allow read, write: if false;`). Only this server accesses Firestore via authenticated Google Service Account credentials.
* **Cryptographic Request Signing:** All inbound webhooks from MemoryStore are verified using HMAC-SHA256 (`X-MemoryStore-Signature`).
* **Signed Results Callbacks:** All outgoing callback requests to MemoryStore include an `X-Plugin-Signature` header to prevent spoofing.
* **Encapsulation:** MemoryStore never requires direct credentials to your private database.

---

## 📡 API Reference

### `GET /setup`
Renders the dark-mode onboarding form inside MemoryStore's iframe modal.
* **Query Params:** `user_id`, `installation_id`
* **Handshake Event:** Dispatches `postMessage({ type: 'memorystore:plugin_config', config: { profile_id, dob, moon_sign, ... } })` upon submission.

### `POST /api/setup-chart`
Calculates Vedic birth chart and saves user profile to Firebase.
* **Body:**
  ```json
  {
    "userId": "usr_123",
    "dob": "1998-07-22",
    "tob": "14:30",
    "hasExactTime": true,
    "placeName": "Mumbai, India",
    "knownMoonSign": "Cancer",
    "geminiApiKey": "AIzaSy..."
  }
  ```

### `POST /webhook`
Inbound webhook receiver called by MemoryStore when an astrology video is saved.
* **Headers:** `X-MemoryStore-Signature: sha256=<hex>`
* **Body:**
  ```json
  {
    "event": "plugin.triggered",
    "result_id": "res_987123",
    "callback_url": "https://api.memorystore.co.in/api/plugins/results/callback",
    "memory": {
      "id": "mem_456",
      "title": "Saturn Transit in 8th House Impact",
      "url": "https://instagram.com/reel/xyz",
      "transcript": "..."
    },
    "user_config": {
      "profile_id": "profile_usr_123_19980722",
      "dob": "1998-07-22",
      "moon_sign": "Cancer"
    }
  }
  ```

### `GET /view/:resultId`
Interactive visual dashboard displaying North Indian Kundli chart (SVG), transit analysis, active house themes, and remedies.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/memorystorein/kundli-plugin-memorystore/issues).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
