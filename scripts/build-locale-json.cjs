"use strict";
const fs = require("fs");
const path = require("path");
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../public/locales/_en.json"), "utf8")
);
const rows = [].concat(
  require("./locale-rows-a.cjs"),
  require("./locale-rows-b.cjs"),
  require("./locale-rows-c.cjs")
);
const langs = ["fr", "ja", "zh", "hi", "ar", "bn"];
const outDir = path.join(__dirname, "../public/locales");
langs.forEach(function (L, idx) {
  var o = Object.assign({}, en);
  rows.forEach(function (row) {
    var key = row[0];
    var tr = row[idx + 1];
    if (tr != null && String(tr).length) o[key] = tr;
  });
  fs.writeFileSync(
    path.join(outDir, L + ".json"),
    JSON.stringify(o, null, 2) + "\n",
    "utf8"
  );
});
console.log("Wrote", langs.map((L) => L + ".json").join(", "));
