/**
 * Smoke-test Gemini with the same key/models as the app. Does not print the API key.
 * Usage: node scripts/check-gemini.js
 */
require("dotenv").config();

const key = (
  process.env.GEMINI_API_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  ""
).trim();

const envCsv = (
  process.env.GEMINI_MODEL ||
  process.env.EXPO_PUBLIC_GEMINI_MODEL ||
  ""
).trim();

const defaultModels = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-3-flash-preview",
];

const models = envCsv
  ? envCsv.split(",").map((s) => s.trim()).filter(Boolean)
  : defaultModels;

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Reply with exactly one word: pong" }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 32 },
    }),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, status: res.status, err: raw.slice(0, 200) };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      err: data?.error?.message || raw.slice(0, 400),
    };
  }
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
  return { ok: true, model, text };
}

async function main() {
  if (!key) {
    console.error("No GEMINI_API_KEY in .env");
    process.exit(1);
  }
  console.log("Trying models:", models.join(", "));
  for (const m of models) {
    const r = await testModel(m);
    if (r.ok) {
      console.log("OK:", m, "→", JSON.stringify(r.text));
      process.exit(0);
    }
    console.log("×", m, "HTTP", r.status, "—", (r.err || "").replace(/\s+/g, " ").slice(0, 220));
  }
  console.error(
    "\nAll failed. If you see 429: wait and retry, or set GEMINI_MODEL to another model from Google AI Studio."
  );
  process.exit(1);
}

main();
