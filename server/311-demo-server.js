/**
 * Fake Philly 311 demo API + dashboard.
 * Run: npm run 311-demo
 * Listens on 0.0.0.0 so phones on the same LAN can reach your machine’s IPv4.
 */
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { URL } = require("url");

const CORS_METHODS = "GET, POST, PATCH, DELETE, OPTIONS";

function listLanIPv4s() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (v4 && !net.internal) {
        out.push(net.address);
      }
    }
  }
  return out;
}

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DB_FILE = path.join(ROOT, ".311-demo-db.json");
const PORT = Number(process.env.PORT || 3110);

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const j = JSON.parse(raw);
    if (!Array.isArray(j.requests)) j.requests = [];
    return j;
  } catch {
    return { requests: [] };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function sendText(res, status, text, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": CORS_METHODS,
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  let url;
  try {
    url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  } catch {
    return sendJson(res, 400, { error: "Bad URL" });
  }

  const pathname = url.pathname.replace(/\/$/, "") || "/";

  try {
    if (pathname === "/api/requests" && req.method === "GET") {
      const db = readDb();
      return sendJson(res, 200, { requests: db.requests });
    }

    if (pathname === "/api/requests" && req.method === "POST") {
      const body = await readBody(req);
      if (!body || typeof body.id !== "string" || !body.id.trim()) {
        return sendJson(res, 400, { error: "Missing id" });
      }
      const db = readDb();
      const id = body.id.trim();
      const idx = db.requests.findIndex((r) => r.id === id);
      const fieldsIn =
        body.fields && typeof body.fields === "object" && !Array.isArray(body.fields)
          ? body.fields
          : {};
      const imagesIn = Array.isArray(body.images)
        ? body.images.filter((u) => typeof u === "string" && u.startsWith("data:"))
        : [];
      const voiceIn =
        typeof body.voiceNote === "string" && body.voiceNote.startsWith("data:")
          ? body.voiceNote
          : null;
      const row = {
        id,
        receivedAt: Date.now(),
        dashboardStatus: "pending",
        category: String(body.category || "other").slice(0, 200),
        description: String(body.description || "").slice(0, 8000),
        location: String(body.location || "").slice(0, 1000),
        timestamp:
          typeof body.timestamp === "number" ? body.timestamp : Date.now(),
        lat: typeof body.lat === "number" ? body.lat : null,
        lng: typeof body.lng === "number" ? body.lng : null,
        fields: fieldsIn,
        images: imagesIn,
        voiceNote: voiceIn,
        primaryPhotoIndex:
          typeof body.primaryPhotoIndex === "number" ? body.primaryPhotoIndex : null,
        worthSubmitting:
          typeof body.worthSubmitting === "boolean" ? body.worthSubmitting : null,
        submissionAdvice: String(body.submissionAdvice || "").slice(0, 4000),
        manualEntry: body.manualEntry === true,
        appStatus: String(body.appStatus || "").slice(0, 32),
      };
      if (idx >= 0) {
        row.receivedAt = db.requests[idx].receivedAt;
        row.dashboardStatus = db.requests[idx].dashboardStatus || "pending";
        db.requests[idx] = row;
      } else {
        db.requests.unshift(row);
      }
      writeDb(db);
      return sendJson(res, 200, { ok: true, request: row });
    }

    if (pathname === "/api/requests" && req.method === "DELETE") {
      writeDb({ requests: [] });
      return sendJson(res, 200, { ok: true });
    }

    const idMatch = pathname.match(/^\/api\/requests\/([^/]+)$/);
    if (idMatch && req.method === "DELETE") {
      const id = decodeURIComponent(idMatch[1]);
      const db = readDb();
      const idx = db.requests.findIndex((r) => r.id === id);
      if (idx < 0) return sendJson(res, 404, { error: "Not found" });
      db.requests.splice(idx, 1);
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }
    if (idMatch && req.method === "PATCH") {
      const id = decodeURIComponent(idMatch[1]);
      const body = await readBody(req);
      const db = readDb();
      const idx = db.requests.findIndex((r) => r.id === id);
      if (idx < 0) return sendJson(res, 404, { error: "Not found" });
      if (body.dashboardStatus === "completed") {
        db.requests[idx].dashboardStatus = "completed";
        db.requests[idx].completedAt = Date.now();
      } else if (body.dashboardStatus === "pending") {
        db.requests[idx].dashboardStatus = "pending";
        delete db.requests[idx].completedAt;
      }
      writeDb(db);
      return sendJson(res, 200, { ok: true, request: db.requests[idx] });
    }

    if (pathname === "/" || pathname === "/index.html") {
      const fp = path.join(PUBLIC, "philly311-dashboard.html");
      const html = fs.readFileSync(fp, "utf8");
      return sendText(res, 200, html, "text/html; charset=utf-8");
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (e) {
    sendJson(res, 500, { error: String(e && e.message ? e.message : e) });
  }
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or run:\n  PORT=3111 npm run 311-demo`
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, "0.0.0.0", () => {
  const lan = listLanIPv4s();
  console.log(`Philly 311 demo dashboard (this machine):`);
  console.log(`  http://127.0.0.1:${PORT}/`);
  if (lan.length) {
    console.log(`On your LAN (use this in FLICK_311_DEMO_URL for the app):`);
    lan.forEach((ip) => {
      console.log(`  http://${ip}:${PORT}/`);
    });
  } else {
    console.log(`(No non-loopback IPv4 found — use 127.0.0.1 on this computer only.)`);
  }
  console.log(
    `API: GET/POST /api/requests   DELETE /api/requests (clear all)   PATCH|DELETE /api/requests/:id`
  );
});
