import { readFileSync } from 'fs';

const src = readFileSync('foodiq-frontend/foodiq-backend/utils/ensureSchema.js', 'utf8');
const lines = src.split('\n');

// With "}}}": line 856 fails. Let's see what parses from line 1 to 855 as-is
function canParseExact(upToLine) {
  const partial = lines.slice(0, upToLine).join('\n');
  try { new Function(partial); return true; } catch(e) { return false; }
}

// From line 840-856, check which one breaks
for (let i = 840; i <= 860; i++) {
  const ok = canParseExact(i);
  console.log(`Lines 1-${i}: ${ok ? 'ok' : 'FAIL'}`);
}
