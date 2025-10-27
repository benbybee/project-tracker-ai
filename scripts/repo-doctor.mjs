#!/usr/bin/env node
// Repo Doctor: finds stray vercel.json, mismatched root, missing lockfiles, legacy "builds", and CI pitfalls.
// Usage:
//   node scripts/repo-doctor.mjs --root .          // scan current folder
//   node scripts/repo-doctor.mjs --root apps/web   // scan subfolder (Vercel Root Directory)
//   node scripts/repo-doctor.mjs --root . --fix    // apply safe fixes

import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const argv = process.argv.slice(2);
function getFlag(name, fallback = undefined) {
  const i = argv.indexOf(name);
  if (i >= 0)
    return argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : true;
  return fallback;
}

const ROOT = path.resolve(getFlag('--root', '.')); // the *deployment* root (Vercel "Root Directory")
const APPLY_FIX = !!getFlag('--fix', false);
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.vercel',
]);

const LOG = {
  info: (...a) => console.log('ℹ️ ', ...a),
  ok: (...a) => console.log('✅', ...a),
  warn: (...a) => console.log('⚠️ ', ...a),
  err: (...a) => console.error('❌', ...a),
};

async function exists(p) {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

async function readJSON(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch (e) {
    LOG.err(`Invalid JSON at ${p}: ${e.message}`);
    return null;
  }
}

async function walk(dir, hits = []) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, hits);
    else hits.push(full);
  }
  return hits;
}

function rel(p) {
  return path.relative(process.cwd(), p);
}

