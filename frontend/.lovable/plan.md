

# DriveScore AI - Implementation Plan

## Overview
A production-ready dashcam video analysis frontend with a bold, gradient-rich design featuring trust-inspiring blue accents. The app will be fully functional for demos with mock API responses.

---

## 1. Landing Page
**Route:** `/`

- **Hero Section** with gradient background (deep blue to purple)
- **App branding:** "DriveScore AI" with animated logo/icon (car + shield)
- **Tagline:** "Upload dashcam footage and receive a driving safety score with detailed feedback."
- **Large CTA button:** "Upload Video" with hover animation
- **Feature highlights:** 3 cards showing key capabilities (AI Analysis, Detailed Timeline, Instant Score)
- **Subtle animated background elements** (road lines, dashboard imagery)

---

## 2. Video Upload Page
**Route:** `/upload`

- **Drag-and-drop zone** with visual feedback on hover/active states
- **Supported formats:** MP4, MOV (displayed clearly)
- **File validation:**
  - Max size: 500MB (configurable)
  - File type checking with clear error messages
- **Upload progress indicator:** Animated progress bar with percentage
- **Cancel upload option**
- **Recent uploads section** (for demo purposes)
- **"Analyzing..." state** with AI-themed loading animation

---

## 3. Analysis Results Page
**Route:** `/results/:id`

- **Hero Score Display:**
  - Animated circular gauge (0-100) with gradient fill
  - Letter grade badge (A-F) with color coding
  - Overall assessment text ("Excellent Driver", "Needs Improvement", etc.)

- **Embedded Video Player:**
  - Custom controls with playback speed options
  - Event markers on timeline that jump to incidents

- **Event Timeline:**
  - Visual timeline below video showing detected events
  - Event types with icons and colors:
    - 🚗 Tailgating (orange)
    - 🛑 Harsh Braking (red)
    - ⚡ Hard Acceleration (yellow)
    - ↗️ Lane Departure (blue)
    - 🔄 Sharp Turns (purple)
  - Click events to jump to timestamp in video

- **Score Breakdown Cards:**
  - Category scores (Following Distance, Braking, Acceleration, Lane Discipline, Steering)
  - Point deductions with explanations
  - Improvement tips per category

- **Action buttons:** Download report, Analyze another video

---

## 4. Components Architecture

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   └── FeatureCards.tsx
│   ├── upload/
│   │   ├── VideoUploader.tsx
│   │   ├── DropZone.tsx
│   │   └── UploadProgress.tsx
│   ├── results/
│   │   ├── VideoPlayer.tsx
│   │   ├── EventTimeline.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── ScoreCard.tsx
│   │   └── ScoreBreakdown.tsx
│   └── ui/ (existing shadcn components)
├── services/
│   └── api.ts (API logic + mock responses)
├── hooks/
│   └── useAnalysis.ts
├── types/
│   └── analysis.ts
└── pages/
    ├── Index.tsx (Landing)
    ├── Upload.tsx
    └── Results.tsx
```

---

## 5. Mock API Data

Example response structure for `/api/analyze`:

```json
{
  "id": "analysis_123",
  "score": 78,
  "grade": "C+",
  "events": [
    { "type": "tailgating", "timestamp": 45, "severity": "moderate", "points": -5 },
    { "type": "harsh_braking", "timestamp": 120, "severity": "high", "points": -8 }
  ],
  "breakdown": {
    "following_distance": { "score": 70, "deductions": [...] },
    "braking": { "score": 65, "deductions": [...] }
  }
}
```

---

## 6. Design System

- **Primary gradient:** Blue (#3B82F6) → Purple (#8B5CF6)
- **Accent colors:** Emerald for success, Amber for warnings, Red for alerts
- **Dark mode ready:** Will work on both light and dark backgrounds
- **Typography:** Bold headings, clean body text
- **Animations:** Subtle micro-interactions, score counting animation

---

## 7. Responsive Design

- **Desktop:** Full layout with side-by-side video + timeline
- **Tablet:** Stacked layout with full-width components
- **Mobile:** Optimized touch targets, collapsible sections

---

## 8. Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly event descriptions

