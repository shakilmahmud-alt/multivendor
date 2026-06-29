import { Product, Store, Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "t-shirt", name: "T-Shirt", icon: "Shirt" },
  { id: "laptop", name: "Laptop & Notebooks", icon: "Laptop" },
  { id: "home-appliance", name: "Home Appliance", icon: "Home" },
  { id: "desktop-pc", name: "Desktop PC", icon: "Monitor" },
  { id: "office-equipment", name: "Office Equipment", icon: "Briefcase" },
  { id: "cement", name: "Cement", icon: "HardHat" },
  { id: "network", name: "Network & Router", icon: "Wifi" },
  { id: "rod", name: "Rod", icon: "Wrench" },
  { id: "security", name: "Security Surveillance", icon: "ShieldAlert" },
  { id: "gadgets", name: "Gadgets & Lifestyle", icon: "Smartphone" },
  { id: "accessories", name: "Accessories", icon: "Keyboard" },
  { id: "smartphone", name: "Smartphone & Tablet", icon: "Tablet" },
  { id: "ips-ups", name: "IPS & UPS", icon: "Zap" },
  { id: "books", name: "Books & Stationery", icon: "BookOpen" }
];

export const STORES: Store[] = [
  { id: "store-1", name: "The Apple", logo: "🍎", banner: "", rating: 4.8, verified: true },
  { id: "store-2", name: "Kiam Products", logo: "🍳", banner: "", rating: 4.5, verified: true },
  { id: "store-3", name: "HP Brand Store", logo: "💻", banner: "", rating: 4.7, verified: true },
  { id: "store-4", name: "Dahua Official", logo: "📹", banner: "", rating: 4.9, verified: true },
  { id: "store-5", name: "Intel Tech Hub", logo: "🌀", banner: "", rating: 4.9, verified: true },
  { id: "store-6", name: "AsRock Zone", logo: "🔥", banner: "", rating: 4.6, verified: false }
];