async function main() {
  LOG.info(
    'Scanning repo from',
    rel(process.cwd()),
    'with deployment root',
    `"${rel(ROOT)}"`
  );

  const files = await walk(process.cwd());
  const vercelFiles = files.filter((f) => /(^|\/)vercel\.json$/i.test(f));
  const nowFiles = files.filter((f) => /(^|\/)now\.json$/i.test(f));
  const lockFiles = files.filter((f) => /(^|\/)pnpm-lock\.yaml$/i.test(f));
  const pkgFiles = files.filter((f) => /(^|\/)package\.json$/i.test(f));
  const nextConfigs = files.filter((f) =>
    /(^|\/)next\.config\.(js|cjs|mjs|ts)$/i.test(f)
  );

  LOG.info('Found', vercelFiles.length, 'vercel.json file(s):');
  vercelFiles.forEach((f) => console.log('   •', rel(f)));
  if (nowFiles.length) {
    LOG.warn('Found legacy now.json file(s):');
    nowFiles.forEach((f) => console.log('   •', rel(f)));
  }

  LOG.info('Found pnpm-lock.yaml file(s):');
  lockFiles.forEach((f) => console.log('   •', rel(f)));

  // Determine which vercel.json is in the deployment root
  const candidateVercel = path.join(ROOT, 'vercel.json');
  const hasRootVercel = await exists(candidateVercel);
  if (!hasRootVercel) {
    LOG.err(`No vercel.json at deployment root: ${rel(candidateVercel)}.`);
    LOG.warn(
      'Vercel will ignore vercel.json outside the Root Directory. Move/copy the modern config here.'
    );
  }

  // Parse vercel.json files
  let legacyBuildsPaths = [];
  let modernOKPaths = [];
  for (const vf of vercelFiles) {
    const j = await readJSON(vf);
    if (!j) continue;
    if (Array.isArray(j.builds)) legacyBuildsPaths.push(vf);
    else modernOKPaths.push(vf);
  }
  if (legacyBuildsPaths.length) {
    LOG.warn('Detected legacy vercel.json using "builds":');
    legacyBuildsPaths.forEach((f) => console.log('   •', rel(f)));
  } else {
    LOG.ok('No legacy "builds" arrays detected in vercel.json files.');
  }

  // Check lockfile presence at deployment root
  const rootLock = path.join(ROOT, 'pnpm-lock.yaml');
  const hasRootLock = await exists(rootLock);
  if (!hasRootLock) {
    LOG.warn(`No pnpm-lock.yaml at deployment root: ${rel(rootLock)}.`);
    if (lockFiles.length) {
      LOG.info('Closest lockfiles found:');
      lockFiles.forEach((f) => console.log('   •', rel(f)));
    }
  } else {
    LOG.ok('Found pnpm-lock.yaml at deployment root.');
  }

  // Inspect package.json at root
  const rootPkg = path.join(ROOT, 'package.json');
  const hasRootPkg = await exists(rootPkg);
  if (!hasRootPkg)
    LOG.err(`No package.json at deployment root: ${rel(rootPkg)}.`);
  else {
    const pkg = await readJSON(rootPkg);
    if (pkg?.packageManager?.startsWith('pnpm@'))
      LOG.ok(`packageManager is set to ${pkg.packageManager}.`);
    else LOG.warn(`packageManager is not pinned to pnpm in ${rel(rootPkg)}.`);

    const nextVer = pkg?.dependencies?.next || pkg?.devDependencies?.next;
    if (nextVer) LOG.info('next version in package.json:', nextVer);
    else
      LOG.warn(
        'No Next.js dependency found in package.json at deployment root.'
      );

    if (pkg?.scripts?.build !== 'next build') {
      LOG.warn(
        `build script is "${pkg?.scripts?.build}" — recommend "next build".`
      );
    } else {
      LOG.ok(`build script is "next build".`);
    }
  }

  // Check next.config.* for eslint.ignoreDuringBuilds
  if (nextConfigs.length === 0) {
    LOG.warn('No next.config.* file found at or under root.');
  } else {
    let foundIgnore = false;
    for (const nc of nextConfigs) {
      const txt = await fs.readFile(nc, 'utf8');
      if (/eslint\s*:\s*{[^}]*ignoreDuringBuilds\s*:\s*true/i.test(txt)) {
        LOG.ok(`ESLint ignoreDuringBuilds detected in ${rel(nc)}.`);
        foundIgnore = true;
        break;
      }
    }
    if (!foundIgnore)
      LOG.warn(
        'ESLint ignoreDuringBuilds not detected; CI may fail on missing ESLint presets.'
      );
  }

  // Check (app)/page.tsx for redirect + dynamic (optional sanity)
  const appPage = path.join(ROOT, 'src/app/(app)/page.tsx');
  if (await exists(appPage)) {
    const txt = await fs.readFile(appPage, 'utf8');
    const hasRedirect = /redirect\(["'`]\/dashboard["'`]\)/.test(txt);
    const hasDynamic =
      /export\s+const\s+dynamic\s*=\s*["'`]force-dynamic["'`]/.test(txt);
    if (hasRedirect) LOG.ok('(app)/page.tsx redirects to /dashboard.');
    if (!hasDynamic)
      LOG.warn(
        '(app)/page.tsx missing export const dynamic = "force-dynamic";'
      );
  } else {
    LOG.warn(
      `Missing ${rel(appPage)} — not fatal, but recommended for deterministic builds.`
    );
  }

  // Apply fixes if requested
  if (APPLY_FIX) {
    // 1) Fix root vercel.json to modern config
    if (hasRootVercel) {
      const modern = {
        $schema: 'https://openapi.vercel.sh/vercel.json',
        framework: 'nextjs',
        installCommand: 'pnpm install --frozen-lockfile',
        buildCommand: 'pnpm build',
        outputDirectory: '.next',
      };
      await fs.writeFile(candidateVercel, JSON.stringify(modern, null, 2));
      LOG.ok(`Wrote modern vercel.json to ${rel(candidateVercel)}.`);
    } else {
      LOG.warn(
        'Cannot write modern vercel.json: no vercel.json at deployment root. Create it manually or set Vercel Root Directory to the correct folder.'
      );
    }

    // 2) Remove legacy "builds" vercel.json entries elsewhere (informational fix)
    for (const lf of legacyBuildsPaths) {
      const p = path.resolve(lf);
      if (p !== candidateVercel) {
        LOG.warn(
          `Legacy vercel.json not at deployment root: ${rel(p)} — consider deleting or updating to avoid confusion.`
        );
      }
    }

    // 3) Copy nearest pnpm-lock.yaml into root if missing (non-destructive)
    if (!hasRootLock && lockFiles.length) {
      // pick the closest lock by shortest relative path depth
      let best = null;
      let bestScore = Infinity;
      for (const lf of lockFiles) {
        const score = rel(lf).split(path.sep).length;
        if (score < bestScore) {
          best = lf;
          bestScore = score;
        }
      }
      if (best) {
        const dest = path.join(ROOT, 'pnpm-lock.yaml');
        const src = path.resolve(best);
        await fs.copyFile(src, dest);
        LOG.ok(`Copied pnpm-lock.yaml from ${rel(src)} → ${rel(dest)}.`);
      }
    }
  }

  console.log('\n--- SUMMARY ---');
  if (!hasRootVercel)
    LOG.err(
      `• Missing vercel.json at deployment root (${rel(candidateVercel)}).`
    );
  if (legacyBuildsPaths.length)
    LOG.warn(
      '• Legacy vercel.json with "builds" detected (remove or replace).'
    );
  if (!hasRootLock)
    LOG.warn(`• Missing pnpm-lock.yaml at deployment root (${rel(rootLock)}).`);
  LOG.info(
    '• Ensure Vercel Project → Settings → General → Root Directory points to:',
    rel(ROOT)
  );
  LOG.info('• After fixes: Clear Vercel Cache → Redeploy.');

  LOG.ok('Repo Doctor complete.');
}

main().catch((e) => {
  LOG.err(e.stack || e.message);
  process.exit(1);
});
