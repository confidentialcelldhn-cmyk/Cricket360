import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = parseInt(process.env.PORT || "5000", 10);
const templatePath = path.resolve(
  __dirname,
  "../artifacts/mobile/server/templates/landing-page.html"
);
const appJsonPath = path.resolve(__dirname, "../artifacts/mobile/app.json");

let appName = "Cricket360";
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
  appName = appJson.expo?.name || appName;
} catch {}

const template = fs.readFileSync(templatePath, "utf-8");

// Use the Replit Expo proxy domain so Expo Go can connect to the metro bundler
const expoDomain =
  process.env.REPLIT_EXPO_DEV_DOMAIN ||
  process.env.REPLIT_DEV_DOMAIN ||
  "localhost";

const server = http.createServer((req, res) => {
  const forwardedProto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";

  const html = template
    .replace(/APP_NAME_PLACEHOLDER/g, appName)
    .replace(/BASE_URL_PLACEHOLDER/g, `${forwardedProto}://${host}`)
    .replace(/EXPS_URL_PLACEHOLDER/g, expoDomain);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Cricket360 landing page running on port ${port}`);
  console.log(`Expo QR will point to: exps://${expoDomain}`);
});
