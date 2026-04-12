/**
 * Merges public/locales/*.json into public/locales-bundle.js for the WebView.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const locDir = path.join(root, "public", "locales");
const outPath = path.join(root, "public", "locales-bundle.js");
const langs = ["fr", "ja", "zh", "hi", "ar", "bn"];

const categoriesPath = path.join(locDir, "categories.json");
if (!fs.existsSync(categoriesPath)) {
  console.warn("build-locales: missing public/locales/categories.json — skipping");
  process.exit(0);
}
const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));

const i18n = {};
for (var i = 0; i < langs.length; i++) {
  var L = langs[i];
  var p = path.join(locDir, L + ".json");
  if (fs.existsSync(p)) {
    i18n[L] = JSON.parse(fs.readFileSync(p, "utf8"));
  }
}

const bundle = { categories: categories, i18n: i18n };
fs.writeFileSync(
  outPath,
  "window.__FLICK_LOCALES_BUNDLE=" + JSON.stringify(bundle) + ";\n",
  "utf8"
);
console.log("Wrote public/locales-bundle.js (" + langs.length + " UI langs)");
