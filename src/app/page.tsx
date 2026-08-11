"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { ArrowRight, Activity, Map, Phone, Users, Shield, Zap, CheckCircle2, ChevronDown, Anchor, Truck, Package, Globe, Briefcase, XCircle, Plus, Minus, Bell, Database, CheckCheck, Clock, Gauge, Fuel } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import LogoLoop from "@/components/LogoLoop";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const PRICING_TIERS = [
  { max: 5, priceNumber: 39990, label: "Hasta 5 vehículos", type: "Plan Inicial" },
  { max: 15, priceNumber: 64900, label: "6 a 15 vehículos", type: "Flota en Crecimiento" },
  { max: 30, priceNumber: 99900, label: "16 a 30 vehículos", type: "Flota Consolidada" },
  { max: 50, priceNumber: 149900, label: "31 a 50 vehículos", type: "Operación Masiva" }
];

const LOGOS_CONFIANZA = [
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Truck size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">TransPort</span></div>, title: "TransPort" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Package size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Logística Sur</span></div>, title: "Logística Sur" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Globe size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Vía Rápida</span></div>, title: "Vía Rápida" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Anchor size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Puerto Cargas</span></div>, title: "Puerto Cargas" },
  { node: <div className="flex gap-2 items-center text-[#787774] opacity-50 hover:opacity-100 transition-opacity"><Briefcase size={24} /> <span className="font-semibold text-lg font-sans tracking-tight">Expreso Federal</span></div>, title: "Expreso Federal" },
];

