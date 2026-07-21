import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, ArrowLeft, ArrowRight, Truck, ShieldCheck, 
  RotateCcw, BadgeAlert, Info, Headphones, HelpCircle, Flame, Star
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { Product } from "../types";

interface HeroProps {
  onSelectCategory: (category: string) => void;
  activeCategory: string;
  products?: Product[];
}

export default function Hero({ onSelectCategory, activeCategory, products = [] }: HeroProps) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<any[]>([]);
  const [dbSubSubCategories, setDbSubSubCategories] = useState<any[]>([]);
  const [dbBanners, setDbBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const animations = ["animate-fade-in", "animate-slide-up", "animate-slide-left", "animate-zoom-in", "animate-blur-in"];
  const [animClass, setAnimClass] = useState("animate-fade-in");

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  let CAROUSEL_SLIDES = dbBanners.map(b => ({
    title: "",
    subtitle: "",
    image: b.image_url,
    target: b.target_url,
    badge: "",
    price: "",
    color: "from-slate-900 to-slate-950"
  }));

  // Hover states for mega menu
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);

  // Fetch real categories and their sub-levels
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const [catRes, subRes, subSubRes, bannerRes] = await Promise.all([
          supabase.from('categories').select('*').order('priority', { ascending: true }),
          supabase.from('sub_categories').select('*').order('priority', { ascending: true }),
          supabase.from('sub_sub_categories').select('*').order('priority', { ascending: true }),
          supabase.from('banners').select('*').eq('banner_type', 'Main Banner').eq('published', true)
        ]);
        
        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;
        if (subSubRes.error) throw subSubRes.error;
        
        setDbCategories(catRes.data || []);
        setDbSubCategories(subRes.data || []);
        setDbSubSubCategories(subSubRes.data || []);
        setDbBanners(bannerRes?.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  // Auto scroll slides
  useEffect(() => {
    if (CAROUSEL_SLIDES.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [CAROUSEL_SLIDES.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  useEffect(() => {
    if (CAROUSEL_SLIDES.length > 0) {
      const randomAnim = animations[Math.floor(Math.random() * animations.length)];
      setAnimClass(randomAnim);
    }
  }, [currentSlide]);

  const badgeItems = [
    {
      icon: <Truck className="w-4 h-4" />,
      bgClass: "bg-brand-50 text-brand-500",
      title: "Fast Delivery",
      desc: "Across country"
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      bgClass: "bg-emerald-50 text-emerald-500",
      title: "Safe Payment",
      desc: "SSL secure checkout"
    },
    {
      icon: <RotateCcw className="w-4 h-4" />,
      bgClass: "bg-blue-50 text-blue-500",
      title: "7 Days Return",
      desc: "Return guarantee"
    },
    {
      icon: <BadgeAlert className="w-4 h-4" />,
      bgClass: "bg-amber-50 text-amber-500",
      title: "100% Authentic",
      desc: "Genuine brand items"
    },
    {
      icon: <Info className="w-4 h-4" />,
      bgClass: "bg-indigo-50 text-indigo-500",
      title: "About Company",
      desc: "Our corporate profile"
    },
    {
      icon: <Headphones className="w-4 h-4" />,
      bgClass: "bg-purple-50 text-purple-500",
      title: "Contact Us",
      desc: "24/7 Priority help"
    }
  ];

  return (
    <section className="w-full bg-slate-100/60 py-3 px-0 font-sans">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">


        {/* CENTER PANEL: Main dynamic slides */}
        {loading ? (
          <div className="w-full relative rounded overflow-hidden aspect-[1278/398] bg-slate-200 animate-pulse border border-slate-200" />
        ) : CAROUSEL_SLIDES.length > 0 ? (
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
            onClick={() => {
              if (CAROUSEL_SLIDES[currentSlide]?.target) {
                navigate(CAROUSEL_SLIDES[currentSlide].target);
              }
            }}
            className="w-full relative rounded overflow-hidden aspect-[1278/398] bg-slate-900 border border-slate-200 flex flex-col justify-between group cursor-pointer"
          >
            {/* Slide Renderer */}
            <div key={currentSlide} className={`absolute inset-0 z-0 ${animClass}`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${CAROUSEL_SLIDES[currentSlide].color} opacity-40 mix-blend-multiply z-0`} />
              
              <img 
                src={CAROUSEL_SLIDES[currentSlide].image} 
                alt="Highlight Banner" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Slide detail tags */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full text-white pointer-events-none">
              {CAROUSEL_SLIDES[currentSlide].badge && (
                <span className="bg-brand-500 text-white text-[10px] md:text-xs font-extrabold uppercase tracking-wider px-2 md:px-3 py-1 rounded self-start mb-2 shadow-xs animate-pulse">
                  {CAROUSEL_SLIDES[currentSlide].badge}
                </span>
              )}
              {CAROUSEL_SLIDES[currentSlide].title && (
                <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md line-clamp-2 mb-1">
                  {CAROUSEL_SLIDES[currentSlide].title}
                </h1>
              )}
              {CAROUSEL_SLIDES[currentSlide].subtitle && (
                <p className="text-xs md:text-sm text-slate-200 drop-shadow mt-1 max-w-lg line-clamp-2">
                  {CAROUSEL_SLIDES[currentSlide].subtitle}
                </p>
              )}
              {CAROUSEL_SLIDES[currentSlide].price && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xl md:text-3xl font-black text-brand-400">{CAROUSEL_SLIDES[currentSlide].price}</span>
                  <span className="text-[10px] md:text-xs uppercase font-bold text-slate-300 tracking-wider">Estimated price</span>
                </div>
              )}
            </div>

            {/* Manual Slide Toggles */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="p-2 md:p-3 bg-slate-900/60 text-white rounded-full hover:bg-brand-500 transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="p-2 md:p-3 bg-slate-900/60 text-white rounded-full hover:bg-brand-500 transition cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bullet Indicators */}
            <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 gap-2 z-20">
              {CAROUSEL_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                  className={`transition-all duration-300 cursor-pointer rounded-full ${currentSlide === idx ? "w-8 h-2 bg-brand-500" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full relative rounded overflow-hidden aspect-[1278/398] bg-slate-200 animate-pulse border border-slate-200" />
        )}

        {/* TRUST BADGES ROW (Identical to HolidayMart) - Desktop only */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 bg-white border border-slate-200 p-3 rounded justify-items-center">
          <div className="flex items-center gap-2 text-left w-full px-1">
            <div className="p-1.5 bg-brand-50 text-brand-500 rounded">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">Fast Delivery</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">Across country</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left w-full px-1 border-l border-slate-100 sm:pl-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">Safe Payment</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">SSL secure checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left w-full px-1 border-l border-slate-100 lg:pl-2">
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">7 Days Return</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">Return guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left w-full px-1 border-l border-slate-100 sm:pl-2">
            <div className="p-1.5 bg-amber-50 text-amber-500 rounded">
              <BadgeAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">100% Authentic</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">Genuine brand items</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left w-full px-1 border-l border-slate-100 lg:pl-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">About Company</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">Our corporate profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left w-full px-1 border-l border-slate-100 sm:pl-2">
            <div className="p-1.5 bg-purple-50 text-purple-500 rounded">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-none">Contact Us</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">24/7 Priority help</p>
            </div>
          </div>
        </div>

        {/* MOBILE TRUST BADGES SLIDER (Auto sliding news scroll style) */}
        <div className="md:hidden mt-4 bg-white border border-slate-200 py-3 px-2 rounded overflow-hidden relative w-full select-none">
          {/* Edge gradients for smooth fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          <div className="flex animate-marquee whitespace-nowrap w-max pause-on-hover">
            <div className="flex gap-8 items-center pr-8">
              {badgeItems.map((item, idx) => (
                <div key={`mob-set1-${idx}`} className="flex items-center gap-2 text-left shrink-0">
                  <div className={`p-1.5 rounded ${item.bgClass}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-none">{item.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-8 items-center pr-8" aria-hidden="true">
              {badgeItems.map((item, idx) => (
                <div key={`mob-set2-${idx}`} className="flex items-center gap-2 text-left shrink-0">
                  <div className={`p-1.5 rounded ${item.bgClass}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-none">{item.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

