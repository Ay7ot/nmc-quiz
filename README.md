# NMC CBT Practice Quiz

Offline-first PWA for NMC CBT multiple-choice practice. All questions and progress stay on your device.

**Live app:** [https://nmc-quiz.netlify.app](https://nmc-quiz.netlify.app)

## Quick start

```bash
cd nmc-quiz
npm install          # also runs icon generation via prebuild hook
npm run dev
```

## PWA — install on phone

1. Run `npm run build && npm run preview` (or deploy the `dist/` folder)
2. Open in Chrome/Safari on your phone
3. **Chrome:** Menu → "Install app" / "Add to Home screen"
4. **Safari:** Share → "Add to Home Screen"

The app works fully offline after the first load — questions, progress, and settings are all local.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with PWA enabled |
| `npm run generate:icons` | Build PNG icons from `scripts/icon-source.svg` |
| `npm run build` | Generate icons + production build |
| `npm run preview` | Preview production PWA locally |

## Design system

Based on **Material Design 3** token architecture (ref → sys → component):

- `src/design-system/tokens.css` — colors, typography, spacing (4dp grid), shape, elevation, motion
- M3 typography roles: display, headline, title, body, label
- Mobile-first, 480px max content width, 48px touch targets

## Icons

- **UI icons:** [Lucide React](https://lucide.dev) — bundled locally via `lucide-react` (1000+ icons)
- **App icons:** Generated from `scripts/icon-source.svg` using Sharp

To regenerate app icons after editing the SVG:

```bash
npm run generate:icons
```

## localStorage keys

| Key | Stores |
|-----|--------|
| `nmc-quiz-settings` | Session preferences |
| `nmc-quiz-progress` | Per-question answers & attempts |
| `nmc-quiz-sessions` | Last 100 session scores (with duration & %) |
| `nmc-quiz-stats` | High scores, streaks, totals, best-by-size |
| `nmc-quiz-active-session` | In-progress session |
| `nmc-pwa-install-dismissed` | Install banner dismissed |

## Progress & scores

Use the **Progress** tab:

- Personal best & best per session size (10/20/30/50/100 Qs)
- Score chart (last 12 sessions)
- Improvement trend (avg last 5 vs previous 5)
- Weekly stats, study time, best streak
- Full test history with dates and times

After each session: vs last score, new high score banner, link to full stats.

## Re-parse PDF

```bash
pip install pymupdf
python scripts/parse_pdf.py
```

Answers extracted from yellow highlights — no API key needed.

## Deploy (Netlify)

1. Connect the GitHub repo to [Netlify](https://www.netlify.com/)
2. Site URL: `https://nmc-quiz.netlify.app`
3. Build settings are in `netlify.toml` (`npm run build`, publish `dist/`)
4. SPA routing and PWA cache headers are configured automatically