export default function LandingPage() {
  const heroTextRef = useRef(null);
  
  // Slider state
  const [vehicles, setVehicles] = useState([10]);
  const [annualMode, setAnnualMode] = useState(false);
  const [prevPrice, setPrevPrice] = useState(0);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentTier = vehicles[0] <= 5 ? PRICING_TIERS[0] 
                    : vehicles[0] <= 15 ? PRICING_TIERS[1]
                    : vehicles[0] <= 30 ? PRICING_TIERS[2]
                    : PRICING_TIERS[3];

  const calculatedPrice = annualMode ? Math.round(currentTier.priceNumber * 0.9) : currentTier.priceNumber;
  const [currentPrice, setCurrentPrice] = useState(calculatedPrice);

  useEffect(() => {
    if (calculatedPrice !== currentPrice) {
      setPrevPrice(currentPrice);
      setCurrentPrice(calculatedPrice);
    }
  }, [calculatedPrice, currentPrice]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
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

    gsap.to(".floating-element", {
      y: -5,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.2
    });

    // Animate map vehicle INSIDE SVG perfectly mapped
    gsap.to(".map-vehicle", {
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

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFA] selection:bg-[#F2B705] selection:text-[#111]">
      {/* Floating Pill Navbar */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <header className="bg-white/80 backdrop-blur-xl border border-[#EAEAEA] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6 py-3 w-full max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm border border-[#EAEAEA]">
              <Image src="/trackopslogo.png" alt="TrackOps" fill className="object-contain p-1" />
            </div>
            <span className="font-semibold tracking-tight text-[#111]">TRACKOPS</span>
          </Link>
          
          <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-[#787774]">
            <div className="relative group/nav">
              <button className="flex items-center gap-1 hover:text-[#111] transition-colors py-2">
                Soluciones <ChevronDown size={14} className="group-hover/nav:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200">
                <div className="bg-white border border-[#EAEAEA] rounded-xl shadow-xl p-2 w-64 flex flex-col gap-1">
                  <a href="#funciones" className="p-3 rounded-lg hover:bg-[#FBFBFA] transition-colors flex flex-col">
                    <span className="text-[#111] font-medium">Tracking Satelital</span>
                    <span className="text-xs text-[#787774]">Control de ubicación en vivo</span>
                  </a>
                  <a href="#funciones" className="p-3 rounded-lg hover:bg-[#FBFBFA] transition-colors flex flex-col">
                    <span className="text-[#111] font-medium">Gestión de Logística</span>
                    <span className="text-xs text-[#787774]">Rutas y geocercas automáticas</span>
                  </a>
                </div>
              </div>
            </div>
            
            <a href="#como-funciona" className="hover:text-[#111] transition-colors py-2">Cómo funciona</a>
            <a href="#precios" className="hover:text-[#111] transition-colors py-2">Precios</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-[#787774] hover:text-[#111] transition-colors">
              Ingresar
            </Link>
            <a href="#precios" className="bg-[#F2B705] text-[#111] text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#e0aa00] transition-transform hover:scale-105 shadow-sm">
              Cotizar ahora
            </a>
          </div>
        </header>
      </div>

      {/* Hero Premium Section */}
      <main className="pt-40 md:pt-48 pb-10 px-6 relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#F2B705]/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div ref={heroTextRef} className="max-w-5xl w-full text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white shadow-sm text-[#787774] text-xs font-mono uppercase tracking-widest rounded-full mb-8 border border-[#EAEAEA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#346538] animate-pulse" />
            Plataforma Integral de Gestión de Flotas
          </div>
          
          <h1 className="font-[var(--font-playfair)] text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.1] tracking-tight text-[#111] mb-6 max-w-4xl mx-auto">
            Visibilidad logística total y control satelital en tiempo real.
          </h1>
          
          <p className="text-lg md:text-xl text-[#787774] max-w-2xl mx-auto mb-10 leading-relaxed">
            Centralizá el monitoreo de tus vehículos, controlá desvíos y optimizá las rutas de tus choferes. Tu flota entera en una sola pantalla.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#precios" className="bg-[#F2B705] text-[#111] px-8 py-4 rounded-full font-bold hover:bg-[#e0aa00] hover:scale-[0.98] transition-all w-full sm:w-auto shadow-[0_0_30px_rgba(242,183,5,0.4)] flex items-center justify-center gap-2">
              Empezar 14 días gratis <ArrowRight size={18} />
            </a>
          </div>
          <p className="mt-5 text-xs text-[#787774] font-mono">Sin tarjeta de crédito. Instalación GPS incluida.</p>
        </div>

        {/* Hero Dynamic Dashboard Mockup */}
        <div className="hero-dashboard mt-16 w-full max-w-5xl relative z-10 h-[450px] perspective-1000">
          <div className="w-full h-full bg-white border border-[#EAEAEA] rounded-t-2xl shadow-2xl overflow-hidden relative flex flex-col">
            <div className="h-10 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center px-4 gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
              <div className="ml-auto w-32 h-4 bg-[#EAEAEA] rounded" />
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row bg-[#F6F4EE] relative overflow-hidden">
              {/* Left Sidebar (Metrics) */}
              <div className="w-full md:w-1/3 bg-white/80 backdrop-blur border-r border-[#EAEAEA] p-6 flex flex-col gap-4 z-10 shrink-0 overflow-y-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-[#111] text-white flex items-center justify-center"><Truck size={16} /></div>
                  <div>
                    <div className="text-[#111] font-semibold text-sm">Volvo FH 460</div>
                    <div className="text-[#787774] text-xs font-mono">Patente: AC 345 FG</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Map size={16} /> <span className="text-sm">Ruta</span></div>
                    <div className="text-[#111] font-medium text-sm">CABA <ArrowRight size={12} className="inline mx-1"/> Rosario</div>
                  </div>
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Package size={16} /> <span className="text-sm">Carga</span></div>
                    <div className="text-[#111] font-medium text-sm">24.5 Toneladas</div>
                  </div>
                  <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#787774]"><Users size={16} /> <span className="text-sm">Chofer</span></div>
                    <div className="text-[#111] font-medium text-sm">M. Rossi</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-[#E1F3FE]/30 border border-[#E1F3FE] rounded-lg p-3 text-center">
                      <Gauge className="mx-auto mb-1 text-[#1F6C9F]" size={16} />
                      <div className="text-[#111] font-semibold">82 km/h</div>
                      <div className="text-xs text-[#787774]">Velocidad</div>
                    </div>
                    <div className="bg-[#FDEBEC]/30 border border-[#FDEBEC] rounded-lg p-3 text-center">
                      <Fuel className="mx-auto mb-1 text-[#9F2F2D]" size={16} />
                      <div className="text-[#111] font-semibold">45 L</div>
                      <div className="text-xs text-[#787774]">Consumo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Map Area */}
              <div className="flex-1 relative bg-[#E9E5DD]">
                <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                  
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
                  <circle cx="100" cy="550" r="8" fill="#111" stroke="#FFF" strokeWidth="3" />
                  <circle cx="700" cy="100" r="10" fill="#F2B705" stroke="#FFF" strokeWidth="3" />
                  <circle cx="700" cy="100" r="4" fill="#111" />

                  {/* Moving Vehicle Dot - Inside SVG to guarantee GSAP motionPath alignment */}
                  <g className="map-vehicle text-white">
                    <circle cx="0" cy="0" r="14" fill="#111" stroke="#FFF" strokeWidth="2" />
                    <Truck size={12} color="white" x="-6" y="-6" />
                  </g>
                </svg>
                
                {/* Map UI overlays */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded shadow-sm border border-[#EAEAEA] p-2 text-xs font-mono text-[#111] flex items-center gap-2 z-20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> GPS Activo
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confían en Nosotros (LogoLoop) */}
      <section className="py-12 border-y border-[#EAEAEA] bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#787774]">Empresas de logística y transporte que ya confían</p>
        </div>
        <LogoLoop
          logos={LOGOS_CONFIANZA}
          speed={60}
          direction="left"
          logoHeight={30}
          gap={80}
          fadeOut
          fadeOutColor="#ffffff"
        />
      </section>

      {/* Problema vs Solución (El Caos vs El Control) */}
      <section className="py-24 md:py-32 px-6 bg-[#FBFBFA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[var(--font-playfair)] text-4xl md:text-5xl text-[#111] mb-6">Dejá de perder dinero por puntos ciegos.</h2>
            <p className="text-[#787774] text-lg max-w-2xl mx-auto">Manejar una flota con herramientas improvisadas es el camino más corto hacia desvíos de ruta, robos de combustible y descontrol logístico.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* El Caos */}
            <div className="reveal-up bg-white border border-[#EAEAEA] rounded-2xl p-8 md:p-12 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#9F2F2D]" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#FDEBEC] rounded-full flex items-center justify-center text-[#9F2F2D]"><XCircle size={20} /></div>
                <h3 className="text-2xl font-medium text-[#111]">La forma vieja</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start text-[#787774]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EAEAEA] mt-2 shrink-0" />
                  <p>Llamadas constantes a los choferes para saber "por dónde andan" y demoras sin justificación.</p>
                </li>
                <li className="flex gap-4 items-start text-[#787774]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EAEAEA] mt-2 shrink-0" />
                  <p>Robos de combustible, desvíos no autorizados y paradas en zonas peligrosas.</p>
                </li>
                <li className="flex gap-4 items-start text-[#787774]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EAEAEA] mt-2 shrink-0" />
                  <p>Falta de evidencia visual ante clientes sobre el estado de sus entregas y demoras.</p>
                </li>
              </ul>
            </div>

            {/* El Control */}
            <div className="reveal-up bg-[#111] border border-[#2F3437] rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden text-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#346538]" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#EDF3EC]/10 rounded-full flex items-center justify-center text-[#EDF3EC]"><CheckCircle2 size={20} /></div>
                <h3 className="text-2xl font-medium">La forma TrackOps</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start text-[#A1A1AA]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#333] mt-2 shrink-0" />
                  <p><strong className="text-white font-medium">Monitoreo en vivo</strong> para ver exactamente la ubicación, ruta y velocidad de cada unidad en el mapa.</p>
                </li>
                <li className="flex gap-4 items-start text-[#A1A1AA]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#333] mt-2 shrink-0" />
                  <p><strong className="text-white font-medium">Escudo de seguridad</strong>. Alertas directas al WhatsApp por excesos de velocidad o desvíos de la ruta planificada.</p>
                </li>
                <li className="flex gap-4 items-start text-[#A1A1AA]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#333] mt-2 shrink-0" />
                  <p><strong className="text-white font-medium">Historial de recorridos</strong>. Auditoría total e inmutable de tiempos de parada y velocidades.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-24 md:py-32 px-6 bg-white border-t border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto text-center mb-24">
          <div className="text-xs font-mono uppercase tracking-widest text-[#F2B705] mb-6">Tres simples pasos</div>
          <h2 className="font-[var(--font-playfair)] text-4xl md:text-5xl lg:text-6xl text-[#111] mb-10 leading-tight">
            Tu flota queda bajo<br />control absoluto.
          </h2>
          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-2xl p-8 md:p-12 shadow-sm relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
              <Zap className="text-[#F2B705]" size={24} />
            </div>
            <p className="text-[#111] text-xl md:text-2xl font-medium leading-relaxed">
              "No hace falta instalar hardware para arrancar. Cargás lo que tenés hoy y sumás GPS cuando quieras. Todo centralizado. <span className="text-[#346538]">Instalación incluida en tu plan.</span>"
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative">
          {/* Línea amarilla simulando ruta */}
          <div className="absolute top-[48px] left-[15%] w-[70%] h-4 hidden md:block z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1000 20" preserveAspectRatio="none">
              <path d="M0,10 Q250,20 500,10 T1000,10" fill="none" stroke="#F2B705" strokeWidth="4" strokeDasharray="15 15" className="opacity-50" />
            </svg>
          </div>
          {[
            { num: "01", title: "Cargá tu flota", desc: "Patente, marca y km inicial de cada vehículo. Cinco minutos por unidad, o subí un Excel masivo." },
            { num: "02", title: "Definí las geocercas", desc: "Marcá zonas de interés (depósitos, clientes, zonas peligrosas) o reglas de velocidad máxima permitida." },
            { num: "03", title: "Recibí los avisos", desc: "Por WhatsApp directo al despachante si hay un desvío, retraso o llegada a destino. Operativa sincronizada." }
          ].map((step, i) => (
            <div key={i} className="reveal-up bg-[#FBFBFA] border border-[#EAEAEA] rounded-xl p-8 hover:border-[#111] transition-colors group relative z-10">
              <div className="w-12 h-12 bg-white border border-[#EAEAEA] group-hover:bg-[#111] group-hover:text-white transition-colors text-[#111] rounded-full flex items-center justify-center font-mono text-lg font-bold mb-6">
                {step.num}
              </div>
              <h3 className="text-xl font-medium text-[#111] mb-3">{step.title}</h3>
              <p className="text-[#787774] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resumen Completo de Funcionalidades */}
      <section className="py-24 bg-[#FBFBFA] border-t border-[#EAEAEA] px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[var(--font-playfair)] text-4xl text-[#111] mb-4">Todo el arsenal a tu disposición</h2>
            <p className="text-[#787774]">Un paneo rápido de todas las herramientas incluidas en la plataforma.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: <Map size={20} />, title: "Tracking Satelital", desc: "Ubicación exacta 24/7." },
              { icon: <Shield size={20} />, title: "Control Antirrobo", desc: "Alertas por desvíos o paradas." },
              { icon: <Activity size={20} />, title: "Velocidad Máxima", desc: "Auditoría en ruta en tiempo real." },
              { icon: <Users size={20} />, title: "Multiusuario", desc: "Gerentes y despachantes conectados." },
              { icon: <Phone size={20} />, title: "Bot de WhatsApp", desc: "Notificaciones directas sin usar la app." },
              { icon: <Database size={20} />, title: "Historial Logístico", desc: "Playbacks de rutas pasadas." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white border border-[#EAEAEA] p-6 rounded-xl flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#FBFBFA] rounded-full border border-[#EAEAEA] flex items-center justify-center text-[#111]">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-[#111] mb-1">{feature.title}</h4>
                  <p className="text-sm text-[#787774]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Gapless Bento Grid */}
      <section id="funciones" className="py-24 md:py-48 px-6 bg-[#111] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="font-[var(--font-playfair)] text-4xl md:text-5xl lg:text-6xl mb-6">Control total.<br />Sin puntos ciegos.</h2>
              <p className="text-[#A1A1AA] text-lg max-w-xl">No dependas de que el chofer te conteste. TrackOps centraliza la ubicación, la telemetría y los tiempos de entrega en un solo tablero.</p>
            </div>
            <a href="#precios" className="text-white border border-[#333] px-6 py-3 rounded-full hover:bg-[#222] transition-colors whitespace-nowrap text-center">
              Ver planes de precios
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 grid-flow-dense">
            
            <div className="reveal-up bento-card col-span-1 md:col-span-2 row-span-2 bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 md:p-10 flex flex-col overflow-hidden relative group">
              <div className="relative z-10 mb-8">
                <div className="w-12 h-12 bg-[#FDEBEC]/10 rounded flex items-center justify-center mb-6 text-[#FDEBEC]">
                  <Zap size={24} />
                </div>
                <h3 className="text-2xl font-medium mb-4">Alertas operativas omnicanal</h3>
                <p className="text-[#A1A1AA] max-w-md">Creá reglas por exceso de velocidad, o entradas a geocercas. Recibí el aviso crítico directamente en tu WhatsApp.</p>
              </div>
              
              {/* WhatsApp UI Redesign */}
              <div className="mt-auto relative z-10 pl-4 w-[90%] md:w-[80%] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="bg-[#E7FFDB] text-[#111] rounded-2xl rounded-tl-sm p-4 relative shadow-sm border border-[#d3f5c1]">
                  {/* WhatsApp tail */}
                  <svg viewBox="0 0 8 13" className="absolute top-0 -left-[7px] w-2 h-3 text-[#E7FFDB]"><path d="M5.188 1H0v11.142c0 .873.582.497.582.497l4.606-4.225V1Z" fill="currentColor"/></svg>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-[#075E54]">TrackOps Bot</span>
                    <span className="text-[10px] text-gray-500 font-medium">10:42</span>
                  </div>
                  <p className="text-sm leading-snug">
                    ⚠️ <strong>Alerta Operativa</strong><br/>
                    El vehículo <strong>AC 345 FG</strong> superó el límite de velocidad en <em>Ruta 9 (110 km/h)</em>.<br/><br/>
                    <em>Chofer: M. Rossi</em>
                  </p>
                  <div className="flex justify-end mt-1">
                    <CheckCheck size={14} className="text-[#34B7F1]" />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9F2F2D]/20 rounded-full blur-[80px] -z-0" />
            </div>

            <div className="reveal-up bento-card col-span-1 md:col-span-2 row-span-1 bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 flex justify-between overflow-hidden relative group">
              <div className="relative z-10 w-2/3">
                <div className="w-10 h-10 bg-[#E1F3FE]/10 rounded flex items-center justify-center mb-6 text-[#E1F3FE]">
                  <Map size={20} />
                </div>
                <h3 className="text-xl font-medium mb-3">Conexión GPS Nativa</h3>
                <p className="text-[#A1A1AA] text-sm">Sumá el kilometraje automático de tu proveedor de rastreo actual, o usá los nuestros. Mapa en vivo.</p>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 bg-[#0F0F0F] border-l border-[#333] flex items-center justify-center relative overflow-hidden">
                {/* SVG Route Mini Map */}
                <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 0 80 Q 50 60 100 20" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
                <div className="w-4 h-4 bg-[#E1F3FE] rounded-full shadow-[0_0_15px_rgba(225,243,254,0.8)] z-10 animate-pulse relative">
                  <div className="absolute -inset-2 rounded-full border border-[#E1F3FE]/50 animate-ping" />
                </div>
              </div>
            </div>

            <div className="reveal-up bento-card col-span-1 md:col-span-1 row-span-1 bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 relative overflow-hidden group">
               <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center mb-6 text-white">
                  <Shield size={20} />
                </div>
              <h3 className="text-lg font-medium mb-3">Historial Logístico</h3>
              <p className="text-[#A1A1AA] text-sm">Reproducí el trayecto exacto de cualquier día. Rutas, paradas y velocidades.</p>
            </div>

            <div className="reveal-up bento-card col-span-1 md:col-span-1 row-span-1 bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 relative overflow-hidden group">
               <div className="w-10 h-10 bg-[#FBF3DB]/10 rounded flex items-center justify-center mb-6 text-[#FBF3DB]">
                  <Users size={20} />
                </div>
              <h3 className="text-lg font-medium mb-3">Multiusuario</h3>
              <p className="text-[#A1A1AA] text-sm">Despachantes, gerentes y seguridad en un solo sistema sincronizado.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Pricing Quoter with CountUp */}
      <section id="precios" className="py-24 md:py-40 px-6 bg-white relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[var(--font-playfair)] text-4xl md:text-5xl text-[#111] mb-6">Cotizador Automático</h2>
            <p className="text-[#787774] text-lg">Pagas según tu flota real. La instalación del hardware GPS está <strong className="text-[#111]">incluida</strong>.</p>
          </div>

          <div className="flex justify-center items-center mb-12">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${!annualMode ? 'text-[#111]' : 'text-[#787774]'}`}>Mensual</span>
              <Switch.Root
                checked={annualMode}
                onCheckedChange={setAnnualMode}
                className="w-14 h-7 bg-[#EAEAEA] rounded-full relative shadow-inner focus:outline-none focus:ring-2 focus:ring-[#111] data-[state=checked]:bg-[#111]"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 translate-x-1 data-[state=checked]:translate-x-8" />
              </Switch.Root>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${annualMode ? 'text-[#111]' : 'text-[#787774]'}`}>Anual</span>
                <span className="bg-[#E7FFDB] text-[#075E54] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">10% OFF</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-2xl p-8 md:p-16 shadow-xl max-w-4xl mx-auto grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            
            <div className="flex flex-col gap-8">
              <div>
                <label className="text-[#111] font-medium text-lg mb-2 block flex justify-between items-center">
                  <span>Tamaño de tu flota</span>
                  <span className="bg-[#111] text-white text-sm font-mono px-3 py-1 rounded">
                    {vehicles[0] === 50 ? '+50' : vehicles[0]} {vehicles[0] === 1 ? 'vehículo' : 'vehículos'}
                  </span>
                </label>
                <p className="text-[#787774] text-sm mb-8">Desliza para calcular el valor mensual (máx 50 online).</p>
                
                <Slider.Root 
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={vehicles}
                  onValueChange={setVehicles}
                  max={50}
                  min={1}
                  step={1}
                >
                  <Slider.Track className="bg-[#EAEAEA] relative grow rounded-full h-[6px]">
                    <Slider.Range className="absolute bg-[#111] rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white border-2 border-[#111] rounded-full hover:bg-[#FBFBFA] focus:outline-none focus:ring-4 focus:ring-[#F2B705]/30 shadow-md cursor-grab active:cursor-grabbing transition-colors"
                    aria-label="Vehículos"
                  />
                </Slider.Root>
              </div>

              <div className="bg-white border border-[#EAEAEA] p-4 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="text-[#346538] mt-0.5" size={18} />
                <div>
                  <h4 className="text-[#111] font-medium text-sm">Instalación y Equipos GPS Incluidos</h4>
                  <p className="text-[#787774] text-xs mt-1">Sin costos de alta sorpresa. Solo la suscripción.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-8 md:p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
              <div className="text-xs font-mono uppercase tracking-widest text-[#787774] mb-2">{currentTier.type}</div>
              <div className="text-[#111] text-sm mb-6 bg-[#FBFBFA] px-3 py-1 rounded border border-[#EAEAEA]">{currentTier.label}</div>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-mono text-2xl text-[#787774]">$</span>
                
                {/* Transición Suave del Precio */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentPrice}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="font-[var(--font-playfair)] text-5xl md:text-6xl font-medium text-[#111]"
                  >
                    {new Intl.NumberFormat('es-AR').format(currentPrice)}
                  </motion.span>
                </AnimatePresence>

                <span className="text-[#787774] text-sm font-medium ml-1">ARS / mes</span>
              </div>
              
              <a href="#" className="w-full bg-[#F2B705] text-[#111] py-4 rounded-full font-bold hover:bg-[#e0aa00] transition-colors shadow-[0_0_30px_rgba(242,183,5,0.3)] text-lg">
                Empezar prueba gratis
              </a>
              <p className="mt-4 text-[11px] text-[#787774] font-mono">
                {annualMode ? 'Facturación anual. 14 días de prueba.' : '14 días de prueba. Cancelás cuando quieras.'}
              </p>
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F2B705]/10 rounded-full blur-[40px] pointer-events-none" />
            </div>

          </div>
          
          <div className="mt-12 text-center text-[#787774] text-sm">
            ¿Tenés más de 50 vehículos? <a href="#" className="text-[#111] font-medium underline underline-offset-4">Hablá con ventas para un plan a medida</a>.
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-[#FBFBFA] border-t border-[#EAEAEA]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-[var(--font-playfair)] text-4xl text-[#111] mb-12 text-center">Preguntas Frecuentes</h2>
          
          <div className="flex flex-col gap-4">
            {[
              { q: "¿Tengo que comprarles los GPS a ustedes?", a: "No. Si ya tenés un proveedor de rastreo satelital, nos integramos con ellos para absorber el kilometraje automáticamente. Si no tenés, nosotros te proveemos los equipos en comodato (instalación incluida)." },
              { q: "¿Cómo funcionan las alertas por WhatsApp?", a: "Configurás reglas operativas (por ejemplo, si un camión sale de CABA, o si supera los 90km/h). Apenas ocurre el evento, el sistema te envía un mensaje automático al WhatsApp." },
              { q: "¿Hay límite de usuarios?", a: "No, podés invitar a todos tus gerentes, guardias y despachantes sin costo extra. Cobramos únicamente por la cantidad de vehículos activos en la plataforma." },
              { q: "¿Cuánto tarda la instalación si elijo sus equipos?", a: "La instalación se coordina en un máximo de 72hs hábiles en tu base de operaciones, para que no tengas que mover los camiones." }
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-[#EAEAEA] rounded-lg overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-medium text-[#111]">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {openFaq === i ? <Minus size={18} className="text-[#787774] shrink-0" /> : <Plus size={18} className="text-[#787774] shrink-0" />}
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-6 text-[#787774] leading-relaxed overflow-hidden"
                    >
                      <div className="pb-5">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] text-white py-24 px-6 border-t border-[#222]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded">
                 <Image src="/trackopslogo.png" alt="TrackOps" fill className="object-contain p-1" />
              </div>
              <span className="font-semibold tracking-tight text-white">TRACKOPS</span>
            </div>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Tecnología de rastreo y control logístico en tiempo real para flotas en Argentina.</p>
          </div>
          
          <div className="flex gap-16 md:gap-32">
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#5C6B74]">Producto</h4>
              <a href="#como-funciona" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Cómo funciona</a>
              <a href="#funciones" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Funciones</a>
              <a href="#precios" className="text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors">Precios</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#5C6B74]">Empresa</h4>
              <a href="#" className="text-sm text-[#EAEAEA] hover:text-white transition-colors">Contacto</a>
              <a href="#" className="text-sm text-[#EAEAEA] hover:text-white transition-colors">Términos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
