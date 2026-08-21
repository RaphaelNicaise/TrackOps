"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Scan, QrCode, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Extracts a 7-8 digit Argentine DNI number from a barcode scan,
 * PDF417 raw text, dot-separated number, or plain text.
 */
export function parseDni(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Argentine PDF417 format: fields separated by '@'
  // Example: 00123456789@PEREZ@JUAN CARLOS@M@38123456@A@15/04/1994@...
  if (trimmed.includes("@")) {
    const parts = trimmed.split("@");

    // Look for parts that contain the document number
    for (const part of parts) {
      const clean = part.replace(/\D/g, "");
      const withoutLeadingZeros = clean.replace(/^0+/, "");
      if (withoutLeadingZeros.length >= 7 && withoutLeadingZeros.length <= 8) {
        return withoutLeadingZeros;
      }
    }

    for (const part of parts) {
      const match = part.match(/\d{7,8}/);
      if (match) return match[0];
    }
  }

  // 2. Formatted number with dots or spaces (e.g. 38.123.456 or 38 123 456)
  const digitsOnly = trimmed.replace(/\D/g, "");
  const withoutLeadingZeros = digitsOnly.replace(/^0+/, "");
  if (withoutLeadingZeros.length >= 7 && withoutLeadingZeros.length <= 8) {
    return withoutLeadingZeros;
  }
  if (digitsOnly.length >= 7 && digitsOnly.length <= 8) {
    return digitsOnly;
  }

  // 3. Any 7-8 digit sequence
  const match = trimmed.match(/\b\d{7,8}\b/) || trimmed.match(/\d{7,8}/);
  if (match) {
    return match[0];
  }

  return null;
}

export interface DniScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDniScanned: (dni: string) => void;
}

export function DniScannerDialog({
  open,
  onOpenChange,
  onDniScanned,
}: DniScannerDialogProps) {
  const [manualInput, setManualInput] = useState("");
  const [detectedDni, setDetectedDni] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setManualInput("");
      setDetectedDni(null);
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleInputChange = (val: string) => {
    setManualInput(val);
    setErrorMessage(null);
    const parsed = parseDni(val);
    setDetectedDni(parsed);
  };

  const handleConfirmDni = (dniToUse?: string) => {
    const finalDni = dniToUse || detectedDni || parseDni(manualInput);
    if (finalDni) {
      stopCamera();
      onDniScanned(finalDni);
      onOpenChange(false);
    } else {
      setErrorMessage("No se pudo detectar un número de DNI válido (7 u 8 dígitos).");
    }
  };

  const handleDemoClick = () => {
    const demoDni = "38123456";
    stopCamera();
    onDniScanned(demoDni);
    onOpenChange(false);
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage("La cámara no está soportada en este navegador.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("No se pudo acceder a la cámara:", err);
      setErrorMessage("No se pudo acceder a la cámara. Por favor ingrese o pegue el código manualmente.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Escanear DNI de Chofer
          </DialogTitle>
          <DialogDescription>
            Apunta con la cámara al código de barras del DNI argentino o pega la lectura del escáner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Camera Viewfinder Area */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted flex flex-col items-center justify-center text-center p-4">
            {isCameraActive ? (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover rounded"
                  playsInline
                  muted
                />
                {/* Laser animation overlay */}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-10 w-10 stroke-1" />
                <p className="text-xs">Cámara inactiva o escáner óptico listo</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={startCamera}
                  className="mt-1"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Activar Cámara
                </Button>
              </div>
            )}
          </div>

          {/* Quick Demo DNI Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoClick}
            className="w-full justify-center border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium text-xs h-9"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Usar DNI Demo Chofer (38.123.456)
          </Button>

          {/* Manual barcode input */}
          <div className="space-y-2">
            <Label htmlFor="barcode-input" className="text-xs font-semibold">
              Lectura de Escáner o Código de Barras (PDF417 / DNI)
            </Label>
            <div className="flex gap-2">
              <Input
                id="barcode-input"
                placeholder="Pega el código @APELLIDO@NOMBRE@... o DNI"
                value={manualInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-xs font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmDni();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleConfirmDni()}
                disabled={!detectedDni && !manualInput.trim()}
              >
                Procesar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Acepta formato nativo del código de barras argentino, DNI con puntos o número directo.
            </p>
          </div>

          {/* Result / feedback */}
          {detectedDni && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div className="flex-1 font-medium">
                DNI Detectado: <span className="font-mono font-bold text-sm">{detectedDni}</span>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleConfirmDni(detectedDni)}
              >
                Aplicar
              </Button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {detectedDni && (
            <Button
              type="button"
              onClick={() => handleConfirmDni(detectedDni)}
            >
              Usar DNI {detectedDni}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
