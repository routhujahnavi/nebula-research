# 🚀 Nebula Research — AI Deep Research Platform

**Live Production URL:** [https://nebula-research.vercel.app](https://nebula-research.vercel.app)

Nebula Research is a production-grade, real-time AI Deep Research platform that combines live web crawling, fact extraction, cross-reference auditing, conflict detection, consensus synthesis, and interactive workspaces. The system compiles into an optimized Next.js 15 production build powered by Next.js Turbopack and Context.dev APIs.

---

## 🌟 Key Features

### 1. 10-Step AI Reasoning Timeline
- Streams backend server execution states directly to a terminal-styled timeline UI via Server-Sent Events (SSE).
- Displays live step logging, execution durations, loaders, and consensus alerts in real-time.

### 2. Coherent Metrics Trend Line Charting
- Dynamically extracts chronological sequences (e.g. year-over-year percentages, financial growths) from scraped markdown.
- Utilizes **block-proximity clustering** (lines within 4 lines of each other) to ensure data points come from the same table, list, or paragraph.
- Validates data series for chronological monotonicity and filters out scale mismatches and implausible jumps (>100x variance) to draw clean, interactive SVG trend lines.

### 3. Interactive SVG Source Graph
- Renders an interactive, responsive node-link mapping graph visualizing the relations between search terms, cited domains, and authority weightings.
- Support hover states to highlight matching connections and cross-referenced claims.

### 4. Radial Confidence Meter
- An animated, circular SVG gauge mapping consensus reliability, source domain authority, and citation freshness ratings.

### 5. Drag-and-Drop Workspace Sandbox
- Provides a split-pane layout containing an interactive research workspace.
- Users can drag extracted evidence cards into the workspace, adjust coordinates, compose markdown summaries, and auto-save sessions directly to local storage.

### 6. AI Audio Briefing Summary
- Leverages the native HTML5 Web Speech API (`window.speechSynthesis`) to read consensus briefs aloud.
- Features a dropdown voice filter for premium voices and a glowing equalizer visualizer (8 staggered bouncing bars powered by Framer Motion).

### 7. Quick-Share QR Code Modal
- Allows users to share research briefs instantly.
- Generates a scannable QR Code pointing to the shared snapshot view via `api.qrserver.com`.
- Includes a copy-link clipboard button and a local PNG downloader.

---

## 🛠️ Technology Stack

*   **Core Framework**: Next.js 15.5 (App Router, Turbopack, Server Actions)
*   **Language**: TypeScript (Strict typing check)
*   **Styling & Theme**: TailwindCSS with CSS variables configured for premium glassmorphism glow grids
*   **Animations**: Framer Motion
*   **External APIs**: Context.dev API (Web Search, Markdown scraping, Webpage Screenshots, Brand Asset retrieval)
*   **Icons**: Lucide React
*   **Export Utilities**: JSPDF, html2canvas, canvas-confetti

---

## 📁 Project Directory Structure

```
src/
├── app/
│   ├── api/research/route.ts       # SSE deep research pipeline & series extractor
│   ├── api/config/route.ts         # Server-side configuration flags
│   ├── share/[id]/page.tsx         # Static shared report viewer
│   ├── globals.css                 # Premium dark-mode variables, flows, and glow keyframes
│   ├── layout.tsx                  # Global app shell with grid background
│   └── page.tsx                    # Main Search console, workspace, and dashboard
├── components/
│   ├── AudioBriefing.tsx          # TTS player + animated equalizer bars
│   ├── CommandPalette.tsx          # Quick search CMD+K interface
│   ├── ConfidenceMeter.tsx         # Radial accuracy score gauge
│   ├── EvidenceCard.tsx            # Drag-and-drop citation card
│   ├── ReasoningTimeline.tsx       # Live logging terminal UI
│   ├── ResearchCharts.tsx          # SVG line chart with hover tooltips
│   ├── ScreenshotGallery.tsx       # Website screenshot modal viewer
│   ├── ShareModal.tsx              # Scannable QR Code share panel
│   ├── SourceGraph.tsx             # Interactive Node-Link SVG relationship graph
│   └── Workspace.tsx               # Scratchpad with markdown editor and clipped nodes
├── lib/
│   ├── context-client.ts           # Context.dev search/brand/screenshot API client
│   └── supabase-client.ts          # Supabase storage layer with localStorage fallback
tests/
└── chart-extraction.test.ts        # Unit test suite verifying parsing & clustering logic
```

---

## ⚙️ The 10-Step Deep RAG Pipeline

The backend server-side research pipeline runs as an event-streaming API route:

1.  **Step 1: Receive Query**: Captures query and registers SSE stream client.
2.  **Step 2: Generate Search Plan**: Programmatically formulates 3 targeted query paths.
3.  **Step 3: Search Web**: Queries Context.dev API for searches + page markdowns.
4.  **Step 4: Scrape & Screenshot**: Fetches brand profiles (colors, logo URLs) and screenshots.
5.  **Step 5: Extract Stats**: Regex scans text to extract sentences containing numerical claims.
6.  **Step 6: Cross-Reference**: Groups similar claims together to verify consensus.
7.  **Step 7: Detect Conflicts**: Evaluates numeric variance and flags anomalies.
8.  **Step 8: Consensus Synthesis**: Formulates the primary answer and compiles chart trends.
9.  **Step 9: Confidence Rating**: Calculates confidence score based on source authorities.
10. **Step 10: Executive Report**: Compiles markdown briefings, recommended searches, and triggers results.

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
Ensure you have Node.js (version 20+ recommended) and npm/yarn installed.

### 2. Clone Repository
```bash
git clone https://github.com/routhujahnavi/nebula-research.git
cd nebula-research
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Context.dev API credentials:
```env
CONTEXT_DEV_API_KEY=ctxt_secret_8000271d49e744b9b4c577f18edaeebd
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Tests
Validate the series parser and validation filters:
```bash
npx tsx tests/chart-extraction.test.ts
```

### 7. Compile for Production
```bash
npm run build
npm run start
```
