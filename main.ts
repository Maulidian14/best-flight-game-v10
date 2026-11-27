// Emberline Air v10 — entry program for make.fun's best flight game.
// One job: hand the game in. It copies game/ and screenshots/ from this
// repository into the output directory and writes the dossier there with
// the kit's buildDossier, exactly as the scorer rebuilds it. No network,
// no build step, no dependencies beyond the Node standard library.

import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// main.ts sits at the repository root, so its own directory IS the repo root.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

const SCREENSHOT_MAX_BYTES = 262144;
const SCREENSHOT_MIN = 3;
const SCREENSHOT_MAX = 4;

function fail(message) {
  throw new Error(`[emberline-v10] ${message}`);
}

function checkShots() {
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir)
    .filter((name) => !name.startsWith('.'))
    .sort();
  if (shots.length < SCREENSHOT_MIN || shots.length > SCREENSHOT_MAX) {
    fail(`expected ${SCREENSHOT_MIN}-${SCREENSHOT_MAX} screenshots, found ${shots.length}`);
  }
  for (const name of shots) {
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('-')) {
      fail(`screenshot name not allowed: ${name}`);
    }
    const bytes = statSync(join(shotsDir, name)).size;
    if (bytes > SCREENSHOT_MAX_BYTES) {
      fail(`screenshot ${name} is ${bytes} bytes, over the ${SCREENSHOT_MAX_BYTES} cap`);
    }
    console.log(`[emberline-v10] shot ${name}: ${bytes} bytes`);
  }
  return shots;
}

function main() {
  if (!existsSync(gameDir)) fail('game/ is missing');
  const indexBytes = existsSync(join(gameDir, 'index.html'))
    ? statSync(join(gameDir, 'index.html')).size
    : fail('game/index.html is missing');
  if (indexBytes > 1048576) fail(`game/index.html is ${indexBytes} bytes, over the 1 MiB cap`);
  console.log(`[emberline-v10] game/index.html: ${indexBytes} bytes`);
  const shots = checkShots();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`[emberline-v10] wrote ${outDir}/dossier.json (${dossier.length} bytes) from ${shots.length} screenshots`);
}

main();
