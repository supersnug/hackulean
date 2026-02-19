# HacKulean

A browser-based "hack pretend" game (FIND / HACK / BREACH / DEFENSE) built with vanilla HTML/CSS/JS.

This workspace contains:

- `index.html` — game UI
- `style.css` — styles
- `script.js` — game logic

## Quick local test

From the project directory run one of:

Python 3 built-in server:

```bash
python3 -m http.server 8000
```

or using `serve` (npm):

```bash
npx serve .
```

Open http://localhost:8000 in your browser.

## Deploy options

1. GitHub Pages (simple):
   - Create a GitHub repo (for example `supersnug/hackulean`).
   - Commit and push the project files to the `main` branch.
   - In the repository Settings -> Pages, enable Pages from the `main` branch (root).
   - (Optional) Add a `CNAME` file containing `sarulean.com` if you want the repo to claim the custom domain.

2. Netlify / Vercel (recommended for custom domain & SSL):
   - Create a new site and connect your repo, or drag & drop the site folder.
   - No build command required — the publish directory is the project root.
   - Add `sarulean.com` as a custom domain in the provider dashboard and follow DNS instructions.

3. Squarespace embedding (easy if you keep Squarespace):
   - Host the static site on Netlify/GitHub Pages.
   - In Squarespace page editor add a Code Block and embed:

```html
<iframe
  src="https://your-deployed-site.example"
  style="width:100%;height:800px;border:0"
></iframe>
```

## Notes about the `sarulean.com` easter-egg

The game intentionally treats the string `sarulean.com` specially in `script.js` — attacking that target shows a fake "404 - Page not found" modal and then switches to an alternate server. This is an intentional in-game easter egg simulating "deleted domain" behavior.

If you prefer to remove or change this behavior before deploying to the real domain, edit `script.js` and search for the `sarulean.com` block (look for `if (ipLower === "sarulean.com") {`). You can either:

- Remove or comment out that `if` block to disable the fake-404 behavior; or
- Gate it behind a flag by adding at the top of `script.js`:

```javascript
// Toggle sarulean easter-egg behavior
gameState.saruleanEasterEgg = true; // set to false to disable
```

and change the condition to:

```javascript
if (ipLower === "sarulean.com" && gameState.saruleanEasterEgg) {
  ...
}
```

## Preparing the GitHub repo

You said you already created `supersnug/hackulean` — to push this project there:

```bash
cd /home/sarulean/projects/hackulean
git init
git add .
git commit -m "Initial HacKulean site"
git remote add origin git@github.com:supersnug/hackulean.git
git push -u origin main
```

If you prefer HTTPS remote, replace the remote URL accordingly.

## Post-deploy checks

- Verify logs display and that the DEV menu unlock flow works (probe `THE.GAME`, hack it to 0% integrity).
- If you use `sarulean.com` as the custom domain on the host, consider disabling the easter-egg or keep it if you want the fake-404 behaviour on the live domain.

If you want, I can:

- Create a small GitHub Actions workflow to auto-deploy to GitHub Pages on push.
- Add a `CNAME` file and/or `README` content tailored to Netlify config.
- Prepare a zip of the site for upload.

Tell me which of those you'd like next.
