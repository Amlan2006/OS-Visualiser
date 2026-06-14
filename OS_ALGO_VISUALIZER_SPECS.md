# OS Algorithm Visualizer — Project Specification

**Version:** 1.0  
**Author:** Amlan Roy  
**Type:** Single-Page Educational Web Application

---

## 1. Product Overview

A fully interactive, browser-based visualizer for core Operating System algorithms across three domains:

- **CPU Scheduling** — FCFS, SJF (preemptive & non-preemptive), Round Robin, Priority (preemptive & non-preemptive), HRRN, MLFQ
- **Disk Scheduling** — FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
- **Page Replacement** — FIFO, LRU, OPT (Optimal), LFU, MFU, Clock (Second Chance)

Users may enter their own input data or load curated defaults per algorithm. Every algorithm run produces an animated step-by-step visualization alongside computed metrics.

---

## 2. Target Audience

- CS/CE undergraduate students studying OS
- Self-taught developers preparing for interviews
- Educators who need a live classroom demo tool

---

## 3. Tech Stack

### Frontend (Primary — everything runs client-side)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **React 18 + TypeScript** | Component isolation per algorithm; strong typing for complex state machines |
| Build Tool | **Vite** | Near-instant HMR, minimal config, ES module first |
| Styling | **Tailwind CSS v3** | Utility-first; rapid layout without CSS bloat |
| Animation | **Framer Motion** | Declarative step-by-step animations; layout animation for Gantt bars |
| Charts / Gantt | **D3.js v7** | Custom Gantt chart rendering for CPU scheduling timelines |
| State Management | **Zustand** | Lightweight; each algorithm module owns its own slice |
| Routing | **React Router v6** | `/cpu`, `/disk`, `/page` routes with deep-link support |
| Icons | **Lucide React** | Consistent, tree-shakable icon set |
| Math | **Pure TypeScript** | All algorithm logic hand-rolled; no black-box libs |

### No Backend Required
All computation is client-side. The site is a **static build** deployable to:
- Vercel / Netlify (recommended)
- GitHub Pages
- Any CDN

### Optional Future Extension
- Supabase for saving/sharing custom problem sets via shareable link

---

## 4. Information Architecture

```
/                          → Landing / Feature overview
/cpu                       → CPU Scheduling Module
  ?algo=fcfs               → Deep link to specific algo
/disk                      → Disk Scheduling Module
  ?algo=sstf
/page                      → Page Replacement Module
  ?algo=lru
/about                     → Algorithm reference glossary
```

---

## 5. Visual Design System

### Palette

```
--bg-base:       #0D0F14   (near-black, deep space)
--bg-surface:    #13161E   (card backgrounds)
--bg-elevated:   #1C2030   (modals, dropdowns)
--accent-cpu:    #4FFFB0   (phosphor green — CPU)
--accent-disk:   #FF6B6B   (coral red — disk arm)
--accent-page:   #7B9EFF   (electric blue — page frames)
--accent-warn:   #FFD166   (amber — page fault / miss)
--text-primary:  #E8EAF0
--text-muted:    #6B7280
--border:        #252A38
```

### Typography

- **Display / Headers:** `Space Grono` (Google Fonts) — techno-geometric, feels native to systems programming
- **Body / Labels:** `Inter` — neutral, highly legible at small sizes
- **Monospace (addresses, queues, registers):** `JetBrains Mono` — instantly signals "machine data"

### Signature Element

An **animated register tape** in the hero — a scrolling horizontal strip of hex-style process IDs / page addresses that flows behind the headline, referencing the raw binary nature of OS internals. Subtle, ambient, stops on `prefers-reduced-motion`.

---

## 6. Module Specifications

### 6.1 CPU Scheduling Module (`/cpu`)

#### Algorithms

| ID | Name | Preemptive? |
|---|---|---|
| `fcfs` | First Come First Served | No |
| `sjf-np` | Shortest Job First (Non-Preemptive) | No |
| `sjf-p` | Shortest Job First — SRTF (Preemptive) | Yes |
| `rr` | Round Robin | Yes |
| `priority-np` | Priority Scheduling (Non-Preemptive) | No |
| `priority-p` | Priority Scheduling (Preemptive) | Yes |
| `hrrn` | Highest Response Ratio Next | No |
| `mlfq` | Multi-Level Feedback Queue | Yes |

