import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'public', 'images', 'catalog', 'dishes');

function getFiles(dir, prefix = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, `${prefix}${file}/`));
    } else {
      results.push(`/images/catalog/dishes/${prefix}${file}`);
    }
  }
  return results;
}

console.log(JSON.stringify(getFiles(root), null, 2));
