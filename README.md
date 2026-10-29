# MYOS — Personal Fitness Studio

A polished, responsive, **private** gym-and-nutrition web app designed for an existing Notion workspace. It uses **no frontend framework and no npm dependencies**: Node.js 20+ serves the app and speaks to Notion from the server only.

## What's included

- **Overview:** daily calorie/protein/carbs/fat targets, 3,000 ml water goal, +250/+500 ml actions, creatine and whey checkboxes, gym checklist, handwritten food diary, weekly gym schedule, upcoming meals.
- **Nutrition:** daily totals, food logging from the existing food library, planned meals linked to saved recipes, a water tracker, and supplement controls.
- **Exercises:** searchable, filterable **read-only** Notion exercise library. The original exercise database is never modified.
- **Body progress:** weigh-in tracking and historical trend charts.
- **Goals:** statuses from the user's existing Fitness Goals database.
- **Analytics:** calories, protein, water, weight, logging coverage. Missing days are *not* assumed to be failed days.
- **Settings:** Notion links, connection diagnostics, privacy explanation.

## 1. Preview locally (no Notion connection yet)

```bash
npm start
```

Open <http://localhost:3000>. You will see **clearly labeled sample data** stored in your browser's `localStorage`. The demo is fully interactive, but it does **not** read or write to Notion. No real exercise, weight, body measurements, or food logs are included in the GitHub files.

## 2. Connect your Notion database

1. Create your own Notion integration at <https://www.notion.so/profile/integrations>. Use an internal integration with read/update/insert capabilities as needed.
2. Connect **only** the relevant Gym databases to this integration in Notion's `…` menu → Connections. The app will not find databases that the integration hasn't been granted access to.
3. Copy `.env.example` to `.env` locally. On Render or another Node hosting provider, set these values as **secret environment variables** instead. Do **not** commit `.env`.
4. Fill in `NOTION_TOKEN`, `APP_PASSWORD`, and `SESSION_SECRET` (20+ random characters). In a public deployment, the server refuses to start if a Notion token is set without private dashboard authentication.
5. Fill the **data-source** IDs below (not the database page IDs). Notion API v2025-09-03 uses data sources for queries. To find one: `GET https://api.notion.com/v1/databases/{database_id}` and use `data_sources[0].id`, or search for its data source in the Notion integration.

| Environment variable | Your Notion database |
| --- | --- |
| `NOTION_DAILY_SOURCE` | Nutrition → Daily Nutrients |
| `NOTION_EXERCISES_SOURCE` | Exercise → Exercises |
| `NOTION_GOALS_SOURCE` | Goals → Fitness Goals |
| `NOTION_TARGETS_SOURCE` | Goals → Nutrition Goals / Nutrition Targets |
| `NOTION_BODY_SOURCE` | Weight Tracker → Weight Tracker (Body Log data source) |
| `NOTION_FOODS_SOURCE` | Nutrition → Food Database |
| `NOTION_MEALS_SOURCE` | Nutrition → Meal Database |
| `NOTION_PLANNER_SOURCE` | Nutrition → Meal Planner |
| `NOTION_SUPPLEMENTS_SOURCE` | Nutrition → Supplements |

The server uses the Notion API version `2025-09-03`, which is compatible with the data-source endpoints. If your integration is not authorized for a database, the dashboard will show an explicit error rather than inventing values.

### What the website writes to Notion

- **Daily Nutrients:** water, supplements, gym checkbox, food diary; logging food in the website also increments daily calories and macros using that food's per-gram values.
- **Meal Planner:** new planned meals and changes of Planned / Logged / Skipped status.
- **Fitness Goals:** status changes only.
- **Weight Tracker / Body Log:** new weigh-ins and optional waist measurement.

**Important:** The website's food-logging form writes to **Daily Nutrients**, *not* through the Notion Intake Database's existing **Add Food** button. The original button workflow remains unchanged. If you log the same food through both the site and the Notion button, you will double-count it. Choose one logging method per serving.

**Notion formula/rollup properties:** They are read-only, and the website does not try to write them. Food portions use per-gram values from `Food Database`. Verify nutritional data and portions before relying on them; nutrition information is an estimate.

## 3. Publish on GitHub

This project lives in the **private** GitHub repository [shehabb0/myos](https://github.com/shehabb0/myos). To work from a local clone:

```bash
git clone https://github.com/shehabb0/myos.git
cd myos
npm start
```

GitHub stores your code; **GitHub Pages alone cannot run the Node backend** needed for secure Notion access. For a fully connected website, deploy the GitHub repository to a Node-capable host such as [Render](https://render.com) (this project includes `render.yaml`) or another compatible service. Set your private environment variables in the host dashboard, then open the deployment URL. Never put tokens or passwords in `public/` or commit `.env`.

## 4. Design decisions

- All personal health data is fetched **at runtime** after authentication. No personal measurements are embedded in frontend files.
- The site matches the current **Gym → Exercise, Nutrition, Weight Tracker, Goals, Analytics** structure; it does not recreate deleted workout/session pages.
- The existing Exercises database is **read-only**.
- No third-party JS packages, external fonts or trackers. Static resources are served from the same origin.
- The server caches Notion reads briefly to reduce API requests and refreshes them after mutations.
- `APP_PASSWORD` provides **single-user access**, not multi-account authentication. Use a strong, unique password; treat the environment variables as secrets.

## Testing

```bash
npm test
```

Tests check safe conversion of Notion property values and date validation. For a full live smoke test, configure a private Notion integration in a development environment and try each write action on nonproduction data.

## Known limits

1. The existing Notion Intake buttons aren't programmatically modified. Instead, web food logs update Daily Nutrients directly. The web UI does not offer a "undo food" button because subtracting previously posted macros without a separate transaction log would be unsafe; make corrections in Notion's Daily Nutrients record.
2. `Foods Eaten` is plain text, so entries are descriptive rather than relational transaction records.
3. Notion updates to multiple properties are one page PATCH; simultaneous edits from multiple devices could race. For one personal user this is generally manageable, but a full transaction ledger is recommended for multi-user or high-concurrency use.
4. Analytics use only available saved data; weight measurements and daily totals use different data sources.
5. The exact live Notion integration remains unverified until the user supplies/configures a private token in the deployment environment. The project includes a functional local demonstration meanwhile.

---

Made to support consistency, not perfection. 🌱