#### Input Fields (per process)

```
Process ID     : string (auto-generated or custom)
Arrival Time   : integer ≥ 0
Burst Time     : integer ≥ 1
Priority       : integer (used only if priority algo selected)
```

Additional inputs:
- **Time Quantum** (Round Robin, MLFQ)
- **Number of Queues + Quantum per queue** (MLFQ)

#### Default Dataset

```
P1: AT=0, BT=8, Priority=3
P2: AT=1, BT=4, Priority=1
P3: AT=2, BT=9, Priority=4
P4: AT=3, BT=5, Priority=2
```

#### Visualization Components

1. **Gantt Chart** (D3 timeline)
   - Horizontal time axis
   - Each process a distinct color band
   - Animated bar-by-bar reveal with step controls
   - Context idle periods labeled `IDLE`
   - Tooltip on hover: process ID, start time, end time, duration

2. **Process Queue Panel**
   - Live ready queue displayed as a horizontal pill list
   - Updates every step of simulation
   - Color-coded by process

3. **Metrics Table**
   - Per-process: Completion Time, Turnaround Time, Waiting Time, Response Time
   - Aggregate: Avg TAT, Avg WT, Avg RT, CPU Utilization %, Throughput

4. **Step Controls**
   - `⏮ Reset` `⏪ Prev` `⏩ Next` `▶ Auto-Play` `⏸ Pause`
   - Speed slider (0.5× – 4×)

---

### 6.2 Disk Scheduling Module (`/disk`)

#### Algorithms

| ID | Name |
|---|---|
| `fcfs` | First Come First Served |
| `sstf` | Shortest Seek Time First |
| `scan` | SCAN (Elevator) |
| `c-scan` | Circular SCAN |
| `look` | LOOK |
| `c-look` | C-LOOK |

#### Input Fields

```
Disk Size (cylinders)   : integer (default: 200)
Initial Head Position   : integer 0 – (disk_size - 1)
Head Direction          : [ LEFT | RIGHT ] (for SCAN/LOOK variants)
Request Queue           : comma-separated integers
```

#### Default Dataset

```
Disk Size: 200
Head: 53
Direction: RIGHT
Requests: 98, 183, 37, 122, 14, 124, 65, 67
```

#### Visualization Components

1. **Seek Path Plot** (D3 SVG)
   - X-axis: time / request order
   - Y-axis: cylinder number (0 → disk_size)
   - Animated line traces head movement request by request
   - Each seek segment labeled with distance
   - Head position marker (pulsing dot)

2. **Request Queue Panel**
   - Pending requests listed; served ones strike-through animated away

3. **Metrics**
   - Total Seek Distance
   - Average Seek Distance per request
   - Sequence of serviced cylinders

4. **Comparison Mode**
   - Side-by-side dual plots (any two algorithms on same dataset)
   - Total seek distance diff highlighted

---

### 6.3 Page Replacement Module (`/page`)

#### Algorithms

| ID | Name |
|---|---|
| `fifo` | First In First Out |
| `lru` | Least Recently Used |
| `opt` | Optimal (OPT) |
| `lfu` | Least Frequently Used |
| `mfu` | Most Frequently Used |
| `clock` | Clock / Second Chance |

#### Input Fields

```
Number of Frames   : integer 1–8
Reference String   : space or comma-separated page numbers
```

#### Default Dataset

```
Frames: 3
Reference String: 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1
```

#### Visualization Components

1. **Frame Table (step-by-step)**
   - Grid: rows = frames, columns = each reference in string
   - Each cell filled with the page in that frame at that time step
   - Page faults highlighted in amber (`--accent-warn`)
   - Page hits highlighted in green with subtle pulse
   - Evicted page crosses out with animation

2. **Reference String Banner**
   - Horizontal scrollable strip showing full reference string
   - Current position marker advances each step

3. **Clock Pointer** (Clock algorithm only)
   - Circular dial showing frame slots with reference bits
   - Pointer sweeps animated

4. **Metrics Bar**
   - Total Page Faults
   - Total Page Hits
   - Hit Ratio (%)
   - Miss Ratio (%)

5. **Algorithm Comparison Table**
   - Run all 6 algorithms on the same input simultaneously
   - Ranked table: algorithm, faults, hits, hit ratio
   - Belady's Anomaly detection flag (auto-detects and badges FIFO if anomaly present)

