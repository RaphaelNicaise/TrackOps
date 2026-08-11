import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Map, Navigation } from "lucide-react";

export default async function GpsPage() {
  const session = await auth();
  
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rastreo Satelital</h1>
          <p className="text-muted-foreground mt-2">Monitoreo en tiempo real de tu flota.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
        {/* Sidebar Vehículos */}
        <div className="w-full md:w-80 border rounded-lg bg-card p-4 flex flex-col gap-4">
           <h3 className="font-semibold border-b pb-2">Unidades Activas</h3>
           <div className="flex gap-2 text-sm flex-wrap">
             <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">En marcha (2)</span>
             <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Detenido (1)</span>
             <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">Sin señal (0)</span>
           </div>
           
           <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-2">
              <div className="p-3 border rounded flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                 <div>
                   <p className="font-semibold">AA123BB</p>
                   <p className="text-xs text-muted-foreground">Ford F-150</p>
                 </div>
                 <Navigation className="h-4 w-4 text-green-600" />
              </div>
              <div className="p-3 border rounded flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                 <div>
                   <p className="font-semibold">CC456DD</p>
                   <p className="text-xs text-muted-foreground">Ford Cargo 1722</p>
                 </div>
                 <Navigation className="h-4 w-4 text-green-600" />
              </div>
              <div className="p-3 border rounded flex justify-between items-center bg-slate-50 opacity-60">
                 <div>
                   <p className="font-semibold">AB987XY</p>
                   <p className="text-xs text-muted-foreground">Sprinter</p>
                 </div>
                 <div className="h-2 w-2 rounded-full bg-slate-400" />
              </div>
           </div>
        </div>

        {/* Mapa Mock */}
        <div className="flex-1 border rounded-lg bg-slate-100 flex items-center justify-center relative overflow-hidden min-h-[400px]">
           {/* Fallback pattern for map */}
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
           
           {/* Mock Markers */}
           <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
             <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow mb-1">AA123BB (60km/h)</div>
             <Navigation className="h-6 w-6 text-primary drop-shadow rotate-45" fill="currentColor"/>
           </div>

           <div className="absolute top-1/2 right-1/3 flex flex-col items-center">
             <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow mb-1">CC456DD (80km/h)</div>
             <Navigation className="h-6 w-6 text-primary drop-shadow -rotate-12" fill="currentColor"/>
           </div>
           
           <div className="z-10 flex flex-col items-center p-6 bg-white/90 rounded-lg shadow-lg backdrop-blur-sm max-w-sm text-center border border-border mx-4">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Map className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-semibold text-lg mb-2">Módulo de Rastreo</h2>
              <p className="text-sm text-muted-foreground">
                La integración real con la API del proveedor GPS (ej. Wialon) se implementará en la próxima fase.
                <br/><br/>
                Esta interfaz gráfica representa cómo se visualizarán las unidades transmitiendo en tiempo real sobre cartografía vectorial.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
