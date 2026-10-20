# Conference DDL Radar

[简体中文](README.md) | English

A login-free computer science conference deadline dashboard for computer vision and robotics researchers. Track abstract registration, paper submissions, and other important dates in one place.

The current dashboard interface is in Simplified Chinese.

**[Live demo →](https://conference-ddl-vision-robotics.sharpmaple1024.chatgpt.site/)**

![Conference DDL Radar desktop dashboard](docs/screenshots/desktop.png)

## Features

- **Conference catalog:** All 58 A-tier conferences in the official seventh edition of the CCF catalog (2026), plus two selected B-tier conferences: ECCV and ICRA.
- **Live countdowns:** Updated every second, with Beijing time and the original timezone available. Supports Anywhere on Earth (AoE) and timezones with daylight saving time.
- **Important dates:** Abstract registration, full papers, supplementary materials, author responses, notifications, and conference dates, when available. Conference editions and submission rounds remain separate.
- **Search and filters:** Search by conference name, keyword, location, or year; filter by research area, CCF tier, and submission status.
- **Local favorites:** No account required. Favorites stay in the current browser and are neither uploaded nor synchronized across devices.
- **Fast initial display:** Show a real data snapshot or a newer local cache immediately, then fetch updated aggregate records. Existing data remains available if a refresh fails.
- **Compact layout:** Top navigation and centered content, with four conference cards per row on wide screens and three, two, or one column at narrower widths.

## Run locally

Requires **Node.js 22.13 or later** and npm.

```bash
git clone https://github.com/HuNeedHelp/conference-ddl-radar.git
cd conference-ddl-radar
npm ci
npm run dev
```

Open the address printed in the terminal, usually `http://127.0.0.1:5173/`. Running locally does not require an API key, a database, or a GitHub login.

```bash
npm test           # Time conversion, submission status, and data matching tests
npm run typecheck  # TypeScript checks
npm run build      # Production build
```

On Windows, you can also start the app directly with `node scripts/run-framework.mjs dev`. Replace `dev` with `build` to build it.

## Implementation

| Component | Technology |
| --- | --- |
| UI and interactions | React, TypeScript, CSS Grid |
| Application build | Vinext, Vite |
| Production runtime | Cloudflare Workers, using the Sites template's build integration |
| Data parsing | js-yaml |
| Favorites and page cache | Browser localStorage |
| Testing | Node.js built-in test runner; browser verification with Playwright |

```text
app/page.tsx                  UI, filters, and favorites
app/api/conferences/route.ts   Read-only data endpoint
lib/data.ts                   Aggregate data fetching, caching, and fallback source
lib/conferences.ts            Conference matching, timezones, and submission rules
data/ccf-catalog.json         Official conference classification catalog
data/source-aliases.json      Mapping between official names and aggregate records
data/seed.json                Real data snapshot for the initial display
tests/conferences.test.mjs    Time and domain rule tests
```

See the [architecture notes (Chinese)](docs/architecture.md) and [catalog provenance](data/ccf-provenance.md) for more details.

## Data sources and updates

Conference classifications come from the [official CCF catalog](https://www.ccf.org.cn/Academic_Evaluation/By_category/). Deadline records come from the public [CCF-Deadlines](https://github.com/ccfddl/ccf-deadlines) aggregate dataset.

- Opening the page requests `/api/conferences`. The server may reuse records fetched within the past two minutes; a manual refresh fetches from the upstream source again. A fallback source is used if the primary source is unavailable.
- The last successful fetch time indicates when the aggregate source was read. **It does not mean that each date was verified against the conference website.** Changes on official websites may not yet appear in the aggregate data.
- Unannounced dates, dates without an explicit time, and dates with an unrecognized timezone do not produce precise countdowns. Historical dates are not used to predict the next edition's deadline.
- If abstract registration has closed but the paper deadline has not, the dashboard highlights the registration prerequisite. Notification dates and conference dates are not treated as submission opportunities.
- Matching uses both the conference name and its subject area to distinguish unrelated conferences with the same acronym, such as the two FSE conferences.
- CCF classifications are maintained against a specific catalog edition. Classifications from the aggregate source do not override the official catalog.

### Update the initial snapshot

Download `https://ccfddl.com/conference/allconf.yml` to `work/allconf.yml` (the directory is ignored by Git), then run:

```bash
npm run snapshot
```

Normal online data refreshes do not require a rebuild. This command only updates the initial snapshot bundled with the application.

## Deployment

The app retains the Sites template's `sites()` build integration and produces a Cloudflare Workers build. `.openai/hosting.json` contains only default settings without a personal Site binding. Configure your own Site identity when deploying to your environment.

**This public GitHub repository distributes the source code. The live demo is hosted through Sites; pushing to this repository does not automatically update the demo.** Standard GitHub Pages hosting cannot run the current server-side data endpoint.

## Third-party notices

- The original CCF-Deadlines license notice is included in [third-party-notices.txt](public/third-party-notices.txt).
- The Sites build plugin license is included in [sites-vite-plugin.LICENSE](build/sites-vite-plugin.LICENSE).
- Other third-party notices from the template remain in their corresponding directories, including `vendor/`.
- The official CCF PDF is not redistributed with this repository. It is available through the official source links.
