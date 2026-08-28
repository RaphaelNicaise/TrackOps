"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Lenis from "lenis";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { ArrowRight, ArrowUpRight, Activity, Map, Phone, Users, Shield, Zap, CheckCircle2, ChevronDown, Anchor, Truck, Package, Globe, Briefcase, XCircle, Plus, Minus, Bell, Database, CheckCheck, Clock, Gauge, Fuel, Check, X, ShieldAlert, FileText, Settings, Navigation, AlertTriangle, Menu, Satellite, FolderOpen, Smartphone, Sparkles, Receipt, FileWarning, Wrench, ClipboardList } from "lucide-react";

import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import LogoLoop from "@/components/LogoLoop";

// Shadcn UI Components (Assuming they are generated in @/components/ui/)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";
import BentoCard from "@/components/BentoCard";
import { PublicSupportDialog } from "@/components/soporte/public-support-dialog";
import { QuoteContactModal } from "@/components/cotizador/QuoteContactModal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const FALLBACK_TIERS = [
  { min: 1, max: 5, priceNumber: 14900, label: "1 a 5 vehículos", type: "Inicial" },
  { min: 6, max: 15, priceNumber: 12500, label: "6 a 15 vehículos", type: "Crecimiento" },
  { min: 16, max: 30, priceNumber: 10500, label: "16 a 30 vehículos", type: "Consolidada" },
  { min: 31, max: 49, priceNumber: 8900, label: "31 a 49 vehículos", type: "Masiva" },
  { min: 50, max: null as number | null, priceNumber: 0, label: "50 o más vehículos", type: "Enterprise" }
];
const PRICING_TIERS = FALLBACK_TIERS;

const LOGOS_CONFIANZA = [
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Truck size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">TransPort</span></div>, title: "TransPort" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Package size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Logística Sur</span></div>, title: "Logística Sur" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Globe size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Vía Rápida</span></div>, title: "Vía Rápida" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Anchor size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Puerto Cargas</span></div>, title: "Puerto Cargas" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Briefcase size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Expreso Federal</span></div>, title: "Expreso Federal" },
];

const COMPARISON_ROWS = [
  {
    area: "Control de Mantenimiento",
    sinTrackOps: "Planillas de Excel, pizarrones borrados y services pasados.",
    conTrackOps: "Matriz predictiva por componentes y odómetro GPS en vivo.",
  },
  {
    area: "Vencimientos y Docs",
    sinTrackOps: "Vehículos parados por seguros o VTV vencidas por sorpresa.",
    conTrackOps: "Alertas preventivas automatizadas a WhatsApp y Mail.",
  },
  {
    area: "Control de Combustible",
    sinTrackOps: "Tickets de papel en la guantera y gastos imposibles de auditar.",
    conTrackOps: "Algoritmo de eficiencia (L/100km) y alertas por desvío.",
  },
  {
    area: "Asignación de Choferes",
    sinTrackOps: "Control informal de llaves de cada unidad en cada turno.",
    conTrackOps: "Check-in/out por escaneo QR y trazabilidad exacta.",
  },
  {
    area: "Visibilidad y Seguimiento",
    sinTrackOps: "Llamadas constantes al chofer y grandes tiempos ciegos.",
    conTrackOps: "Mapa interactivo y telemetría 24/7 en vivo.",
  },
  {
    area: "Historial y Auditoría",
    sinTrackOps: "Facturas perdidas y cero historial integrado.",
    conTrackOps: "Ficha digital única con reportes totales.",
  },
  {
    area: "Toma de Decisiones",
    sinTrackOps: "Decisiones por intuición, sin métricas reales.",
    conTrackOps: "Dashboard ejecutivo de Costo Operativo.",
  },
];

