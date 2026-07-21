#!/usr/bin/env node
/**
 * Generates optimized hero poster WebP and optionally re-encodes hero video.
 * Run: node scripts/optimize-hero-assets.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const posterSrc = path.join(root, "public", "icons", "og-default.png");
const posterDest = path.join(root, "public", "icons", "hero-poster.webp");
const videoSrc = path.join(root, "public", "hero-video.mp4");
const videoTmp = path.join(root, "public", "hero-video.optimized.mp4");

async function optimizePoster() {
  if (!fs.existsSync(posterSrc)) {
    console.warn("[optimize-hero-assets] Missing poster source:", posterSrc);
    return;
  }

  const sharp = (await import("sharp")).default;
  await sharp(posterSrc)
    .resize(1920, 1080, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(posterDest);

  const before = fs.statSync(posterSrc).size;
  const after = fs.statSync(posterDest).size;
  console.log(
    `[optimize-hero-assets] Poster ${path.basename(posterDest)}: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`
  );
}

function optimizeVideo() {
  if (!fs.existsSync(videoSrc)) {
    console.warn("[optimize-hero-assets] Missing hero video:", videoSrc);
    return;
  }

  const ffmpeg = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (ffmpeg.status !== 0) {
    console.log("[optimize-hero-assets] ffmpeg not found — skipping video re-encode");
    return;
  }

  const before = fs.statSync(videoSrc).size;
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoSrc,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      "-an",
      "-vf",
      "scale='min(1920,iw)':-2",
      videoTmp,
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0 || !fs.existsSync(videoTmp)) {
    console.warn("[optimize-hero-assets] Video re-encode failed");
    return;
  }

  const after = fs.statSync(videoTmp).size;
  if (after < before * 0.98) {
    fs.renameSync(videoTmp, videoSrc);
    console.log(
      `[optimize-hero-assets] Video optimized: ${Math.round(before / 1024 / 1024)}MB → ${Math.round(after / 1024 / 1024)}MB`
    );
  } else {
    fs.unlinkSync(videoTmp);
    console.log("[optimize-hero-assets] Existing video already optimal");
  }
}

function removeBackupVideos() {
  for (const name of ["hero-video.backup.mp4", "hero-video.pizza-backup.mp4"]) {
    const file = path.join(root, "public", name);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`[optimize-hero-assets] Removed deploy artifact: ${name}`);
    }
  }
}

async function optimizePlaceholderImages() {
  const sharp = (await import("sharp")).default;
  const targets = [
    {
      file: path.join(root, "public", "default-food.webp"),
      width: 800,
      height: 600,
    },
    {
      file: path.join(root, "public", "default-restaurant.webp"),
      width: 800,
      height: 600,
    },
  ];

  for (const target of targets) {
    if (!fs.existsSync(target.file)) {
      console.warn("[optimize-hero-assets] Missing placeholder:", target.file);
      continue;
    }

    const before = fs.statSync(target.file).size;
    const tmp = `${target.file}.optimized.webp`;

    await sharp(target.file)
      .resize(target.width, target.height, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({ quality: 72, effort: 4 })
      .toFile(tmp);

    const after = fs.statSync(tmp).size;
    fs.renameSync(tmp, target.file);
    console.log(
      `[optimize-hero-assets] Placeholder ${path.basename(target.file)}: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`
    );
  }
}

await optimizePoster();
optimizeVideo();
await optimizePlaceholderImages();
removeBackupVideos();
