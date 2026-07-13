# Space Tribes: Parasite — Setup (about 5 minutes)

The whole game is one file: `index.html`. It needs two things: a free Firebase database (so all four phones share the same game) and a place to host the file (GitHub Pages, free).

## Step 1 — Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with any Google account.
2. Click **Add project** → name it `space-tribes` → you can turn OFF Google Analytics → **Create project**.

## Step 2 — Add the Realtime Database

1. In the left sidebar: **Build → Realtime Database → Create Database**.
2. Pick the default location → choose **Start in test mode** → **Enable**.

> Test mode rules expire after 30 days. When they do, go to the **Rules** tab and set:
> ```json
> { "rules": { "games": { ".read": true, ".write": true } } }
> ```
> This is fine for a private game between four friends — just don't share the URL around.

## Step 3 — Get your config

1. Click the ⚙️ gear (top left) → **Project settings**.
2. Scroll to **Your apps** → click the **`</>`** (Web) icon → nickname it anything → **Register app**.
3. Firebase shows you a `firebaseConfig = { ... }` block. Copy it.

## Step 4 — Paste it into the game

Open `index.html` in any text editor. Near the top of the `<script>` section you'll see:

```js
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  ...
};
```

Replace the whole block with the one you copied. Save.

**Important:** make sure your config includes a `databaseURL` line. If it doesn't, copy the URL shown at the top of your Realtime Database page (looks like `https://space-tribes-default-rtdb.firebaseio.com`) and add it:

```js
databaseURL: "https://space-tribes-default-rtdb.firebaseio.com",
```

If the crew already played the older token version, tap **Start new game** once — schema v2 (Energy + face forging) cannot load the old save.
## Step 5 — Host it (GitHub Pages)

1. Push this folder to GitHub (it's already a repo folder).
2. On github.com: repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → **Save**.
3. In a minute your game is live at `https://YOURNAME.github.io/spacetribes-parasite/`.

Text that link to Brian, Joel, and Chris. Each guy opens it on his phone, taps his character once, and his phone remembers him. Add it to the home screen (Share → Add to Home Screen) and it feels like an app.

## Playing

- Everyone submits their moves whenever they get a chance — the round resolves automatically the instant the 4th person submits, and the dice battle plays out on everyone's screen next time they open it.
- Scores are open on the standings board — use that to decide who you can’t afford to feed as parasite, and when to bank Energy for rerolls.
- The **Reset & start a new game** button at the bottom wipes the game for everyone — use with care (it does ask first).

## Troubleshooting

- **Stuck on "Contacting the ship…"** — the `databaseURL` is missing or wrong, or the database rules block access. Check Steps 2–4.
- **Setup screen keeps showing** — the config block still contains the word `PASTE` somewhere.
- **Someone picked the wrong character** — tap your name chip (top left) to switch.
