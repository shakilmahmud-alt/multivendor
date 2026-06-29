const products = [
  { title: "MSI VenturePro 15 A2RWEG Core 5 210H RTX 5050 8GB Graphics 15.6...", category: "Laptop" }
];

const searchTerm = "MSI ";
const lowerTerm = searchTerm.toLowerCase();
const results = products.filter(p => 
  p.title.toLowerCase().includes(lowerTerm) || 
  (p.category && p.category.toLowerCase().includes(lowerTerm))
);

console.log(results);
