# Expat-O-Matic

Retro 90s globe that matches you to expat cities.

- `index.html` – the whole site (globe, form, matching, pixel mascots). No build step.
- `api/oracle.js` – Vercel serverless function for the Travel Oracle.

## Deploy
1. Upload this folder to a GitHub repo and import it at vercel.com/new (Framework preset: **Other**, no build command), or run `npx vercel` inside this folder.
2. In the Vercel project: Settings → Environment Variables → add `ANTHROPIC_API_KEY` (from console.anthropic.com), then redeploy.
   Optional: `ORACLE_MODEL` to change the model.

Without the key, everything works except the Oracle, which shows an "offline" message.
