import { execSync } from "node:child_process";

process.env.CI = "1";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.VERCEL = "1"; // emulate Vercel env

console.log("🔧 Clean .next ...");
execSync("node -e \"require('fs').rmSync('.next', { recursive: true, force: true })\"", { stdio: "inherit" });

console.log("🏗  next build (CI) ...");
execSync("pnpm next build", { stdio: "inherit" });

console.log("🗂  Inspecting emitted client-reference manifests ...");
execSync("node -e \"const fs = require('fs'); try { const appDir = '.next/server/app/(app)'; if (!fs.existsSync(appDir)) { console.error('❌ Missing (app) directory'); process.exit(1); } const pageFile = '.next/server/app/(app)/page.js'; if (!fs.existsSync(pageFile)) { console.error('❌ Missing (app)/page.js'); process.exit(1); } console.log('✅ Found (app) build artifacts'); const rootManifest = '.next/server/app/page_client-reference-manifest.js'; if (!fs.existsSync(rootManifest)) { console.error('❌ Missing root client reference manifest'); process.exit(1); } console.log('✅ Found root client reference manifest'); const dashboardManifest = '.next/server/app/(app)/dashboard/page_client-reference-manifest.js'; if (!fs.existsSync(dashboardManifest)) { console.error('❌ Missing dashboard client reference manifest'); process.exit(1); } console.log('✅ Found dashboard client reference manifest'); console.log('✅ Build artifacts verified - all client reference manifests generated'); } catch(e){ console.error('❌ Build verification failed:', e.message); process.exit(1); }\"", { stdio: "inherit" });

console.log('✅ CI build sanity OK');
