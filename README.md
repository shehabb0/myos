# MYOS — Personal Fitness Studio

Your personal fitness and nutrition dashboard, built from your **existing Notion Gym workspace** and hosted on **GitHub Pages**, just like Lexicon. Responsive HTML/CSS/JavaScript. No Render, backend server, npm dependencies, or build step is required for the GitHub Pages edition.

## Publish MYOS with GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Select **`main`** and **`/(root)`**, then **Save**.
4. Open **https://shehabb0.github.io/myos/** after GitHub finishes publishing.

**GitHub Pages availability:** a GitHub Free personal account can publish Pages from **public repositories**. GitHub Pro supports Pages for private repositories. The Pages site itself is generally public (private site access control is a GitHub Enterprise feature). If GitHub asks you to make this repository public, be aware that the **source code** will be visible; no personal Notion data or tokens are committed here.

## Connect MYOS to Notion

1. In [Notion integrations](https://www.notion.so/profile/integrations), create an internal **MYOS** integration, with access only to the Gym databases you want MYOS to read or update.
2. In Notion, grant the integration access to **Daily Nutrients, Exercises, Food Database, Meal Database, Meal Planner, Nutrition Goals, Fitness Goals, Weight Tracker, Supplements**; or grant access to their containing Gym page if that is how your Notion integration is set up. Grant only necessary permissions. The **Exercises** database is used *read-only* by MYOS.
3. Visit MYOS → **Settings → Connect Notion**.
4. Paste the integration token **only into the website's connection dialog**, not into GitHub files, Pages settings, repository issues, or chats. MYOS discovers shared Notion data sources by their names. Advanced settings allow you to override an ID if your workspace has duplicate database names.
5. Click **Connect & sync**. The dashboard will show real Notion data only after connection succeeds.

Browser token security: This reproduces Lexicon's browser-to-Notion approach. The token is held in `sessionStorage` for the current tab/session by default, or optionally in `localStorage` if **Remember token on this device** is selected. Never enable "remember" on a shared device. Scripts running on a site can access a browser-held token; direct-browser integration is therefore less secure than a backend, even though the token is not in your GitHub repo. Connect the token to your *Gym pages only* to limit impact. GitHub Pages does **not** require server environment variables.

## Data behavior

- **Overview:** calories and macro targets, +250/+500 ml water actions, creatine/whey checkboxes, gym checklist, weekly schedule, and food diary.
- **Nutrition:** directly writes food portions to the **Daily Nutrients** totals and **Foods Eaten** field, reads the existing food library, and manages scheduled meals in Meal Planner.
- **Exercises:** searchable library fetched from Notion. The original Exercises database is **never edited**.
- **Body progress:** reads weight history, allows new weigh-ins.
- **Goals:** shows Fitness Goals and updates status.
- **Analytics:** plots weight, calories, protein and water.

**Avoid double logging:** The website's food logger writes directly to Daily Nutrients and does *not* trigger the Intake Database's Notion buttons. Logging the same serving through both doubles its calories and macros. Treat missing days as unrecorded, not failed.

The website initially shows **fictional demo data**. Connected Notion data is never bundled with these files or stored in browser demo history. If Notion cannot be reached, the app shows a sync error rather than faking a successful connection.

## Files

- `index.html`: GitHub Pages entry point
- `public/styles.css`: website styling
- `public/app.js`: interface and actions
- `public/notion-browser.js`: Notion data-source discovery, reading, updates
- `public/favicon.svg`: icon
- `tests/static-bridge.test.cjs`: local tests for browser-based Notion connection logic.

## Local preview

Run `python -m http.server 8080` from the repo root, then visit http://localhost:8080/. Or open `index.html` directly for the offline demo (Notion connectivity requires HTTPS or a compatible local context).

No changes have been made to any Notion database schema or to Lexicon.