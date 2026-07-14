const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'src/components/CategoryPage.tsx',
  'src/components/StorePage.tsx',
  'src/components/SearchPage.tsx',
  'src/components/BrandPage.tsx',
  'src/components/FlashDealsPage.tsx'
];

// Helper to inject code
for (const file of filesToPatch) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already patched
  if (content.includes('const [currentPage, setCurrentPage] = useState(1);')) {
    console.log(`Already patched ${file}`);
    continue;
  }

  // 1. Add pagination state
  // find first useState
  content = content.replace(
    /(const \[.*?\] = useState.*?;)/,
    `$1\n  const [currentPage, setCurrentPage] = useState(1);\n  const productsPerPage = 20;`
  );

  // 2. Compute paginated products
  // we find where filteredProducts map happens, but we need to inject the currentProducts logic right before the return statement.
  // Actually, wait, it's easier to inject it right before `return (`
  content = content.replace(
    /(\s*)(return\s*\(\s*<div)/,
    `$1const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length]);$1$2`
  );

  // 3. Replace filteredProducts.map with currentProducts.map
  content = content.replace(
    /filteredProducts\.map\(/g,
    'currentProducts.map('
  );
  
  // 4. Add pagination UI right after the product grid (usually after </div> that ends the grid)
  // The grid is something like <div className="grid grid-cols-2 ... gap-3 md:gap-4">...</div>
  // Let's replace the grid div's closing tag 
  const paginationHtml = `
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={\`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors \${
                        currentPage === i + 1 
                          ? 'bg-brand-500 text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }\`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}`;

  // It's tricky to find the exact closing div. Alternatively, let's append it right after the grid.
  // The grid looks like:
  // <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
  //   {currentProducts.map(product => (
  //     <ProductCard ... />
  //   ))}
  // </div>
  
  content = content.replace(
    /(<ProductCard[^>]*\/>\s*\}\)\}\s*<\/div>)/,
    `$1${paginationHtml}`
  );
  // Also we need to handle cases where ProductCard has multiple lines or has closing tag </ProductCard>
  // Let's just find the closing brace block for the map:
  content = content.replace(
    /(currentProducts\.map\([^>]*=>[\s\S]*?\)\s*\}\s*<\/div>)/,
    `$1${paginationHtml}`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched ${file}`);
}
