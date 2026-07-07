const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // We map orange-* to brand-*
    // Specifically:
    // orange-500 -> brand-900 (Navy)
    // hover:bg-orange-600 -> hover:bg-brand-950 (Darker Navy)
    // orange-50 -> brand-50
    // orange-100 -> brand-100
    // orange-600 -> brand-950
    // We can just replace 'orange-' with 'brand-' and handle the definitions in CSS
    
    // Wait, the easiest is to just rename 'orange-' to 'brand-' everywhere.
    // Then in index.css we define:
    // --color-brand-50: #edf2fa;
    // --color-brand-100: #dbe6f5;
    // --color-brand-200: #b7cde8;
    // --color-brand-300: #93b4dc;
    // --color-brand-400: #6f9bcf;
    // --color-brand-500: #011F55;  <-- We make brand-500 exactly the Navy blue to keep it simple!
    // --color-brand-600: #011438;  <-- Darker for hover
    // --color-brand-700: #000c22;
    
    // So all we do is replace 'orange-' with 'brand-'.
    
    let newContent = content.replace(/orange-/g, 'brand-');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    }
}

traverseDir(srcDir);
console.log('Done!');