export const PRODUCTS: Product[] = [
  // --- T-SHIRT ---
  {
    id: "p1",
    title: "Value-Top V200M Micro ATX Casing With PS...",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80",
    price: 2550,
    oldPrice: 2800,
    discountBadge: "৳250.00 Off",
    rating: 4,
    reviewCount: 3,
    storeName: "Computer World",
    storeId: "store-5",
    stock: 12
  },
  {
    id: "p2",
    title: "ASRock Z890 Pro RS WiFi White LGA1851 DD...",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80",
    price: 41500,
    oldPrice: 48500,
    discountBadge: "৳7,000.00 Off",
    rating: 5,
    reviewCount: 12,
    storeName: "Star Tech",
    storeId: "store-6",
    stock: 5
  },
  {
    id: "p3",
    title: "Dahua DH-LM22-C201P L 21.5\" FHD L...",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&q=80",
    price: 9500,
    oldPrice: 10000,
    discountBadge: "৳500.00 Off",
    rating: 4.5,
    reviewCount: 8,
    storeName: "Dahua Official",
    storeId: "store-4",
    stock: 22
  },
  {
    id: "p4",
    title: "Intel 12th Gen Core i3-12400F Alder Lake...",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&q=80",
    price: 12500,
    oldPrice: 13500,
    discountBadge: "৳1,000.00 Off",
    rating: 5,
    reviewCount: 15,
    storeName: "Intel Tech Hub",
    storeId: "store-5",
    stock: 18
  },
  {
    id: "p5",
    title: "ASRock B760M Pro-A WiFi DDR5 Micro ATX M...",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=300&q=80",
    price: 19700,
    oldPrice: 21500,
    discountBadge: "৳1,800.00 Off",
    rating: 4.2,
    reviewCount: 4,
    storeName: "AsRock Zone",
    storeId: "store-6",
    stock: 7
  },
  {
    id: "p6",
    title: "HP E22 G5 21.5 Inch FHD IPS Monitor",
    category: "T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1547119957-637f8679db1e?w=300&q=80",
    price: 18800,
    oldPrice: 20000,
    discountBadge: "৳1,200.00 Off",
    rating: 4.7,
    reviewCount: 9,
    storeName: "HP Brand Store",
    storeId: "store-3",
    stock: 10
  },

  // --- LAPTOP & NOTEBOOKS ---
  {
    id: "l1",
    title: "HP 250 G8 Core i3 11th Gen 15.6 Inch...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80",
    price: 52500,
    oldPrice: 59500,
    discountBadge: "৳7,000.00 Off",
    rating: 4.1,
    reviewCount: 11,
    storeName: "HP Brand Store",
    storeId: "store-3",
    stock: 4
  },
  {
    id: "l2",
    title: "The Apple PowerBook Air M2 Pro Core 8GB...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80",
    price: 115500,
    oldPrice: 120000,
    discountBadge: "Promo",
    rating: 4.9,
    reviewCount: 20,
    storeName: "The Apple Store",
    storeId: "store-1",
    stock: 14
  },
  {
    id: "l3",
    title: "Keyboard For Dell XPS 15 9550 9560 9570...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80",
    price: 1500,
    oldPrice: 2000,
    discountBadge: "৳500.00 Off",
    rating: 4,
    reviewCount: 2,
    storeName: "Dell Parts BD",
    storeId: "store-2",
    stock: 50
  },
  {
    id: "l4",
    title: "Dell Latitude 5289 2-in-1 FHD 13.3 Inch...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&q=80",
    price: 55000,
    oldPrice: 60000,
    discountBadge: "৳5,000.00 Off",
    rating: 4.6,
    reviewCount: 7,
    storeName: "Computer Zone",
    storeId: "store-2",
    stock: 3
  },
  {
    id: "l5",
    title: "Keyboard For Dell Inspiron 15 3521 3531...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&q=80",
    price: 700,
    oldPrice: 1200,
    discountBadge: "৳500.00 Off",
    rating: 4.0,
    reviewCount: 5,
    storeName: "Dell Accessories",
    storeId: "store-2",
    stock: 25
  },
  {
    id: "l6",
    title: "HP ProBook 440 G10 Core i5 13th Gen 14\"...",
    category: "Laptop & Notebooks",
    thumbnail: "https://images.unsplash.com/photo-1496181130204-755241524eab?w=300&q=80",
    price: 93000,
    oldPrice: 100000,
    discountBadge: "৳7,000.00 Off",
    rating: 4.8,
    reviewCount: 16,
    storeName: "HP Brand Store",
    storeId: "store-3",
    stock: 9
  },

  // --- HOME APPLIANCE ---
  {
    id: "h1",
    title: "Kiam 2.8 Liter Stainless Steel Non-Stick...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&q=80",
    price: 1107,
    oldPrice: 1230,
    discountBadge: "10% Off",
    rating: 4.5,
    reviewCount: 33,
    storeName: "Kiam Products",
    storeId: "store-2",
    stock: 0 // Out of Stock
  },
  {
    id: "h2",
    title: "Panasonic MX-M200 1L Durable & Lightweigh...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=300&q=80",
    price: 5200,
    oldPrice: 5700,
    discountBadge: "৳500.00 Off",
    rating: 4.4,
    reviewCount: 19,
    storeName: "Panasonic Authorized",
    storeId: "store-4",
    stock: 14
  },
  {
    id: "h3",
    title: "Sharp R-20A0(V) 20 Liters Microwave Ove...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&q=80",
    price: 12500,
    oldPrice: 13500,
    discountBadge: "৳1,000.00 Off",
    rating: 4.3,
    reviewCount: 22,
    storeName: "Sharp BD",
    storeId: "store-2",
    stock: 8
  },
  {
    id: "h4",
    title: "Maharaja Whiteline 750W Mixer Grinder...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?w=300&q=80",
    price: 6100,
    oldPrice: 7100,
    discountBadge: "৳1,000.00 Off",
    rating: 4.1,
    reviewCount: 10,
    storeName: "Maharaja Store",
    storeId: "store-2",
    stock: 15
  },
  {
    id: "h5",
    title: "Vision Pressure Cooker 3Liter Durable...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1544237515-38517c507e74?w=300&q=80",
    price: 1500,
    oldPrice: 1750,
    discountBadge: "৳250.00 Off",
    rating: 4.6,
    reviewCount: 14,
    storeName: "Vision Hub",
    storeId: "store-4",
    stock: 35
  },
  {
    id: "h6",
    title: "Kiam 2.8 Liter Stainless Steel Single Po...",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&q=80",
    price: 3300,
    oldPrice: 3500,
    discountBadge: "৳200.00 Off",
    rating: 4.7,
    reviewCount: 41,
    storeName: "Kiam Products",
    storeId: "store-2",
    stock: 19
  },

  // --- DESKTOP PC ---
  {
    id: "dp1",
    title: "AMD Ryzen 5 5600G Desktop PC 16GB, 512GB",
    category: "Desktop PC",
    thumbnail: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&q=80",
    price: 29500,
    oldPrice: 32500,
    discountBadge: "৳3,000.00 Off",
    rating: 4.5,
    reviewCount: 8,
    storeName: "Ryzen Hub",
    storeId: "store-5",
    stock: 5
  },
  {
    id: "dp2",
    title: "AMD Ryzen 5 2400G Desktop PC Starter Pack",
    category: "Desktop PC",
    thumbnail: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=300&q=80",
    price: 22500,
    oldPrice: 30000,
    discountBadge: "৳7,500.00 Off",
    rating: 4.0,
    reviewCount: 3,
    storeName: "Budget Custom Build",
    storeId: "store-6",
    stock: 9
  },
  {
    id: "dp3",
    title: "AMD Ryzen 5 3400G Processor Desktop PC",
    category: "Desktop PC",
    thumbnail: "https://images.unsplash.com/photo-1551645121-d1034da75057?w=300&q=80",
    price: 21200,
    oldPrice: 24300,
    discountBadge: "৳3,100.00 Off",
    rating: 4.2,
    reviewCount: 6,
    storeName: "Budget Custom Build",
    storeId: "store-6",
    stock: 4
  },
  {
    id: "dp4",
    title: "AMD Ryzen 7 8700G Budget Desktop PC Bundle",
    category: "Desktop PC",
    thumbnail: "https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?w=300&q=80",
    price: 60999,
    oldPrice: 65070,
    discountBadge: "৳4,071.00 Off",
    rating: 4.9,
    reviewCount: 15,
    storeName: "Ultimate PC Shop",
    storeId: "store-5",
    stock: 3
  },

  // --- SECURITY SURVEILLANCE ---
  {
    id: "sec1",
    title: "Tiandy TC-C32RN Dual Neckband Wireless Camera",
    category: "Security Surveillance",
    thumbnail: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=300&q=80",
    price: 6500,
    oldPrice: 7000,
    discountBadge: "৳500.00 Off",
    rating: 4.8,
    reviewCount: 18,
    storeName: "Tiandy Store",
    storeId: "store-4",
    stock: 30
  },
  {
    id: "sec2",
    title: "Tiandy TC-C32KN 2MP IR Bullet Audio Camera",
    category: "Security Surveillance",
    thumbnail: "https://images.unsplash.com/photo-1525824236856-8c0a31dfe3be?w=300&q=80",
    price: 4100,
    oldPrice: 4200,
    discountBadge: "৳100.00 Off",
    rating: 4.5,
    reviewCount: 7,
    storeName: "Tiandy Store",
    storeId: "store-4",
    stock: 15
  },
  {
    id: "sec3",
    title: "Dahua HAC-HDW1500TLXP 5MP Smart Dual Light",
    category: "Security Surveillance",
    thumbnail: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=300&q=80",
    price: 2500,
    oldPrice: 2700,
    discountBadge: "৳200.00 Off",
    rating: 4.6,
    reviewCount: 22,
    storeName: "Dahua Official",
    storeId: "store-4",
    stock: 50
  },

  // --- TOP RATED / FEATURED ---
  {
    id: "feat1",
    title: "Dahua Imou Ranger 2 3MP IP Cam...",
    category: "Security Surveillance",
    thumbnail: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=300&q=80",
    price: 2250,
    oldPrice: 2500,
    discountBadge: "৳250.00 Off",
    rating: 4.9,
    reviewCount: 114,
    storeName: "Dahua Official",
    storeId: "store-4",
    stock: 100
  },
  {
    id: "feat2",
    title: "Kiam 2.8 Liter Stainless Steel",
    category: "Home Appliance",
    thumbnail: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&q=80",
    price: 1107,
    oldPrice: 1230,
    discountBadge: "10% Off",
    rating: 4.8,
    reviewCount: 65,
    storeName: "Kiam Products",
    storeId: "store-2",
    stock: 0
  },
  {
    id: "hp-laser-1008a",
    title: "HP Laser 1008a Single Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "/assets/hp_laser_1008a.png",
    price: 13000,
    oldPrice: 14000,
    discountBadge: "৳1,000.00 Off",
    rating: 5,
    reviewCount: 5,
    storeName: "Habib House",
    storeId: "store-7",
    stock: 10,
    isNew: true,
    brand: "HP",
    productCode: "15792",
    galleryImages: [
      "/assets/hp_laser_1008a.png",
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80"
    ],
    keyFeatures: [
      "Brand: HP",
      "Print Speed: Up to 20 ppm",
      "Paper Sizes: A4, A5, A5(LEF), B5(JIS), Oficio, Envelope (DL, C5)",
      "Print Resolution: Up to 1200 x 1200 dpi"
    ],
    specifications: {
      "Basic Info": {
        "Functions": "Print Only",
        "Printer Type": "Single Function Mono Laser Printer",
        "Output Color": "Black & White"
      },
      "Print": {
        "Print Speed": "Up to 20 ppm",
        "First Page Out": "As fast as 8.3 sec",
        "Print Resolution": "Up to 1200 x 1200 dpi",
        "Duty Cycle (Yield)": "Up to 10,000 Pages",
        "Duplex Print": "Manual"
      },
      "Paper Handling": {
        "Paper Size": "A4, A5, A5(LEF), B5 (JIS), Oficio, Envelope (DL, C5)",
        "Paper Weight": "60 to 163 g/m²",
        "Input Capacity": "150 Sheets",
        "Output Capacity": "100 Sheets"
      },
      "Technical Specs": {
        "Processor": "400 MHz",
        "Memory": "64 MB",
        "Display": "LED Buttons",
        "Connectivity": "High-Speed USB 2.0 Port",
        "Power Consumption": "Active Print: 320W, Ready: 33W, Sleep: 1.1W"
      },
      "Physical Specs": {
        "Color": "White / Dark Gray",
        "Dimension": "331 x 215 x 178 mm",
        "Weight": "4.8 kg"
      },
      "Warranty": {
        "Warranty Information": "01 Year Warranty (Must be Claimed with Original Box & All Accessories)"
      }
    },
    description: "HP Laser 1008a Single Function Mono Laser Printer\n\nGet the quality you trust and sharp, black text with this affordable printer. This surprisingly small laser printer delivers exceptional quality, page after page. You can fit this printer almost anywhere – it’s that small and compact. Improve your productivity with print speeds up to 20 ppm.\n\nClear and Sharp Prints\n\nThe HP Laser 1008a printer produces sharp, crisp text and bold graphics, ensuring your documents look professional.\n\nSpace-saving Design\n\nDesigned to fit tight spaces, this printer fits almost anywhere, making it ideal for small home offices or work desks.\n\nBoosted Productivity\n\nExperience high-speed printing up to 20 pages per minute, helping you print documents quickly and efficiently."
  },
  {
    id: "sim-p1",
    title: "Pantum P2506 Single Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&q=80",
    price: 9200,
    oldPrice: 10500,
    discountBadge: "৳1,300.00 Off",
    rating: 4.3,
    reviewCount: 12,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 8
  },
  {
    id: "sim-p2",
    title: "Pantum P2506W Wireless Single Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80",
    price: 10800,
    oldPrice: 12000,
    discountBadge: "৳1,200.00 Off",
    rating: 4.5,
    reviewCount: 24,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 15
  },
  {
    id: "sim-p3",
    title: "Pantum M6506N Multi-Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80",
    price: 15900,
    oldPrice: 17500,
    discountBadge: "৳1,600.00 Off",
    rating: 4.6,
    reviewCount: 8,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 5
  },
  {
    id: "sim-p4",
    title: "Pantum M7106DN Multi-Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&q=80",
    price: 22500,
    oldPrice: 24500,
    discountBadge: "৳2,000.00 Off",
    rating: 4.7,
    reviewCount: 11,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 4
  },
  {
    id: "sim-p5",
    title: "Pantum BP5100DW Single Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&q=80",
    price: 32900,
    oldPrice: 35000,
    discountBadge: "৳2,100.00 Off",
    rating: 4.8,
    reviewCount: 6,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 7
  },
  {
    id: "sim-p6",
    title: "Brother HL-L2320D Single Function Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&q=80",
    price: 14500,
    oldPrice: 16000,
    discountBadge: "৳1,500.00 Off",
    rating: 4.7,
    reviewCount: 45,
    storeName: "Brother Hub",
    storeId: "store-9",
    stock: 10
  },
  {
    id: "sim-p7",
    title: "Pantum BP5106DN Mono Laser Printer",
    category: "Office Equipment",
    thumbnail: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80",
    price: 29500,
    oldPrice: 31000,
    discountBadge: "৳1,500.00 Off",
    rating: 4.4,
    reviewCount: 16,
    storeName: "Pantum Store",
    storeId: "store-8",
    stock: 3
  }
];

