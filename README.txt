# Daylight Couple Planner — V2

## Included
- `index.html` — app structure
- `styles.css` — responsive pastel UI
- `app.js` — login, planner, task lists, calendar, availability and JSON backup
- `data.json` — empty starter JSON data
- `README.txt` — this guide

## Demo login accounts
- Harshal: phone `8879720125`, password `harshal`
- Gauri: phone `+918591541286`, password `gauri`

## Run it
1. Extract the ZIP folder.
2. Open `index.html` in Chrome or another modern browser.
3. Sign in with either account.
4. Add personal plans/tasks or choose Together for shared items.

No server or database is required for this local demo.

## How data is stored
For browser security reasons, a webpage opened from a folder cannot directly rewrite `data.json`.
This app stores live changes in that browser's `localStorage`. Use the ⇩ button to download a JSON backup. Use ⇧ to import a backup on another browser/device.

## Important limitations
- This is local-only. It does NOT sync live between two phones.
- If Harshal adds an event on his phone, Gauri will not automatically see it on her phone.
- To share updates automatically between two separate phones, a small backend/cloud database is required (for example Supabase or Firebase).
- The login is a static demo gate. The credentials are included in `app.js`, so anyone with access to the files can inspect them. Do not reuse these passwords anywhere important. This is not secure authentication and should not be used for sensitive information.
- Browser data can be lost if site data is cleared. Export JSON backups regularly.

## Change login details
Edit the `ACCOUNTS` array at the top of `app.js`. Remember: this is only a demo, not secure account authentication.
