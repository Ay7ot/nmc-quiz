#!/usr/bin/env node
/**
 * Generates PWA icons from scripts/icon-source.svg
 * Output: public/icons/* and public/apple-touch-icon.png
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceSvg = join(__dirname, "icon-source.svg");
const maskableSvg = join(__dirname, "icon-maskable.svg");
const outDir = join(root, "public", "icons");

const SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

async function renderIcon(input, size, output, padding = 0) {
  const svg = await readFile(input);
  const inner = size - padding * 2;
  await sharp(svg)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: padding > 0 ? { r: 26, g: 92, b: 86, alpha: 255 } : undefined,
    })
    .png()
    .toFile(output);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const svgBuffer = await readFile(sourceSvg);

  console.log("Generating icons from icon-source.svg…");

  for (const size of SIZES) {
    const out = join(outDir, `icon-${size}.png`);
    await sharp(svgBuffer).resize(size, size).png().toFile(out);
    console.log(`  ✓ icon-${size}.png`);
  }

  // Maskable (80% safe zone ≈ 10% padding on 512)
  await renderIcon(maskableSvg, 512, join(outDir, "icon-512-maskable.png"), 52);
  console.log("  ✓ icon-512-maskable.png");

  // Apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(join(root, "public", "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png");

  // Favicon 32
  await sharp(svgBuffer).resize(32, 32).png().toFile(join(root, "public", "favicon.png"));
  console.log("  ✓ favicon.png");

  // Copy SVG favicon for browsers that prefer it
  await writeFile(join(root, "public", "favicon.svg"), svgBuffer);
  console.log("  ✓ favicon.svg");

  console.log("\nDone — icons written to public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
