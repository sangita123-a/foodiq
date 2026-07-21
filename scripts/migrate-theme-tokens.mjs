/**
 * One-time migration: replace hardcoded hex colors with semantic design tokens.
 * Run: node scripts/migrate-theme-tokens.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = join(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
const EXT = new Set([".tsx", ".ts", ".css"]);

const REPLACEMENTS = [
  ["text-[#1C1C1C]", "text-foreground"],
  ["text-[#1A1A1A]", "text-foreground"],
  ["text-[#111827]", "text-foreground"],
  ["text-[#696969]", "text-gray-text"],
  ["text-[#666666]", "text-gray-text"],
  ["text-[#6B7280]", "text-gray-text"],
  ["text-[#9C9C9C]", "text-muted"],
  ["bg-[#FFFFFF]", "bg-background"],
  ["bg-[#FAFAFA]", "bg-section"],
  ["bg-[#F8F8F8]", "bg-footer"],
  ["bg-[#F8FAFC]", "bg-section"],
  ["bg-[#F5F5F5]", "bg-section"],
  ["border-[#ECECEC]", "border-border"],
  ["border-[#EAEAEA]", "border-border"],
  ["border-[#E8E8E8]", "border-border"],
  ["border-[#E5E7EB]", "border-border"],
  ["border-[#E0E0E0]", "border-border"],
  ["hover:bg-[#FAFAFA]", "hover:bg-section"],
  ["hover:bg-[#F8F8F8]", "hover:bg-section"],
  ["hover:border-[#D4D4D4]", "hover:border-border"],
  ["text-[#E23744]", "text-primary"],
  ["bg-[#E23744]", "bg-primary"],
  ["hover:bg-[#C81E32]", "hover:bg-primary-hover"],
  ["hover:text-[#E23744]", "hover:text-primary"],
  ["hover:border-[#E23744]", "hover:border-primary"],
  ["hover:text-[#C81E32]", "hover:text-primary-hover"],
  ["focus-visible:ring-[#E23744]", "focus-visible:ring-primary"],
  ["focus-visible:ring-offset-[#F8F8F8]", "focus-visible:ring-offset-footer"],
  ["bg-[#E23744]/10", "bg-primary-soft"],
  ["bg-[#FFF5F6]", "bg-primary-soft"],
  ["selection:bg-[#E23744]/15", "selection:bg-primary/10"],
  ["selection:text-[#1C1C1C]", "selection:text-foreground"],
  ["shadow-[0_4px_20px_rgba(0,0,0,0.08)]", "shadow-card"],
  ["shadow-[0_2px_12px_rgba(0,0,0,0.04)]", "shadow-nav"],
  ["group-hover/card:text-[#E23744]", "group-hover/card:text-primary"],
  ["border-[#E23744]/20", "border-primary/20"],
  ["border-[#E23744]/30", "border-primary/30"],
  ["border-[#E23744]/50", "border-primary/50"],
  ["border-[#E23744]", "border-primary"],
  ["focus:border-[#E23744]", "focus:border-primary"],
  ["focus:ring-[#E23744]/15", "focus:ring-primary/15"],
  ["focus:ring-[#E23744]/50", "focus:ring-primary/50"],
  ["focus:outline-[#E23744]", "focus:outline-primary"],
  ["fill-[#E23744]", "fill-primary"],
  ["hover:fill-[#E23744]", "hover:fill-primary"],
  ["group-hover:fill-[#E23744]", "group-hover:fill-primary"],
  ["focus:border-[#D4D4D4]", "focus:border-border-hover"],
  ['fill={isFavorite ? "#E23744" : "none"}', 'fill={isFavorite ? "var(--color-primary)" : "none"}'],
  ['stroke={isFavorite ? "#E23744" : "currentColor"}', 'stroke={isFavorite ? "var(--color-primary)" : "currentColor"}'],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (EXT.has(extname(name))) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.includes("migrate-theme-tokens")) continue;
  let src = readFileSync(file, "utf8");
  const orig = src;
  for (const [from, to] of REPLACEMENTS) {
    src = src.split(from).join(to);
  }
  if (src !== orig) {
    writeFileSync(file, src, "utf8");
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