---

## 7. Shared UI Components

### Input Panel

```
┌─────────────────────────────────────────┐
│ [Algorithm Selector Tabs]               │
│─────────────────────────────────────────│
│ ○ Use Default Data   ● Custom Input     │
│                                         │
│ [Dynamic form fields per algorithm]     │
│                                         │
│ [+ Add Row]    [Reset]    [▶ Run]       │
└─────────────────────────────────────────┘
```

- Input validation with inline errors (red border + message)
- Accessible `<label>` bindings, keyboard navigable
- Import via CSV (drag-and-drop zone)
- Export results as PNG (canvas snapshot) or CSV

### Algorithm Selector

- Tab bar at top of each module
- Active tab glows with domain accent color (green/red/blue)
- Badge on tab if non-default parameters are set

### Sidebar Info Panel

- Collapsible right drawer
- Per-algorithm: time complexity, space complexity, description paragraph, pros/cons
- Pseudocode block in `JetBrains Mono`

---

## 8. User Flows

### Flow A — Quick Demo (Default Data)

```
1. Land on homepage
2. Click "CPU Scheduling"
3. Default data pre-loaded; algorithm = FCFS
4. Click ▶ Run
5. Gantt chart animates; metrics populate
6. Switch algorithm tab → Round Robin → update Time Quantum → ▶ Run
```

### Flow B — Custom Problem

```
1. Navigate to /page
2. Toggle "Custom Input"
3. Enter frames = 4, reference string = "1 2 3 4 1 2 5 1 2 3 4 5"
4. Click ▶ Run
5. Step through with Next/Prev
6. Enable Compare All → view fault ranking table
7. Export PNG of frame table
```

### Flow C — Classroom Demo

```
1. Navigate to /disk?algo=scan&demo=true (URL params restore state)
2. Project on screen
3. Use keyboard shortcuts (→ next step, ← prev, Space = play/pause)
4. Switch to C-SCAN for comparison
```

---

## 9. Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `→` / `L` | Next Step |
| `←` / `H` | Previous Step |
| `R` | Reset |
| `1–9` | Set playback speed |
| `?` | Toggle help overlay |

---

## 10. Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 640px` (mobile) | Single column; visualizer full-width; input panel collapses to drawer |
| `640–1024px` (tablet) | Input panel above visualizer |
| `> 1024px` (desktop) | Input panel left column (320px), visualizer right (flex-grow) |

---

## 11. Accessibility

- WCAG 2.1 AA contrast ratios enforced
- All interactive elements keyboard reachable
- `aria-live` regions for step updates (screen reader announces "Step 3: P2 runs from t=4 to t=8")
- `prefers-reduced-motion`: animations replaced with instant transitions
- `prefers-color-scheme: light`: alternate light palette available

---

## 12. Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.2s |
| Time to Interactive | < 2.0s |
| Lighthouse Performance | ≥ 90 |
| Bundle size (gzipped) | < 200 KB (excluding D3) |

Strategy: D3 and Framer Motion lazy-loaded per module route.

---

## 13. Project Structure

