// Travel Oracle: serverless function that writes a personal relocation reading.
// Needs the ANTHROPIC_API_KEY environment variable set in your Vercel project.

const MODEL = process.env.ORACLE_MODEL || "claude-sonnet-5-5";
const hits = new Map(); // crude per-instance rate limit: 6 readings / 10 min per IP

const clip = (v, n) => String(v ?? "").slice(0, n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "THE ORACLE IS OFFLINE. (Site owner: add ANTHROPIC_API_KEY in Vercel settings.)" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (recent.length >= 6) return res.status(429).json({ error: "LINE BUSY. The Oracle needs a breather. Try again in a few minutes." });
  recent.push(now); hits.set(ip, recent);

  const { profile = {}, top = "" } = req.body || {};
  const p = {};
  for (const k of ["age","gender","height","weight","income","persona","climate","reasons","seek","intent"]) p[k] = clip(profile[k], 200);

  const prompt = `You are the "Travel Oracle" on a playful 1999-style expat website. Write a personal relocation reading for this adult user in plain text (no markdown symbols), under 260 words, with a fun retro tone but genuinely useful advice.
Profile: age ${p.age}, gender ${p.gender}, height ${p.height}, weight ${p.weight} lb, income $${p.income}/month after tax, persona: ${p.persona}, climate: ${p.climate}, reasons: ${p.reasons || "none given"}, interested in: ${p.seek}, looking for: ${p.intent}.
Top matches from our scoring engine:
${clip(top, 3000)}
Structure: 1) YOUR #1 DESTINY: pick one city and say why in 2-3 sentences. 2) RUNNERS-UP: one line each for two others. 3) MONEY CHECK: is their budget comfortable? 4) LOVE LIFE FORECAST: realistic, respectful dating-scene advice for their stated preference, including any local legal or safety cautions (LGBTQ+ laws, scams). Never stereotype or objectify local people. 5) NEXT STEP: one concrete action, like checking a specific visa's current income requirement on the official consulate site. Do not invent exact visa income figures. Never mention AI, language models or any company behind you; you are simply the Travel Oracle.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: "user", content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) { console.error("Oracle upstream error", r.status, j?.error?.message); return res.status(502).json({ error: "CONNECTION LOST. The Oracle's line is down. Try again soon." }); }
    const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "CONNECTION LOST. Click the button to redial." });
  }
}