export const BRANDS = [
  { name: "Lenovo", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "ASUS", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "Dahua", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "Hikvision", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "Uniview", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "A4tech", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "TP-Link", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "Brother", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "Western Digital", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" },
  { name: "AMD", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80" }
];

export const VIDEO_GAMES_AND_REELS = [
  {
    id: "vid-1",
    title: "Riverine Farms June 2026 Special Tour",
    youtubeId: "dQw4w9WgXcQ", // Just a mock or direct embed youtube fallback
    thumbnail: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80"
  },
  {
    id: "vid-2",
    title: "One of the Finest Deshi Ghee Processing Units",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=400&q=80"
  },
  {
    id: "vid-3",
    title: "My First Time Visiting Riverine Farms",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?w=400&q=80"
  }
];

export const BLOG_POSTS = [
  { id: "b1", title: "Benefits Of Pure Ghee", excerpt: "Ghee is rich in fat-soluble vitamins...", image: "https://images.unsplash.com/photo-1549590143-d5855148a9d5?w=200&q=80" },
  { id: "b2", title: "Benefits Of Milk", excerpt: "Milk is a nutrient-dense food that...", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80" },
  { id: "b3", title: "Benefits Of Pure Honey", excerpt: "Natural honey has antibacterial properties...", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80" }
];

export const USER_REVIEWS = [
  { id: "r1", name: "Gareth Justice", rating: 4, comment: "Excellent customer service and very quick delivery! Recommended vendor.", itemTitle: "AMD Ryzen 5 5600G Desktop PC" },
  { id: "r2", name: "S. Rahman", rating: 5, comment: "Genuine Kiam cooker. Standard size and fully non-stick.", itemTitle: "Kiam 2.8 Liter Cooker" }
];

export const DISCOVER_POPULAR_CATEGORIES = [
  { name: "T-Shirt", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&q=80", count: "12 Items" },
  { name: "Laptop & Notebooks", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&q=80", count: "48 Items" },
  { name: "Home Appliance", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&q=80", count: "31 Items" },
  { name: "Desktop PC", image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100&q=80", count: "19 Items" },
  { name: "Security Surveillance", image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=100&q=80", count: "25 Items" },
  { name: "Gadgets & Lifestyle", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80", count: "55 Items" }
];
