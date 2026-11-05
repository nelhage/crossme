---
name: run-and-screenshot
description: Build and run crossme locally (Go server + vite dev server), seed it with puzzles, and drive it with Playwright to take screenshots, e.g. of the mobile layout. Use when asked to run the app, see a UI change working, or screenshot it.
---

# Running crossme and taking screenshots

The app is two processes: the Go server (RPCs under `/api/`, port 4000)
and the vite dev server for the React client (port 3000), which proxies
`/api` to the Go server. Browse to port 3000.

## 1. Build and start the servers

```sh
mkdir -p bin data
go build -o bin/ ./cmd/...          # builds bin/crossme and bin/crossme-build-db
(cd client && npm ci)               # once, if client/node_modules is missing
```

`bin/` and `data/` are gitignored. Use a scratch db path (anything outside
the repo, or under `data/`) so screenshots don't depend on stale state.

## 2. Seed the database with puzzles

`bin/crossme-build-db` is a CLI that creates/migrates a sqlite db and
inserts puzzle files into it (`.puz`, `.jpz`, `.xml` — anything
`formats.Parse` accepts). There are plenty of fixtures in the repo:

```sh
DB=data/screenshot.db
rm -f "$DB"
bin/crossme-build-db -db "$DB" puz/testdata/*.puz jpz/testdata/*.jpz
```

This is much simpler than uploading through the UI. (If you do upload via
Playwright, note that `text=Upload` matches the form label too; use
`getByRole('button', {name: 'Upload', exact: true})`.)

Then start both servers in the background, logging to files:

```sh
nohup bin/crossme -bind localhost:4000 -db "$DB" > server.log 2>&1 &
(cd client && nohup npx vite --port 3000 > ../vite.log 2>&1 &)
```

The Go server logs `listening on localhost:4000` when ready; vite prints
`ready in ...`. Kill them with `pkill -f 'bin/crossme -bind'` and
`pkill -f vite` when done. The server must be restarted to pick up Go
changes; vite hot-reloads client changes.

## 3. Drive the app with Playwright

Routes: `/puzzles` lists puzzles (click a title to go to
`/preview/:puzzleId`), and the preview's "Start Game" button creates a
game at `/game/:gameId`. No login is needed; everything works anonymously.

```js
// screenshot.cjs — node screenshot.cjs out.png
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  // A named device emulates a phone (viewport, touch, DPR). Below 768px
  // wide the app uses its mobile layout: pinned clue bar + on-screen
  // keyboard. Use a plain { viewport } context for desktop shots.
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/puzzles');
  await page.getByText('NY Times, Fri, Sep 12, 2008').first().click();
  await page.waitForURL(/preview/);
  await page.getByText('Start Game').click();
  await page.waitForSelector('#theclue');
  await page.screenshot({ path: process.argv[2] });
  await browser.close();
})();
```

Write scripts like this to a scratch directory, not the repo. In the
Claude Code cloud environment Playwright and Chromium are preinstalled
globally (run with `NODE_PATH=$(npm root -g)` if `require` can't find it);
don't `playwright install` another copy.

Useful tricks:

- On mobile, `#theclue .clue-nav.next` / `.prev` step through clues, and
  `#theclue .badge` / `#theclue .text` read the current clue, so you can
  walk every clue to find e.g. the longest one.
  (`nyt_weekday_with_notes.puz`'s 14-Across is a good long clue.)
- For a before/after comparison of a CSS change, take the "after" shot,
  then `page.addStyleTag({content: ...})` with the old rules (using
  `!important`) and take the "before" shot on the same page.
- Measure instead of eyeballing where possible, e.g.
  `el.evaluate(e => ({client: e.clientHeight, scroll: e.scrollHeight}))`.
- Look at the resulting PNG yourself (Read it) before reporting, and send
  it to the user if they asked for a screenshot.
