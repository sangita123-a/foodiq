/** Pass 2: remaining hex → semantic tokens */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
const EXT = new Set([".tsx", ".ts", ".css", ".mjs"]);

const REPLACEMENTS = [
  ["outline-[#E23744]", "outline-primary"],
  ["ring-[#E23744]/15", "ring-primary/15"],
  ["ring-[#E23744]/30", "ring-primary/30"],
  ["ring-[#E23744]/50", "ring-primary/50"],
  ["ring-[#E23744]", "ring-primary"],
  ["border-l-[#E23744]", "border-l-primary"],
  ["from-[#E23744]/60", "from-primary/60"],
  ["from-[#E23744]/40", "from-primary/40"],
  ["from-[#E23744]/20", "from-primary/20"],
  ["from-[#E23744]/10", "from-primary/10"],
  ["from-[#E23744]/5", "from-primary/5"],
  ["from-[#E23744]", "from-primary"],
  ["to-[#E23744]/20", "to-primary/20"],
  ["to-[#E23744]/5", "to-primary/5"],
  ["to-[#E23744]", "to-primary"],
  ["to-red-400", "to-primary-hover"],
  ["accent-[#E23744]", "accent-primary"],
  ["shadow-[#E23744]/20", "shadow-primary/20"],
  ["shadow-[0_20px_50px_rgba(226, 55, 68,0.3)]", "shadow-card"],
  ["shadow-[0_20px_60px_rgba(226, 55, 68,0.25)]", "shadow-card"],
  ["shadow-[0_0_30px_rgba(226, 55, 68,0.05)]", "shadow-card"],
  ["hover:bg-[#C81E34]", "hover:bg-primary-hover"],
  ["to-[#C81E34]", "to-primary-hover"],
  ['"#E23744"', '"#0F766E"'],
  ["'#E23744'", "'#0F766E'"],
  ["#C81E34", "var(--color-primary-hover)"],
  ["fill-[#E23744]", "fill-primary"],
  ["hover:fill-[#E23744]", "hover:fill-primary"],
  ["group-hover:fill-[#E23744]", "group-hover:fill-primary"],
  ['fill={isFavorite ? "#E23744" : "none"}', 'fill={isFavorite ? "var(--color-primary)" : "none"}'],
  ['stroke={isFavorite ? "#E23744" : "currentColor"}', 'stroke={isFavorite ? "var(--color-primary)" : "currentColor"}'],
  ["fill-[#E23744] text-primary", "fill-primary text-primary"],
  ["hover:bg-[#F8F9FA]", "hover:bg-section"],
  ["focus:bg-[#F8F9FA]", "focus:bg-section"],
  ["text-[#222222]", "text-foreground"],
  ["placeholder:text-[#686B78]", "placeholder:text-muted"],
  ["text-[#686B78]", "text-muted"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.has(name)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (EXT.has(extname(name)) && !name.includes("migrate-theme")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const orig = src;
  for (const [from, to] of REPLACEMENTS) src = src.split(from).join(to);
  if (src !== orig) {
    writeFileSync(file, src, "utf8");
    changed++;
  }
}
console.log(`Pass 2 updated ${changed} files.`);