```
os-visualizer/
├── public/
│   └── favicon.svg
├── src/
│   ├── algorithms/
│   │   ├── cpu/
│   │   │   ├── fcfs.ts
│   │   │   ├── sjf.ts
│   │   │   ├── round-robin.ts
│   │   │   ├── priority.ts
│   │   │   ├── hrrn.ts
│   │   │   └── mlfq.ts
│   │   ├── disk/
│   │   │   ├── fcfs.ts
│   │   │   ├── sstf.ts
│   │   │   ├── scan.ts
│   │   │   ├── c-scan.ts
│   │   │   ├── look.ts
│   │   │   └── c-look.ts
│   │   └── page/
│   │       ├── fifo.ts
│   │       ├── lru.ts
│   │       ├── optimal.ts
│   │       ├── lfu.ts
│   │       ├── mfu.ts
│   │       └── clock.ts
│   ├── components/
│   │   ├── cpu/
│   │   │   ├── GanttChart.tsx
│   │   │   ├── ProcessInputTable.tsx
│   │   │   ├── ReadyQueue.tsx
│   │   │   └── MetricsTable.tsx
│   │   ├── disk/
│   │   │   ├── SeekPlot.tsx
│   │   │   ├── DiskInputForm.tsx
│   │   │   └── SeekMetrics.tsx
│   │   ├── page/
│   │   │   ├── FrameTable.tsx
│   │   │   ├── ReferenceStringBanner.tsx
│   │   │   ├── ClockDial.tsx
│   │   │   └── PageMetrics.tsx
│   │   └── shared/
│   │       ├── AlgoTabs.tsx
│   │       ├── StepControls.tsx
│   │       ├── InfoDrawer.tsx
│   │       ├── DataToggle.tsx      (Default / Custom switch)
│   │       ├── ExportButton.tsx
│   │       └── Layout.tsx
│   ├── store/
│   │   ├── cpuStore.ts
│   │   ├── diskStore.ts
│   │   └── pageStore.ts
│   ├── data/
│   │   └── defaults.ts             (all default datasets)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CPU.tsx
│   │   ├── Disk.tsx
│   │   └── Page.tsx
│   ├── types/
│   │   ├── cpu.types.ts
│   │   ├── disk.types.ts
│   │   └── page.types.ts
│   ├── hooks/
│   │   ├── useSimulation.ts        (generic step engine)
│   │   └── useExport.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   └── csv.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. Algorithm Output Types (TypeScript interfaces)

### CPU

```typescript
interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
}

interface CPUStep {
  time: number;
  running: string | null;      // process ID or null (idle)
  readyQueue: string[];
  completedAt?: { [pid: string]: number };
}

interface CPUResult {
  steps: CPUStep[];
  metrics: {
    [pid: string]: {
      completionTime: number;
      turnaroundTime: number;
      waitingTime: number;
      responseTime: number;
    };
  };
  avgTAT: number;
  avgWT: number;
  avgRT: number;
  cpuUtilization: number;
  throughput: number;
}
```

### Disk

```typescript
interface DiskInput {
  diskSize: number;
  headStart: number;
  direction: 'LEFT' | 'RIGHT';
  requests: number[];
}

interface DiskStep {
  from: number;
  to: number;
  seekDistance: number;
  remaining: number[];
}

interface DiskResult {
  sequence: number[];
  steps: DiskStep[];
  totalSeekDistance: number;
  avgSeekDistance: number;
}
```

### Page Replacement

```typescript
interface PageInput {
  frames: number;
  referenceString: number[];
}

interface PageStep {
  page: number;
  frameState: (number | null)[];
  fault: boolean;
  evicted: number | null;
  refBits?: boolean[];            // for Clock algo
  frequencies?: { [page: number]: number };  // for LFU/MFU
}

interface PageResult {
  steps: PageStep[];
  totalFaults: number;
  totalHits: number;
  hitRatio: number;
  beladysAnomalyDetected?: boolean;
}
```

---

## 15. Deployment

```bash
# Install
npm install

# Dev
npm run dev          # Vite dev server at localhost:5173

# Build
npm run build        # Output: dist/

# Preview
npm run preview

# Deploy (Vercel)
vercel --prod
```

`.env` — none required (fully static).

---

## 16. Phase Plan

| Phase | Scope | Est. Effort |
|---|---|---|
| P0 — Scaffold | Vite + React + Router + Tailwind + Zustand + design tokens | 1 day |
| P1 — CPU Module | All 8 algo engines + Gantt chart + metrics | 4 days |
| P2 — Disk Module | All 6 algo engines + seek plot + comparison mode | 3 days |
| P3 — Page Module | All 6 algo engines + frame table + clock dial + compare | 3 days |
| P4 — Polish | Animations, export, keyboard shortcuts, accessibility, mobile | 2 days |
| P5 — Deploy | Vercel deploy, URL deep-link, perf audit | 1 day |

**Total estimated: ~14 dev days**

---

## 17. Out of Scope (v1)

- User accounts / saved sessions (Supabase extension — v2)
- Backend API
- Multi-user collaboration
- Mobile native app
- Server-side rendering (CSR is sufficient; SEO not a priority)

---

## 18. References

- Silberschatz, Galvin, Gagne — *Operating System Concepts* (10th Ed.)
- Tanenbaum — *Modern Operating Systems* (4th Ed.)
- OSTEP — *Operating Systems: Three Easy Pieces* (free online)
