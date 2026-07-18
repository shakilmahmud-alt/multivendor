const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('admin') && !file.includes('DeveloperDocs')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') && !file.includes('admin') && !file.includes('DeveloperDocs')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/px-4 md:px-12 lg:px-20/g, 'px-0');
  content = content.replace(/className="w-full mx-auto px-4/g, 'className="w-full mx-auto px-0');
  content = content.replace(/w-full bg-white py-3 px-4 md:px-6/g, 'w-full bg-white py-3 px-0');
  content = content.replace(/px-4 py-6 md:py-8/g, 'px-0 py-6 md:py-8');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