export default function LandingPage() {
  const heroTextRef = useRef(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  // Optimized scroll trigger for the WhatsApp button
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 300);
  });
  
  // Slider & Quote Modal state
  const [vehicles, setVehicles] = useState([10]);
  const [annualMode, setAnnualMode] = useState(false);
  const [prevPrice, setPrevPrice] = useState(0);
  const [tiers, setTiers] = useState(FALLBACK_TIERS);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch planes dinámicos desde DB (configurable en /panel/superadmin/planes)
    fetch("/api/plans")
      .then((r) => r.json())
      .then((plans: Array<{ minVehiculos: number; maxVehiculos: number | null; precioMensual: number; nombre: string; activo?: number }>) => {
        if (Array.isArray(plans) && plans.length > 0) {
          const mapped = plans
            .filter((p) => (p.activo ?? 1) !== 0)
            .map((p) => ({
              min: p.minVehiculos,
              max: p.maxVehiculos,
              priceNumber: p.precioMensual,
              label: p.maxVehiculos ? `${p.minVehiculos} a ${p.maxVehiculos} vehículos` : `${p.minVehiculos} o más vehículos`,
              type: p.nombre,
            }))
            .sort((a, b) => a.min - b.min);
          if (mapped.length > 0) setTiers(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const maxThreshold = tiers.find((t) => t.max === null)?.min ?? 50;
  const vehiclesCount = vehicles[0];
  const currentTier =
    tiers.find((t) => vehiclesCount >= t.min && (t.max == null || vehiclesCount <= t.max)) || tiers[tiers.length - 1];

  const isEnterprise = vehiclesCount >= maxThreshold || currentTier.max == null;
  const unitPrice = annualMode ? Math.round(currentTier.priceNumber * 0.9) : currentTier.priceNumber;
  const calculatedTotalPrice = isEnterprise ? 0 : vehiclesCount * unitPrice;
  const [currentPrice, setCurrentPrice] = useState(calculatedTotalPrice);

  useEffect(() => {
    if (calculatedTotalPrice !== currentPrice) {
      setPrevPrice(currentPrice);
      setCurrentPrice(calculatedTotalPrice);
    }
  }, [calculatedTotalPrice, currentPrice]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', (e: any) => {
      if (!navbarRef.current || !headerRef.current) return;
      
      const scrollY = e.animatedScroll;
      const isMobile = window.innerWidth < 768;
      
      // Handle background classes imperatively for zero-lag
      if (scrollY > 20) {
        navbarRef.current.classList.add('bg-white/95', 'backdrop-blur-md', 'border-b', 'border-[#EAEAEA]', 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]');
        navbarRef.current.classList.remove('bg-transparent');
        headerRef.current.classList.remove('h-24', 'md:h-24');
        headerRef.current.classList.add('h-20', 'md:h-20');
      } else {
        navbarRef.current.classList.remove('bg-white/95', 'backdrop-blur-md', 'border-b', 'border-[#EAEAEA]', 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]');
        navbarRef.current.classList.add('bg-transparent');
        headerRef.current.classList.add('h-24', 'md:h-24');
        headerRef.current.classList.remove('h-20', 'md:h-20');
      }

      // Handle mobile hide/show nav logic
      if (scrollY <= 0) {
        navbarRef.current.style.transform = 'translateY(0)';
        return;
      }

      // If mobile menu is open, force show
      if (document.body.classList.contains('menu-open')) {
        navbarRef.current.style.transform = 'translateY(0)';
        return;
      }

      if (isMobile && scrollY > 150) {
        if (e.direction === 1) {
          // Scrolling down
          navbarRef.current.style.transform = 'translateY(-100%)';
        } else if (e.direction === -1) {
          // Scrolling up
          navbarRef.current.style.transform = 'translateY(0)';
        }
      } else {
        // Always show on desktop
        navbarRef.current.style.transform = 'translateY(0)';
      }
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Hero Animations
    const tl = gsap.timeline();
    tl.fromTo(heroTextRef.current, 
      { opacity: 0, y: 40 }, 
      { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" }
    ).fromTo(".hero-dashboard",
      { opacity: 0, y: 80, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power3.out" },
      "-=0.8"
    );

    const createRouteVehicle = (selector: string, phaseOffset: number) => {
      const tween = gsap.to(selector, {
        motionPath: {
          path: "#route-path",
          align: "#route-path",
          alignOrigin: [0.5, 0.5],
          autoRotate: true
        },
        duration: 35,
        repeat: -1,
        ease: "linear"
      });
      tween.eventCallback("onUpdate", () => {
        const p = tween.progress() % 1;
        const band = 0.08;
        let opacity = 1;
        if (p < band) opacity = p / band;
        else if (p > 1 - band) opacity = (1 - p) / band;
        (tween.targets()[0] as HTMLElement).style.opacity = String(opacity);
      });
      if (phaseOffset) tween.progress(phaseOffset);
    };
    createRouteVehicle(".map-vehicle", 0);
    createRouteVehicle(".map-vehicle-2", 0.5);

    // Bento Grid Entrance
    gsap.utils.toArray(".reveal-up").forEach((el: any, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: (i % 3) * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          }
        }
      );
    });

    const stepsMM = gsap.matchMedia();
    stepsMM.add("(max-width: 767px)", () => {
      const nums = gsap.utils.toArray<HTMLElement>(".step-number");
      const lightOnly = (i: number) => {
        nums.forEach((n, idx) => n.classList.toggle("is-lit", idx === i));
      };
      nums.forEach((num, i) => {
        ScrollTrigger.create({
          trigger: num,
          start: "top 85%",
          end: "top 5%",
          onEnter: () => lightOnly(i),
          onEnterBack: () => lightOnly(i)
        });
      });
    });

    // Scroll Truck Interactive Route
    if (document.querySelector("#bg-route")) {
      gsap.to(".scroll-truck", {
        motionPath: {
          path: "#bg-route",
          align: "#bg-route",
          alignOrigin: [0.5, 0.5],
          autoRotate: true
        },
        ease: "none",
        scrollTrigger: {
          trigger: "#soluciones",
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
      
      // Anima los guiones de la ruta constantemente
      gsap.to("#bg-route", {
        strokeDashoffset: -100,
        duration: 4,
        repeat: -1,
        ease: "none"
      });
    }

    return () => {
      lenis.destroy();
      stepsMM.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Sync mobile menu state with imperative styles
  useEffect(() => {
    if (!navbarRef.current || !headerRef.current) return;
    
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
      navbarRef.current.classList.add('bg-white/95', 'backdrop-blur-md', 'border-b', 'border-[#EAEAEA]', 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]');
      navbarRef.current.classList.remove('bg-transparent');
      navbarRef.current.style.transform = 'translateY(0)';
    } else {
      document.body.classList.remove('menu-open');
      if (window.scrollY <= 20) {
        navbarRef.current.classList.remove('bg-white/95', 'backdrop-blur-md', 'border-b', 'border-[#EAEAEA]', 'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]');
        navbarRef.current.classList.add('bg-transparent');
      }
    }
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#F6F4EE] selection:bg-[#F2B705] selection:text-[#111]">
      {/* Enterprise Full-Width Navbar (Dynamic Scroll) */}
      <div 
        ref={navbarRef}
        style={{ transform: 'translateY(0)' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent`}
      >
        <header ref={headerRef} className={`w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between transition-all duration-300 h-20 md:h-24`}>
          {/* Izquierda: Logo */}
          <Link href="/" className="block relative h-10 md:h-14 group z-50 shrink-0">
            <img src="/trackopslogo.png" alt="TrackOps" className="h-full w-auto object-contain object-left transition-transform group-hover:opacity-90" />
          </Link>
          
          {/* Centro: Píldora de Navegación */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-white/80 backdrop-blur-md border border-[#1E2227] px-4 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <a
              href="#soluciones"
              onClick={(e) => handleSmoothScroll(e, '#soluciones')}
              className="text-xs xl:text-sm font-medium text-[#787774] hover:text-[#1E2227] px-3 py-1.5 rounded-full hover:bg-black/5 transition-all duration-200 whitespace-nowrap"
            >
              Soluciones
            </a>
            <a
              href="#como-funciona"
              onClick={(e) => handleSmoothScroll(e, '#como-funciona')}
              className="text-xs xl:text-sm font-medium text-[#787774] hover:text-[#1E2227] px-3 py-1.5 rounded-full hover:bg-black/5 transition-all duration-200 whitespace-nowrap"
            >
              Cómo funciona
            </a>
            <a
              href="#por-que-trackops"
              onClick={(e) => handleSmoothScroll(e, '#por-que-trackops')}
              className="text-xs xl:text-sm font-medium text-[#787774] hover:text-[#1E2227] px-3 py-1.5 rounded-full hover:bg-black/5 transition-all duration-200 whitespace-nowrap"
            >
              Por qué TrackOps
            </a>
            <a
              href="#precios"
              onClick={(e) => handleSmoothScroll(e, '#precios')}
              className="text-xs xl:text-sm font-medium text-[#787774] hover:text-[#1E2227] px-3 py-1.5 rounded-full hover:bg-black/5 transition-all duration-200 whitespace-nowrap"
            >
              Precios
            </a>
            <a
              href="#faq"
              onClick={(e) => handleSmoothScroll(e, '#faq')}
              className="text-xs xl:text-sm font-medium text-[#787774] hover:text-[#1E2227] px-3 py-1.5 rounded-full hover:bg-black/5 transition-all duration-200 whitespace-nowrap"
            >
              FAQ
            </a>
          </nav>
          
          {/* Derecha: Acceso & Conversión */}
          <div className="flex items-center gap-2 sm:gap-3 relative z-50 shrink-0">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#1E2227] hover:text-[#787774] px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              <Users size={16} className="text-[#787774]" />
              <span>Ingresar</span>
            </Link>
            <Link
              href="/demo"
              className="bg-[#F2B705] text-[#1E2227] text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-[#e0aa04] hover:shadow-[0_8px_20px_rgba(242,183,5,0.4)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
            >
              Probar Demo
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#1E2227] p-2 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-28 px-6 flex flex-col gap-3 lg:hidden border-b border-[#EAEAEA] shadow-2xl h-auto pb-8 overflow-y-auto"
          >
            <a href="#soluciones" onClick={(e) => handleSmoothScroll(e, '#soluciones')} className="text-base font-medium text-[#1E2227] border-b border-[#EAEAEA] pb-3">Soluciones</a>
            <a href="#como-funciona" onClick={(e) => handleSmoothScroll(e, '#como-funciona')} className="text-base font-medium text-[#1E2227] border-b border-[#EAEAEA] pb-3">Cómo funciona</a>
            <a href="#por-que-trackops" onClick={(e) => handleSmoothScroll(e, '#por-que-trackops')} className="text-base font-medium text-[#1E2227] border-b border-[#EAEAEA] pb-3">Por qué TrackOps</a>
            <a href="#precios" onClick={(e) => handleSmoothScroll(e, '#precios')} className="text-base font-medium text-[#1E2227] border-b border-[#EAEAEA] pb-3">Precios</a>
            <a href="#faq" onClick={(e) => handleSmoothScroll(e, '#faq')} className="text-base font-medium text-[#1E2227] border-b border-[#EAEAEA] pb-3">Preguntas Frecuentes</a>
            
            <div className="flex flex-col gap-3 pt-3">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-sm font-semibold text-[#1E2227] py-3 rounded-xl border border-[#EAEAEA] bg-[#F6F4EE]">
                <Users size={16} /> Ingresar
              </Link>
              <Link href="/demo" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center text-sm font-bold text-[#1E2227] py-3 rounded-xl bg-[#F2B705] hover:bg-[#e0aa04]">
                Probar Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Enterprise CRO Section */}
      <main className="pt-40 md:pt-48 pb-10 px-6 relative overflow-hidden flex flex-col items-center bg-white border-b border-[#EAEAEA]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#F2B705]/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div ref={heroTextRef} className="max-w-5xl w-full text-center relative z-10">
          <h1 className="font-sans font-extrabold text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] tracking-tight text-[#1E2227] mb-6 max-w-4xl mx-auto">
            Control total de tu flota,<br className="hidden md:block" /> en tiempo real.
          </h1>
          
          <p className="font-sans font-normal text-lg md:text-xl text-[#787774] max-w-2xl mx-auto mb-10 leading-relaxed">
            Rastreo satelital, alertas inteligentes, mantenimiento preventivo y control de combustible en una sola plataforma. Soporte humano y cobertura en todo el país.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/demo" className="w-full sm:w-auto bg-[#F2B705] text-[#1E2227] px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#e0aa04] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(242,183,5,0.4)] transition-all duration-300">
              Probar Demo ¡Ya! <ArrowRight size={18} />
            </Link>
            <a href="#precios" onClick={(e) => handleSmoothScroll(e, '#precios')} className="w-full sm:w-auto bg-transparent border-2 border-[#1E2227] text-[#1E2227] px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center hover:bg-[#1E2227]/5 hover:-translate-y-1 transition-all duration-300">
              Ver Planes y Precios
            </a>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-wider text-[#1E2227] bg-[#F6F4EE] py-3 px-6 rounded-full inline-flex mx-auto border border-[#1E2227] tabular-nums">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#346538]" /> +15% Ahorro Combustible</span>
            <span className="hidden md:block text-[#1E2227]/30">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#346538]" /> 100% Control Mantenimientos</span>
            <span className="hidden md:block text-[#1E2227]/30">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#346538]" /> 0 Multas por Vencimientos</span>
          </div>
        </div>

        {/* Hero Dynamic Dashboard Mockup (Uber style) */}
        <div className="hero-dashboard mt-12 md:mt-16 w-full max-w-5xl relative z-10 h-auto md:h-[450px] perspective-1000">
          <div className="w-full h-full bg-white border border-[#1E2227] rounded-t-2xl shadow-2xl overflow-hidden relative flex flex-col">
            <div className="h-10 border-b border-[#1E2227] bg-[#FBFBFA] flex items-center px-4 gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="ml-auto w-24 md:w-32 h-4 bg-[#EAEAEA] rounded" />
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row bg-[#F6F4EE] relative overflow-hidden">
              {/* Left Sidebar (Metrics) */}
              <div className="w-full md:w-1/3 bg-white/80 backdrop-blur border-b md:border-b-0 md:border-r border-[#1E2227] p-4 md:p-6 flex flex-col gap-4 z-10 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-[#1E2227] text-white flex items-center justify-center"><Truck size={16} /></div>
                  <div>
                    <div className="text-[#1E2227] font-semibold text-sm">Volvo FH 460</div>
                    <div className="text-[#787774] text-xs font-mono">Patente: AC 345 FG</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Map size={16} /> <span className="text-sm">Ruta</span></div>
                    <div className="text-[#1E2227] font-medium text-sm">CABA <ArrowRight size={12} className="inline mx-1"/> Rosario</div>
                  </div>
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Package size={16} /> <span className="text-sm">Carga</span></div>
                    <div className="text-[#1E2227] font-medium text-sm">24.5 Toneladas</div>
                  </div>
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Users size={16} /> <span className="text-sm">Chofer</span></div>
                    <div className="text-[#1E2227] font-medium text-sm">M. Rossi</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-[#E1F3FE]/30 border border-[#E1F3FE] rounded-lg p-3 text-center">
                      <Gauge className="mx-auto mb-1 text-[#1F6C9F]" size={16} />
                      <div className="text-[#1E2227] font-semibold">82 km/h</div>
                      <div className="text-xs text-[#787774]">Velocidad</div>
                    </div>
                    <div className="bg-[#FDEBEC]/30 border border-[#FDEBEC] rounded-lg p-3 text-center">
                      <Fuel className="mx-auto mb-1 text-[#9F2F2D]" size={16} />
                      <div className="text-[#1E2227] font-semibold">45 L</div>
                      <div className="text-xs text-[#787774]">Consumo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Map Area */}
              <div className="w-full md:flex-1 h-[300px] md:h-auto relative bg-[#E9E5DD] overflow-hidden">
                <svg className="absolute inset-0 w-full h-full scale-[1.35] md:scale-100 origin-center transition-transform" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                  
                  {/* Manzanas (City Grid) */}
                  <g stroke="#FFFFFF" strokeWidth="6" opacity="0.7">
                    <path d="M 100 -100 L 100 700 M 250 -100 L 250 700 M 400 -100 L 400 700 M 550 -100 L 550 700 M 700 -100 L 700 700" />
                    <path d="M -100 100 L 900 100 M -100 250 L 900 250 M -100 400 L 900 400 M -100 550 L 900 550" />
                  </g>
                  
                  {/* Calles secundarias finas */}
                  <g stroke="#FFFFFF" strokeWidth="2" opacity="0.4">
                    <path d="M 175 -100 L 175 700 M 325 -100 L 325 700 M 475 -100 L 475 700 M 625 -100 L 625 700" />
                    <path d="M -100 175 L 900 175 M -100 325 L 900 325 M -100 475 L 900 475" />
                  </g>

                  {/* Ruta Base (Gris) */}
                  <path id="route-path" d="M 100 650 L 100 420 Q 100 400 120 400 L 380 400 Q 400 400 400 380 L 400 270 Q 400 250 420 250 L 680 250 Q 700 250 700 230 L 700 100" fill="none" stroke="#D0C9BD" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Ruta Activa (Amarilla punteada) */}
                  <path d="M 100 650 L 100 420 Q 100 400 120 400 L 380 400 Q 400 400 400 380 L 400 270 Q 400 250 420 250 L 680 250 Q 700 250 700 230 L 700 100" fill="none" stroke="#F2B705" strokeWidth="8" strokeLinecap="round" strokeDasharray="15 15" />

                  {/* Marcadores Origen / Destino */}
                  <circle cx="100" cy="550" r="8" fill="#1E2227" stroke="#FFF" strokeWidth="3" />
                  <circle cx="700" cy="100" r="10" fill="#F2B705" stroke="#FFF" strokeWidth="3" />
                  <circle cx="700" cy="100" r="4" fill="#1E2227" />

                  {/* Moving Vehicle Dot - Inside SVG to guarantee GSAP motionPath alignment */}
                  <g className="map-vehicle text-white">
                    <circle cx="0" cy="0" r="14" fill="#1E2227" stroke="#FFF" strokeWidth="2" />
                    <Truck size={12} color="white" x="-6" y="-6" />
                  </g>
                  <g className="map-vehicle-2 text-white">
                    <circle cx="0" cy="0" r="14" fill="#1E2227" stroke="#FFF" strokeWidth="2" />
                    <Truck size={12} color="white" x="-6" y="-6" />
                  </g>
                </svg>
                
                {/* Map UI overlays */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded shadow-sm border border-[#1E2227] p-2 text-xs font-mono text-[#1E2227] flex items-center gap-2 z-20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> GPS Activo
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confían en Nosotros (LogoLoop) */}
      <section className="py-12 border-b border-[#EAEAEA] bg-[#F6F4EE] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#787774]">Empresas que redujeron sus costos operativos con TrackOps</p>
        </div>
        <LogoLoop
          logos={LOGOS_CONFIANZA}
          speed={60}
          direction="left"
          logoHeight={30}
          gap={80}
          fadeOut
          fadeOutColor="#F6F4EE"
        />
      </section>

      {/* 3 Simples Pasos (Implementación) - Editorial & Sticky */}
      <section id="como-funciona" className="py-32 md:py-48 px-6 bg-[#FBFBFA] border-b border-[#EAEAEA] relative">
        <div id="implementacion" className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24 items-start">
          
          {/* Sticky Left Column */}
          <div className="md:w-5/12 md:sticky top-32">
            <h2 className="font-sans font-extrabold text-4xl md:text-5xl lg:text-6xl text-[#1E2227] mb-6 leading-[1.1] tracking-tight">
              De los papeles al control total.
            </h2>
            <p className="font-sans font-normal text-[#787774] text-xl leading-relaxed mb-8">
              Sin implementaciones eternas. Diseñado para que arranques a gestionar tu flota hoy mismo, en 3 simples pasos.
            </p>
            <div className="hidden md:block w-full h-[1px] bg-[#EAEAEA] mt-12"></div>
          </div>

          {/* Scrolling Steps Right Column */}
          <div className="md:w-7/12 flex flex-col gap-24">
            
            {/* Paso 1 */}
            <div className="reveal-up group relative">
              <div className="step-number text-[100px] md:text-[120px] leading-none font-mono font-extrabold tabular-nums text-[#EAEAEA] absolute -top-10 md:-top-12 left-0 md:-left-8 -z-10 group-hover:text-[#F2B705]/20 transition-colors duration-700 select-none">
                01
              </div>
              <div className="w-16 h-16 bg-white border border-[#EAEAEA] rounded-full flex items-center justify-center mb-8 text-[#1E2227] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <Satellite size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-semibold text-[#1E2227] mb-4 tracking-tight">Conectamos tu flota</h3>
              <p className="text-[#787774] text-lg leading-relaxed max-w-lg">
                Instalamos los equipos sin costo extra en el alta, o nos integramos con tu proveedor actual. El sistema empieza a leer el kilometraje y consumo en tiempo real, de forma automática.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="reveal-up group relative">
              <div className="step-number text-[100px] md:text-[120px] leading-none font-mono font-extrabold tabular-nums text-[#EAEAEA] absolute -top-10 md:-top-12 left-0 md:-left-8 -z-10 group-hover:text-[#F2B705]/20 transition-colors duration-700 select-none">
                02
              </div>
              <div className="w-16 h-16 bg-white border border-[#EAEAEA] rounded-full flex items-center justify-center mb-8 text-[#1E2227] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <FolderOpen size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-semibold text-[#1E2227] mb-4 tracking-tight">Digitalizamos tu operación</h3>
              <p className="text-[#787774] text-lg leading-relaxed max-w-lg">
                Olvidate de los pizarrones y las planillas. Cargás tus vehículos, choferes, fechas de services y vencimientos (VTV, seguros, licencias) en una plataforma única y centralizada.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="reveal-up group relative">
              <div className="step-number text-[100px] md:text-[120px] leading-none font-mono font-extrabold tabular-nums text-[#EAEAEA] absolute -top-10 md:-top-12 left-0 md:-left-8 -z-10 group-hover:text-[#F2B705]/20 transition-colors duration-700 select-none">
                03
              </div>
              <div className="w-16 h-16 bg-white border border-[#EAEAEA] rounded-full flex items-center justify-center mb-8 text-[#1E2227] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <Smartphone size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-semibold text-[#1E2227] mb-4 tracking-tight">Tomá el control por WhatsApp</h3>
              <p className="text-[#787774] text-lg leading-relaxed max-w-lg">
                La plataforma trabaja sola. Vos y tu equipo empiezan a recibir alertas automáticas en el celular antes de que venza un papel, cuando toca un service o si detectamos desvíos de combustible.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Geolocker Style Comparison Table */}
      <section id="por-que-trackops" className="py-24 md:py-32 px-6 bg-[#1E2227] text-white">
        <div id="comparativa" className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans font-extrabold text-4xl md:text-5xl mb-6 tracking-tight">No somos solo un GPS.</h2>
            <p className="font-sans font-normal text-[#A1A1AA] text-lg">La diferencia entre saber dónde está un camión y tener el control absoluto de tu operación logística y financiera.</p>
          </div>

          <div className="bg-[#181B1F] border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-[#333] hover:bg-transparent">
                    <TableHead className="hidden md:table-cell w-[25%] py-6 px-4 md:px-6 text-white font-medium text-base md:text-lg">Área Operativa</TableHead>
                    <TableHead className="w-1/2 md:w-[35%] py-4 md:py-6 px-3 md:px-6 text-[#A1A1AA] text-sm md:text-lg border-l-0 md:border-l border-[#333]">Sin TrackOps</TableHead>
                    <TableHead className="w-1/2 md:w-[40%] py-4 md:py-6 px-3 md:px-6 text-[#F2B705] text-sm md:text-lg font-bold border-l border-[#333] bg-[#222830]">Ecosistema TrackOps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <TableRow key={i} className={`border-[#333] hover:bg-[#1A1E22] transition-colors ${i === COMPARISON_ROWS.length - 1 ? 'border-b-0' : ''}`}>
                      <TableCell className={`hidden md:table-cell py-4 md:py-8 px-4 md:px-6 font-medium text-white text-sm md:text-base ${i === COMPARISON_ROWS.length - 1 ? 'border-b-0' : ''}`}>{row.area}</TableCell>
                      <TableCell className={`w-1/2 md:w-[35%] py-4 md:py-8 px-3 md:px-6 text-[#A1A1AA] text-xs sm:text-sm md:text-base border-l-0 md:border-l border-[#333] leading-relaxed ${i === COMPARISON_ROWS.length - 1 ? 'border-b-0' : ''}`}><X size={16} className="inline mr-1 md:mr-2 text-red-400 opacity-60 flex-shrink-0 align-text-bottom"/> {row.sinTrackOps}</TableCell>
                      <TableCell className={`w-1/2 md:w-[40%] py-4 md:py-8 px-3 md:px-6 text-white text-xs sm:text-sm md:text-base border-l border-[#333] bg-[#222830] leading-relaxed ${i === COMPARISON_ROWS.length - 1 ? 'border-b-0' : ''}`}><Check size={16} className="inline mr-1 md:mr-2 text-[#F2B705] flex-shrink-0 align-text-bottom"/> {row.conTrackOps}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos (Features) */}
      <section id="soluciones" className="py-24 md:py-32 px-6 bg-[#F6F4EE] border-b border-[#EAEAEA] relative overflow-hidden">
        <div id="funciones" className="hidden" />
        {/* Animated Dashed Route Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40 hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
            <path id="bg-route" d="M -100 150 C 400 100 800 700 1500 200" fill="none" stroke="#F2B705" strokeWidth="6" strokeDasharray="15 15" strokeLinecap="round" />
            <g className="scroll-truck">
              <circle cx="0" cy="0" r="20" fill="#1E2227" stroke="#FFF" strokeWidth="3" />
              <Truck size={20} color="white" x="-10" y="-10" />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
            <h2 className="font-sans font-extrabold text-4xl md:text-5xl lg:text-6xl mb-6 text-[#1E2227] tracking-tight">Todo lo que necesitás para que tu flota deje de perder plata.</h2>
            <p className="font-sans font-normal text-[#787774] text-lg">Módulos diseñados para atacar los focos de pérdida en logística: combustible, roturas y multas.</p>
          </div>
          
          {/* Mobile Scroll Stack (Visually hidden on desktop) */}
          <div className="block md:hidden w-full relative z-20 pb-[2vh]">
            <ScrollStack
              useWindowScroll
              itemDistance={40}
              itemStackDistance={26}
              stackPosition="14%"
              scaleEndPosition="6%"
              baseScale={0.92}
              itemScale={0.02}
              blurAmount={1.5}
            >
              <ScrollStackItem itemClassName="bg-white border border-[#1E2227] rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[230px]">
                <div className="absolute top-4 right-4 bg-[#E7FFDB] text-[#075E54] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-[#075E54]/20 z-10">
                  <Sparkles size={10} /> NUEVO
                </div>
                <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-4 text-[#1E2227]">
                  <Receipt size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E2227] mb-2 pr-16">Carga con IA</h3>
                <p className="text-[#787774] text-sm leading-relaxed">
                  Nuestra IA lee los tickets por WhatsApp. El sistema cruza esa carga con los km del GPS para detectar desvíos.
                </p>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-white border border-[#1E2227] rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[230px]">
                <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-4 text-[#1E2227]">
                  <FileWarning size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E2227] mb-2">Cero multas</h3>
                <p className="text-[#787774] text-sm leading-relaxed">
                  Cargá la fecha de vencimiento y TrackOps te avisará 30, 15 y 7 días antes directo a tu WhatsApp y Mail.
                </p>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-white border border-[#1E2227] rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[230px]">
                <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-4 text-[#1E2227]">
                  <Wrench size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E2227] mb-2">Service Automático</h3>
                <p className="text-[#787774] text-sm leading-relaxed">
                  El sistema cuenta los kilómetros solo mediante el GPS y te genera la alerta para el taller a tiempo.
                </p>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-white border border-[#1E2227] rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[230px]">
                <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-4 text-[#1E2227]">
                  <Map size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E2227] mb-2">Telemetría 24/7</h3>
                <p className="text-[#787774] text-sm leading-relaxed">
                  Reproducí rutas exactas, dibujá geocercas y recibí alertas de velocidad o encendido de madrugada.
                </p>
              </ScrollStackItem>

              <ScrollStackItem itemClassName="bg-white border border-[#1E2227] rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[230px]">
                <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-4 text-[#1E2227]">
                  <ClipboardList size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E2227] mb-2">Auditoría Ficha Única</h3>
                <p className="text-[#787774] text-sm leading-relaxed">
                  Toda la vida de tu unidad en un solo lugar. Desde siniestros hasta costo por kilómetro y QR.
                </p>
              </ScrollStackItem>
            </ScrollStack>
          </div>

          {/* Desktop Bento Grid (Visually hidden on mobile) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* Tarjeta 1 */}
            <BentoCard className="reveal-up col-span-1 md:col-span-2 lg:col-span-2">
              <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                <div className="bg-[#E7FFDB] text-[#075E54] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-[#075E54]/20">
                  <Sparkles size={12} /> NUEVO
                </div>
                <ArrowUpRight size={20} className="text-[#1E2227] opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-6 text-[#1E2227]">
                <Receipt size={24} />
              </div>
              <h3 className="text-2xl font-semibold text-[#1E2227] mb-3 pr-24 transition-colors duration-300 group-hover:text-[#111]">Carga de tickets con Inteligencia Artificial</h3>
              <p className="text-[#787774] leading-relaxed max-w-xl">¿Tus choferes cargan gasoil? Que manden una foto del ticket por WhatsApp. Nuestra IA lee los litros, el importe y la patente. El sistema cruza esa carga con los km reales del GPS para detectar desvíos, "ordeñes" o ineficiencias al instante.</p>
            </BentoCard>

            {/* Tarjeta 2 */}
            <BentoCard className="reveal-up col-span-1">
              <div className="absolute top-6 right-6 z-10">
                <ArrowUpRight size={20} className="text-[#1E2227] opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-6 text-[#1E2227]">
                <FileWarning size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[#1E2227] mb-3 transition-colors duration-300 group-hover:text-[#111]">Cero multas por papeles vencidos</h3>
              <p className="text-[#787774] leading-relaxed text-sm">Se acabaron los camiones parados. Cargá la fecha de vencimiento de la VTV/RTO, Ruta, Seguros o Licencias, y TrackOps te avisará 30, 15 y 7 días antes directo a tu WhatsApp y Mail.</p>
            </BentoCard>

            {/* Tarjeta 3 */}
            <BentoCard className="reveal-up col-span-1">
              <div className="absolute top-6 right-6 z-10">
                <ArrowUpRight size={20} className="text-[#1E2227] opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-6 text-[#1E2227]">
                <Wrench size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[#1E2227] mb-3 transition-colors duration-300 group-hover:text-[#111]">Mantenimiento Predictivo Automático</h3>
              <p className="text-[#787774] leading-relaxed text-sm">Chau al Excel. Configurá tus mantenimientos una sola vez (ej. cambio de aceite cada 10.000 km). El sistema cuenta los kilómetros solo mediante el GPS y te genera la alerta para que saques turno en el taller antes de que sea tarde.</p>
            </BentoCard>

            {/* Tarjeta 4 */}
            <BentoCard className="reveal-up col-span-1">
              <div className="absolute top-6 right-6 z-10">
                <ArrowUpRight size={20} className="text-[#1E2227] opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-6 text-[#1E2227]">
                <Map size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[#1E2227] mb-3 transition-colors duration-300 group-hover:text-[#111]">Historial, Geocercas y Telemetría 24/7</h3>
              <p className="text-[#787774] leading-relaxed text-sm">No somos solo un punto en el mapa. Volvé en el tiempo para reproducir rutas exactas. Dibujá zonas permitidas y recibí alertas de excesos de velocidad, ralentí excesivo o si encienden un vehículo de madrugada.</p>
            </BentoCard>

            {/* Tarjeta 5 */}
            <BentoCard className="reveal-up col-span-1 md:col-span-2 lg:col-span-1">
              <div className="absolute top-6 right-6 z-10">
                <ArrowUpRight size={20} className="text-[#1E2227] opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <div className="w-12 h-12 bg-[#F6F4EE] border border-[#1E2227] rounded-xl flex items-center justify-center mb-6 text-[#1E2227]">
                <ClipboardList size={24} />
              </div>
              <h3 className="text-xl font-semibold text-[#1E2227] mb-3 transition-colors duration-300 group-hover:text-[#111]">Auditoría y Ficha Única del Vehículo</h3>
              <p className="text-[#787774] leading-relaxed text-sm">Toda la vida de tu unidad en un solo lugar. Desde la cédula y siniestros, hasta el costo por kilómetro (CPK) y la asignación de choferes por código QR. Exportá reportes en PDF y Excel listos.</p>
            </BentoCard>

          </div>
        </div>
      </section>

      {/* Dynamic Pricing Quoter with AnimatePresence */}
      <section id="precios" className="py-24 md:py-40 px-6 bg-white relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-sans font-extrabold text-4xl md:text-5xl text-[#1E2227] mb-6 tracking-tight">Inversión con Retorno Inmediato</h2>
            <p className="font-sans font-normal text-[#787774] text-lg">Pagas según tu flota real. La instalación del hardware GPS está <strong className="text-[#1E2227]">incluida en el alta</strong>.</p>
          </div>


          <div className="bg-[#F6F4EE] border border-[#1E2227] rounded-2xl p-8 md:p-16 shadow-xl max-w-4xl mx-auto grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            
            <div className="flex flex-col gap-8 order-2 md:order-1">
              <div>
                <label className="text-[#1E2227] font-medium text-lg mb-2 block flex justify-between items-center">
                  <span>Tamaño de tu flota</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVehicles(([v]) => [Math.max(1, v - 1)])}
                      className="w-7 h-7 rounded-lg bg-white border border-[#1E2227] flex items-center justify-center text-[#1E2227] hover:bg-[#EAEAEA] transition font-bold text-sm"
                      title="Disminuir vehículos"
                    >
                      -
                    </button>
                    <span className="bg-[#1E2227] text-white text-sm font-mono px-3 py-1 rounded tabular-nums min-w-[100px] text-center">
                      {vehiclesCount >= maxThreshold ? `+${maxThreshold}` : vehiclesCount} {vehiclesCount === 1 ? 'vehículo' : 'vehículos'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVehicles(([v]) => [Math.min(maxThreshold, v + 1)])}
                      className="w-7 h-7 rounded-lg bg-white border border-[#1E2227] flex items-center justify-center text-[#1E2227] hover:bg-[#EAEAEA] transition font-bold text-sm"
                      title="Aumentar vehículos"
                    >
                      +
                    </button>
                  </div>
                </label>
 
                <Slider.Root 
                  className="relative flex items-center select-none touch-none w-full h-5 my-3"
                  value={vehicles}
                  onValueChange={setVehicles}
                  max={maxThreshold}
                  min={1}
                  step={1}
                >
                  <Slider.Track className="bg-[#EAEAEA] relative grow rounded-full h-[6px]">
                    <Slider.Range className="absolute bg-[#1E2227] rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white border-2 border-[#1E2227] rounded-full hover:bg-[#FBFBFA] focus:outline-none focus:ring-4 focus:ring-[#F2B705]/30 shadow-md cursor-grab active:cursor-grabbing transition-colors"
                    aria-label="Vehículos"
                  />
                </Slider.Root>
                <div className="flex justify-between text-[11px] font-mono text-[#787774] mt-1">
                  <span>1 vehículo</span>
                  <span>{Math.round(maxThreshold / 2)} veh.</span>
                  <span>+{maxThreshold} veh.</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-[#1E2227] p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="text-[#346538] mt-0.5 shrink-0" size={18} />
                  <div>
                    <h4 className="text-[#1E2227] font-semibold text-sm">Instalación y GPS en Comodato</h4>
                    <p className="text-[#787774] text-xs mt-0.5">Sin costos de hardware sorpresa. Configuración y alta asistida.</p>
                  </div>
                </div>
                <div className="bg-white border border-[#1E2227] p-4 rounded-xl flex items-start gap-3">
                  <Zap className="text-[#F2B705] mt-0.5 shrink-0" size={18} />
                  <div>
                    <h4 className="text-[#1E2227] font-semibold text-sm">Cobro Exacto por Vehículo</h4>
                    <p className="text-[#787774] text-xs mt-0.5">Escalás o reducís tu plan mes a mes según tu flota real activa.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#1E2227] rounded-xl p-8 md:p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden order-1 md:order-2">
              <div className="text-xs font-mono uppercase tracking-widest text-[#787774] mb-2">{currentTier.type}</div>
              <div className="text-[#1E2227] text-sm mb-6 bg-[#F6F4EE] px-3 py-1 rounded border border-[#1E2227] font-medium">
                {isEnterprise ? `Flota corporativa (+${maxThreshold} vehículos)` : currentTier.label}
              </div>
              
              {!isEnterprise ? (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-mono text-2xl text-[#787774]">$</span>
                    
                    {/* Transición Suave del Precio */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentPrice}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="font-mono font-extrabold text-5xl md:text-6xl text-[#1E2227] tracking-tight tabular-nums"
                      >
                        {new Intl.NumberFormat('es-AR').format(currentPrice)}
                      </motion.span>
                    </AnimatePresence>

                    <span className="text-[#787774] text-sm font-medium ml-1">ARS / mes</span>
                  </div>

                  <div className="text-xs font-mono text-[#787774] mb-6">
                    {vehiclesCount} {vehiclesCount === 1 ? 'unidad' : 'unidades'} × ${new Intl.NumberFormat('es-AR').format(unitPrice)}/mes c/u
                  </div>

                  <div className="w-full flex justify-center items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${!annualMode ? 'text-[#1E2227]' : 'text-[#787774]'}`}>Mes</span>
                      <Switch.Root
                        checked={annualMode}
                        onCheckedChange={setAnnualMode}
                        className="w-12 h-6 bg-[#EAEAEA] rounded-full relative shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E2227] data-[state=checked]:bg-[#1E2227]"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 translate-x-1 data-[state=checked]:translate-x-7" />
                      </Switch.Root>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${annualMode ? 'text-[#1E2227]' : 'text-[#787774]'}`}>Anual</span>
                        <span className="bg-[#E7FFDB] text-[#075E54] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">10% OFF</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="w-full bg-[#F2B705] text-[#1E2227] py-4 rounded-full font-bold hover:bg-[#e0aa04] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(242,183,5,0.4)] transition-all duration-300 text-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Solicitar Cotización</span>
                    <ArrowRight size={18} />
                  </button>
                  <p className="mt-4 text-[11px] text-[#787774] font-mono">
                    {annualMode ? 'Facturación anual bonificada. Contacto directo con un asesor.' : 'Facturación mensual flexible. Contacto directo con un asesor.'}
                  </p>
                </>
              ) : (
                /* Estado Enterprise para +N vehículos */
                <div className="w-full flex flex-col items-center">
                  <div className="mb-2">
                    <span className="font-sans font-extrabold text-4xl md:text-5xl text-[#1E2227] tracking-tight">
                      A Medida
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#075E54] bg-[#E7FFDB] px-3 py-1 rounded-full mb-4 font-semibold">
                    Propuesta Especial por Volumen
                  </div>

                  <p className="text-xs text-[#787774] leading-relaxed mb-6 bg-[#F6F4EE] p-4 rounded-xl border border-[#1E2227]">
                    Para flotas de más de {maxThreshold} vehículos armamos una propuesta personalizada con bonificaciones por volumen, integración directa con tus sistemas y soporte prioritario.
                  </p>

                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="w-full bg-[#1E2227] text-white py-4 rounded-full font-bold hover:bg-[#111] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(30,34,39,0.3)] transition-all duration-300 text-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Contactar para Propuesta</span>
                    <ArrowRight size={18} />
                  </button>
                  <p className="mt-4 text-[11px] text-[#787774] font-mono">
                    Completá el formulario y en breve nos comunicaremos contigo.
                  </p>
                </div>
              )}
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F2B705]/10 rounded-full blur-[40px] pointer-events-none" />
            </div>

          </div>
          
          <div className="mt-12 text-center text-[#787774] text-sm">
            ¿Tenés más de {maxThreshold} vehículos o requerimientos de integración API?{" "}
            <button
              type="button"
              onClick={() => {
                setVehicles([maxThreshold]);
                setQuoteModalOpen(true);
              }}
              className="text-[#1E2227] font-medium underline underline-offset-4 cursor-pointer hover:text-[#000]"
            >
              Hablá con ventas para un plan corporativo a medida
            </button>.
          </div>
        </div>
      </section>

      {/* FAQ Section with Shadcn Accordion */}
      <section id="faq" className="py-24 px-6 bg-[#F6F4EE] border-t border-[#EAEAEA]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-sans font-extrabold text-4xl text-[#1E2227] mb-12 text-center tracking-tight">Preguntas Frecuentes</h2>
          
          <Accordion type="single" collapsible className="w-full bg-white rounded-2xl border border-[#1E2227] shadow-sm p-2">
            {[
              { q: "¿Tengo que comprarles los GPS a ustedes?", a: "No. Si ya tenés un proveedor de rastreo satelital, nos integramos vía API para absorber el kilometraje y posiciones automáticamente. Si no tenés, nosotros te proveemos los equipos en comodato (instalación incluida en el alta)." },
              { q: "¿Cómo se previenen los robos de combustible?", a: "El sistema cruza los litros cargados (vía integración con tarjetas de combustible o carga manual) versus el kilometraje real recorrido por el GPS y el consumo teórico del vehículo. Cualquier anomalía salta en rojo en el dashboard." },
              { q: "¿Hay límite de usuarios para gerentes y despachantes?", a: "No, podés invitar a todo tu equipo operativo y administrativo sin costo extra. TrackOps cobra únicamente por la cantidad de vehículos activos procesando datos." },
              { q: "¿Cuánto tarda la instalación si elijo sus equipos GPS?", a: "La instalación se coordina en un máximo de 72hs hábiles en tu base de operaciones, con técnicos especializados, para que no tengas que mover los camiones de su ruta." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0 border-[#EAEAEA]">
                <AccordionTrigger className="hover:no-underline px-6 py-5 text-left text-base font-semibold text-[#1E2227]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-[#787774] text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E2227] text-white py-24 px-6 border-t border-[#111]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          <div className="max-w-sm">
            <div className="mb-10 opacity-90">
               <img src="/trackopslogo.png" alt="TrackOps" className="h-14 md:h-16 w-auto object-contain object-left filter brightness-0 invert" />
            </div>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Software B2B de rastreo satelital, telemetría y control de gastos logísticos para flotas en Argentina.</p>
          </div>
          
          <div className="flex gap-16 md:gap-32">
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#5C6B74]">Soluciones</h4>
              <a href="#industrias" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Larga Distancia</a>
              <a href="#industrias" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Última Milla</a>
              <a href="#funciones" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Control Combustible</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#5C6B74]">Empresa</h4>
              <PublicSupportDialog />
              <a href="#" className="text-sm text-[#EAEAEA] hover:text-white transition-colors">Contacto Ventas</a>
              <a href="#" className="text-sm text-[#EAEAEA] hover:text-white transition-colors">Términos y Privacidad</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Fixed Button - using Portal to escape any stacking context issues */}
      {mounted && createPortal(
        <AnimatePresence>
          {scrolled && (
            <motion.a 
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              href="https://wa.me/5492916489004?text=Hola%20TrackOps!%20Vengo%20de%20la%20web%20y%20quiero%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20sistema%20para%20mi%20flota." 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] bg-[#25D366] text-white px-5 py-3.5 rounded-full flex items-center gap-3 font-bold shadow-[0_8px_30px_rgba(37,211,102,0.4)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-6 h-6 md:w-7 md:h-7" fill="currentColor">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 414.7c-32.9 0-65.4-8.8-94-25.5l-6.7-4-69.8 18.3L72 334.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-2.2-3.7-.2-5.7 1.2-7.1 1.3-1.3 2.8-3.2 4.1-4.9 1.4-1.6 1.8-2.8 2.8-4.6 1-1.8.5-3.5-.2-4.9-1.9-3.7-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
              <span className="text-base md:text-lg tracking-wide">Cotizá por WhatsApp</span>
            </motion.a>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal de Cotización y Captura de Leads */}
      <QuoteContactModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        vehiclesCount={vehiclesCount}
        tierName={currentTier.type}
        pricePerVehicle={unitPrice}
        totalPrice={isEnterprise ? null : calculatedTotalPrice}
        isAnnual={annualMode}
        isEnterprise={isEnterprise}
        maxThreshold={maxThreshold}
      />

    </div>
  );
}
