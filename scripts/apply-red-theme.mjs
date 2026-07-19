import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components', 'contexts', 'lib', 'hooks', 'services'];
const EXTENSIONS = ['.ts', '.tsx', '.css', '.js', '.jsx', '.json'];

// Map of exact replacements for orange & former theme colors
const REPLACEMENTS = [
  // Primary Orange to Primary Red
  { from: /#FC8019/gi, to: '#E23744' },
  { from: /#E76F0B/gi, to: '#C81E34' },
  { from: /#E9700A/gi, to: '#C81E34' },
  { from: /#E66F0D/gi, to: '#C81E34' },
  { from: /#EF4F5F/gi, to: '#E23744' },
  
  // RGBA strings
  { from: /rgba\(252,\s*128,\s*25/gi, to: 'rgba(226, 55, 68' },
  { from: /rgba\(252,128,25/gi, to: 'rgba(226,55,68' },
  { from: /rgba\(231,\s*111,\s*11/gi, to: 'rgba(200, 30, 52' },
  { from: /rgba\(231,111,11/gi, to: 'rgba(200,30,52' },

  // Tailwind orange classes
  { from: /\btext-orange-400\b/g, to: 'text-[#E23744]' },
  { from: /\btext-orange-500\b/g, to: 'text-[#E23744]' },
  { from: /\btext-orange-600\b/g, to: 'text-[#C81E34]' },
  { from: /\bbg-orange-400\b/g, to: 'bg-[#E23744]' },
  { from: /\bbg-orange-500\b/g, to: 'bg-[#E23744]' },
  { from: /\bbg-orange-600\b/g, to: 'bg-[#C81E34]' },
  { from: /\bbg-orange-200\b/g, to: 'bg-[#E23744]/10' },
  { from: /\bborder-orange-400\b/g, to: 'border-[#E23744]' },
  { from: /\bborder-orange-500\b/g, to: 'border-[#E23744]' },
  { from: /\bhover:bg-orange-600\b/g, to: 'hover:bg-[#C81E34]' },
  { from: /\bhover:text-orange-600\b/g, to: 'hover:text-[#C81E34]' },
  { from: /\bfrom-orange-500\b/g, to: 'from-[#E23744]' },
  { from: /\bto-orange-500\b/g, to: 'to-[#E23744]' },
  { from: /\bfrom-orange-600\b/g, to: 'from-[#C81E34]' },
  { from: /\bto-orange-600\b/g, to: 'to-[#C81E34]' },
  { from: /\bfrom-amber-500\b/g, to: 'from-[#E23744]' },
  { from: /\bto-amber-500\b/g, to: 'to-[#E23744]' },
  { from: /shadow-orange-500/g, to: 'shadow-[#E23744]' },

  // Warm beige / cream backgrounds to pure modern gray/white or soft red tint
  { from: /#FFF8F0/gi, to: '#FFF5F6' },
  { from: /#FFF3E0/gi, to: '#FFF5F6' },
  { from: /#FFF9F5/gi, to: '#FFF5F6' },
  { from: /#FDF8F5/gi, to: '#FAFAFA' },
  { from: /#FAF7F2/gi, to: '#FAFAFA' },
];

function getAllFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) return fileList;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        getAllFiles(fullPath, fileList);
      }
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

let modifiedCount = 0;

for (const targetDir of TARGET_DIRS) {
  const dirPath = path.join(ROOT, targetDir);
  const files = getAllFiles(dirPath);
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const rule of REPLACEMENTS) {
      content = content.replace(rule.from, rule.to);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log(`Updated theme: ${path.relative(ROOT, filePath)}`);
    }
  }
}

console.log(`Theme Migration Completed: Successfully updated ${modifiedCount} files to Premium Red theme.`);
