/**
 * validate-i18n.mjs — build-time locale key parity check.
 *
 * Loads every dictionary JSON under src/lib/i18n/dictionaries, computes the
 * dotted-key set for each locale, and diffs against en.json (the canonical
 * source). Exits non-zero on any missing/extra key so CI catches drift.
 *
 * Usage: node scripts/validate-i18n.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DICT_DIR = join(__dirname, "..", "src", "lib", "i18n", "dictionaries");

/**
 * Recursively collect dotted key paths from a nested object.
 * Arrays contribute their index as a path segment so array messages
 * (e.g. seo.features.<locale>) stay comparable across locales.
 */
function collectKeys(value, prefix, out) {
  if (value === null || typeof value !== "object") {
    if (prefix) out.add(prefix);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (prefix) out.add(prefix);
      return;
    }
    value.forEach((item, i) => collectKeys(item, `${prefix}.${i}`, out));
    return;
  }
  for (const key of Object.keys(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    collectKeys(value[key], path, out);
  }
}

function keysOf(obj) {
  const set = new Set();
  collectKeys(obj, "", set);
  return set;
}

async function loadDictionaries() {
  const files = await readdir(DICT_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const byLocale = {};
  for (const file of jsonFiles) {
    const locale = basename(file, ".json");
    const raw = await readFile(join(DICT_DIR, file), "utf8");
    byLocale[locale] = JSON.parse(raw);
  }
  return byLocale;
}

async function main() {
  const byLocale = await loadDictionaries();
  const en = byLocale.en;
  if (!en) {
    console.error("[i18n] en.json not found — cannot use as canonical source.");
    process.exit(1);
  }
  const canonical = keysOf(en);
  let failed = false;

  const locales = Object.keys(byLocale)
    .filter((l) => l !== "en")
    .sort();

  for (const locale of locales) {
    const keys = keysOf(byLocale[locale]);
    const missing = [...canonical].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !canonical.has(k));
    if (missing.length === 0 && extra.length === 0) {
      console.log(`[i18n] ${locale}: OK (${keys.size} keys match en)`);
      continue;
    }
    failed = true;
    if (missing.length) {
      console.error(
        `[i18n] ${locale}: missing ${missing.length} keys vs en.json`,
      );
      for (const k of missing) console.error(`  - ${k}`);
    }
    if (extra.length) {
      console.error(`[i18n] ${locale}: ${extra.length} extra keys vs en.json`);
      for (const k of extra) console.error(`  + ${k}`);
    }
  }

  if (failed) {
    console.error("[i18n] Locale key parity check FAILED.");
    process.exit(1);
  }
  console.log(
    `[i18n] All ${locales.length + 1} locales in parity with en.json.`,
  );
}

main();
