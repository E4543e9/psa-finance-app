#!/usr/bin/env node
/**
 * Generate PWA icons from src/app/icon.svg
 * Usage: node scripts/generate-icons.js
 * Requires: npm install --save-dev sharp
 */

const path = require("path");
const fs = require("fs");

// Inline SVG — match src/app/icon.svg exactly
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#0C0B0A"/>
  <text x="53" y="71"
    font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="900"
    font-size="54"
    text-anchor="middle"
    fill="#FF5B36"
  >P.</text>
</svg>`;

const SIZES = [192, 512];
const OUTPUT_DIR = path.join(__dirname, "..", "public");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("❌  sharp not found. Run: npm install --save-dev sharp");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const outPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✓  public/icon-${size}.png  (${size}×${size})`);
  }

  console.log("\n✅  Done — icons saved to public/");
}

main().catch((err) => {
  console.error("❌ ", err.message);
  process.exit(1);
});
