# Web gift for Jasmine (Manchester) — you in Indonesia

The game is **already a website**. She does **not** install an app.  
She opens a **URL** in Safari / Chrome → **Continue as Jasmine** → **Dive Home Reef**.

## Preferred live URL (GitHub Pages)

After the Actions deploy succeeds (and Pages source = GitHub Actions):

```
https://cboon99.github.io/Rowblocks-Abyssal-Quest/
```

Auto-updates on every push to **`main`**.

## How “login” works

| What | Reality |
|------|---------|
| Login | **Continue as Jasmine** on the first screen |
| Password | None (gift profile) |
| Save | Progress saves in **her browser** on **her device** |
| Your save | Stays on **your** browser — separate. That’s fine for a gift. |

There is no cloud account server yet. Web-based = **hosted site + local browser save**.

---

## You must publish the site once (2 minutes)

I can’t publish from this machine without your Netlify/Vercel login.  
Do **one** of these:

### Option A — Netlify Drop (fastest, no Git)

1. On your Mac, open: **https://app.netlify.com/drop**  
2. Log in (Google/GitHub is fine).  
3. Drag this folder onto the page:  
   **`/Users/carlboon/Documents/Rowblocks-Abyssal-Quest/dist`**  
   (or the zip: `abyssal-quest-gift-web.zip` — unzip first, drop the **folder** contents if Drop wants a folder)  
4. Netlify gives a URL like:  
   `https://random-name-123.netlify.app`  
5. Optional: **Site settings → Domain** → rename to e.g. `jasmine-reef.netlify.app`

### Option B — Netlify from GitHub (best long-term)

1. https://app.netlify.com → **Add site** → **Import from Git**  
2. Repo: `CBoon99/Rowblocks-Abyssal-Quest`  
3. Branch: **`birthday-phase0-baseline`** (or `main` if you merge)  
4. Build command: `npm run build`  
5. Publish directory: `dist`  
6. Deploy  

`netlify.toml` is already correct.

### Option C — CLI (after you log in once)

```bash
cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest
npx netlify-cli login
npx netlify-cli deploy --prod --dir=dist
```

---

## Message to send Jasmine (copy/paste)

```
Happy Birthday Jasmine 🌊

Your Ocean Ranger game is here (open in Safari or Chrome):
https://YOUR-SITE.netlify.app

1. Tap “Continue as Jasmine”
2. Tap “Dive Home Reef”
3. Swim gentle, clean the glowing trash, meet the turtle

Tip: turn the iPad sideways (landscape).
If it’s slow: Settings in the game → Medium quality.

Love, Dad
```

Replace `YOUR-SITE` with the Netlify URL.

---

## After she plays

- Her progress stays on **her** phone/iPad/laptop.  
- Friends can use the **same link** — each gets their own “Jasmine” or “Create another diver” on their device.  
- **Not** online multiplayer (not two players in one world). Solo web game.

---

## Rebuild zip before Drop (if you changed code)

```bash
cd /Users/carlboon/Documents/Rowblocks-Abyssal-Quest
npm run build
cd dist && zip -r ../abyssal-quest-gift-web.zip .
```

Then drop **`dist`** (or unzipped site) on Netlify Drop.
