"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DniScannerDialog } from "@/components/auth/dni-scanner-dialog";
import { loginWithCredentials } from "./actions";
import { cn } from "@/lib/utils";
import {
  Building2,
  Truck,
  Camera,
  Scan,
  Sparkles,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  CreditCard,
} from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"empresa" | "chofer">("empresa");
  const [email, setEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [dni, setDni] = useState("");
  const [choferPassword, setChoferPassword] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", adminPassword);

    startTransition(async () => {
      const res = await loginWithCredentials(formData);
      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleChoferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("dni", dni);
    formData.append("password", choferPassword || "demo123");

    startTransition(async () => {
      const res = await loginWithCredentials(formData);
      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const fillAdminDemo = (role: "admin" | "empresa") => {
    setErrorMsg(null);
    if (role === "admin") {
      setEmail("admin@test.com");
      setAdminPassword("demo123");
    } else {
      setEmail("empresa@test.com");
      setAdminPassword("demo123");
    }
  };

  const fillChoferDemo = () => {
    setErrorMsg(null);
    setDni("38123456");
    setChoferPassword("demo123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src="/trackopslogo.png"
            alt="TrackOps Logo"
            className="h-12 md:h-14 w-auto mb-3 object-contain dark:brightness-0 dark:invert transition-all"
          />
          <h1 className="text-xl font-bold tracking-tight text-foreground">TrackOps Flota</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plataforma B2B de Gestión de Flotas, Choferes y Viajes
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-xs">
              Seleccione su perfil de acceso para ingresar a la plataforma.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as "empresa" | "chofer");
                setErrorMsg(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="empresa" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa / Admin
                </TabsTrigger>
                <TabsTrigger value="chofer" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Chofer (DNI)
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: EMPRESA / ADMIN */}
              <TabsContent
                value="empresa"
                forceMount
                className={cn("space-y-4 focus-visible:outline-none", activeTab !== "empresa" && "hidden")}
              >
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@test.com o tu@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-9 bg-card text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-admin" className="text-xs font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password-admin"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="pl-9 bg-card text-sm"
                      />
                    </div>
                  </div>

                  {errorMsg && activeTab === "empresa" && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Entrar como Empresa / Admin"
                    )}
                  </Button>

                  {/* Fast demo presets */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 text-center">
                      Acceso rápido de demostración:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillAdminDemo("admin")}
                        className="text-xs h-8"
                      >
                        <Sparkles className="mr-1 h-3 w-3 text-amber-500" />
                        Demo SuperAdmin
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillAdminDemo("empresa")}
                        className="text-xs h-8"
                      >
                        <Sparkles className="mr-1 h-3 w-3 text-primary" />
                        Demo Empresa
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {/* TAB 2: CHOFER */}
              <TabsContent
                value="chofer"
                forceMount
                className={cn("space-y-4 focus-visible:outline-none", activeTab !== "chofer" && "hidden")}
              >
                <form onSubmit={handleChoferSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dni" className="text-xs font-medium">
                        Número de DNI
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setScannerOpen(true)}
                        className="h-6 px-2 text-xs text-primary hover:text-primary/90 flex items-center gap-1"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Escanear DNI
                      </Button>
                    </div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dni"
                          name="dni"
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej: 38123456"
                          value={dni}
                          onChange={(e) => setDni(e.target.value)}
                          required
                          className="pl-9 bg-card text-sm font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setScannerOpen(true)}
                        className="shrink-0 flex items-center gap-1.5"
                        title="Abrir escáner de DNI con cámara o lector de código de barras"
                      >
                        <Scan className="h-4 w-4 text-primary" />
                        <span className="hidden sm:inline text-xs">Escanear</span>
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ingrese los 7 u 8 dígitos de su Documento Nacional de Identidad.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-chofer" className="text-xs font-medium">
                      Contraseña / PIN
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password-chofer"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={choferPassword}
                        onChange={(e) => setChoferPassword(e.target.value)}
                        className="pl-9 bg-card text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Para la versión demo, puede dejar la contraseña predeterminada.
                    </p>
                  </div>

                  {errorMsg && activeTab === "chofer" && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-primary" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      "Entrar como Chofer"
                    )}
                  </Button>

                  {/* Fast demo Chofer */}
                  <div className="pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillChoferDemo}
                      className="w-full text-xs h-8 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Usar DNI Demo Chofer (38.123.456)
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* DNI Scanner Dialog */}
        <DniScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onDniScanned={(scannedDni) => {
            setDni(scannedDni);
            if (!choferPassword) {
              setChoferPassword("demo123");
            }
          }}
        />
      </div>
    </div>
  );
}
