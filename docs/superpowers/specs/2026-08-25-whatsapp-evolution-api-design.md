# Especificación de Diseño: Integración de WhatsApp con Evolution API

**Fecha:** 2026-08-25  
**Estado:** En Revisión  
**Autor:** Antigravity  
**Plataforma:** Prada / TrackOps  

---

## 1. Visión General y Objetivos

El objetivo de esta especificación es integrar de forma completa y funcional el motor de mensajería instantánea **WhatsApp** en Prada mediante **Evolution API** (autohospedado en Docker). Esto permitirá el despacho real de alertas operativas hacia supervisores y administradores, e implementará la consola de control y vinculación por código QR en el panel de SuperAdmin.

### Objetivos Clave:
1. **Infraestructura Dockerizada:** Añadir el servicio `evolution-api` a la orquestación Docker (`docker-compose.infra.yml` y `docker-compose.dev.yml`) sin costo por mensaje.
2. **Capa `WhatsAppProvider` Desacoplada:** Abstracción modular en el backend para enviar mensajes, consultar el estado de la instancia, generar QRs y permitir en el futuro alternar a la API Oficial de Meta si se requiere.
3. **Despacho Real de Alertas:** Conectar el despachador central (`src/lib/alerts/dispatcher.ts`) para que las alertas activadas con destino WhatsApp se envíen en tiempo real y actualicen su estado en `alert_logs`.
4. **Módulo SuperAdmin en "Dev & Operaciones":** Nueva subsección `/panel/superadmin/dev/whatsapp` (con icono de WhatsApp en la barra lateral) para visualizar el estado de conexión de la instancia, generar/escanear el código QR, enviar mensajes de prueba y reiniciar o desvincular la sesión.
5. **Protocolo Anti-Baneo:** Implementación de delays humanos entre mensajes, formato limpio de alertas y política de agendado de contacto.
6. **Base para Chatbot MCP (Fase 2):** Configuración del webhook entrante `/api/whatsapp/webhook` para recepción de mensajes.

---

## 2. Arquitectura del Sistema

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Panel SuperAdmin                    │
                               │           (/panel/superadmin/dev/whatsapp)             │
                               │  - Estado de conexión (Conectado / Desconectado)       │
                               │  - Generación y renderizado de QR                      │
                               │  - Enviar mensaje de prueba & Reiniciar instancia      │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
┌───────────────────────────────┐                          │
│   Eventos & Cron Jobs Prada   │                          ▼
│ (Mantenimiento, Documentos,   │                ┌──────────────────┐
│  Geocercas, Horarios)         │───────────────▶│ Server Actions / │
└───────────────────────────────┘                │ WhatsApp Actions │
               │                                 └─────────┬────────┘
               ▼                                           │
┌───────────────────────────────┐                          │
│  src/lib/alerts/dispatcher.ts │                          ▼
│  (Motor de Despacho Central)  │───────────────▶┌─────────────────────────┐
└───────────────────────────────┘                │  IWhatsAppProvider      │
                                                 │  (src/lib/whatsapp)     │
                                                 └─────────┬───────────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            ▼                             ▼
                              ┌───────────────────────────┐ ┌───────────────────────────┐
                              │    EvolutionApiProvider   │ │    MockWhatsAppProvider   │
                              │    (Producción / Dev)     │ │    (Entornos de Test)     │
                              └─────────────┬─────────────┘ └───────────────────────────┘
                                            │ HTTP REST
                                            ▼
                              ┌───────────────────────────┐
                              │       Evolution API       │
                              │  (Docker Container :8080) │
                              └─────────────┬─────────────┘
                                            │ Baileys / WS
                                            ▼
                                   Red de WhatsApp ──▶ Dispositivos Móviles
```

---

## 3. Infraestructura y Variables de Entorno

### 3.1 Servicio Docker (`docker-compose.infra.yml` / `docker-compose.dev.yml`)
```yaml
  evolution-api:
    image: atendai/evolution-api:v2.1.2
    container_name: prada-evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY:-prada_evolution_secret_key_2026}
      - DATABASE_ENABLED=false
      - WEBHOOK_GLOBAL_ENABLED=false
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

### 3.2 Variables de Entorno (`.env.example` y `.env`)
```env
# WhatsApp & Evolution API Configuration
WHATSAPP_PROVIDER=evolution # 'evolution' | 'mock'
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=prada_evolution_secret_key_2026
EVOLUTION_INSTANCE_NAME=prada-flotas
```

---

## 4. Diseño del Backend y Proveedor Modular

### 4.1 Tipos e Interfaces (`src/lib/whatsapp/types.ts`)
```typescript
export type WhatsAppConnectionStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";

export interface WhatsAppInstanceStatus {
  instanceName: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  qrCodeBase64?: string | null;
  pairingCode?: string | null;
}

export interface SendMessageOptions {
  delayMs?: number;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IWhatsAppProvider {
  getStatus(): Promise<WhatsAppInstanceStatus>;
  connectOrCreateInstance(): Promise<WhatsAppInstanceStatus>;
  getQrCode(): Promise<{ qrCodeBase64?: string | null }>;
  sendMessage(to: string, text: string, options?: SendMessageOptions): Promise<SendMessageResult>;
  logout(): Promise<boolean>;
  restart(): Promise<boolean>;
}
```

### 4.2 Implementación `EvolutionApiProvider` (`src/lib/whatsapp/evolution-provider.ts`)
- **Gestión de Instancias:** Crea la instancia `prada-flotas` si no existe (`POST /instance/create`), solicita el QR (`GET /instance/connect/{instance}`).
- **Formateo de Número:** Limpia espacios, guiones y asegura el formato internacional E.164 (ej. `5491112345678`).
- **Envío de Mensajes:** `POST /message/sendText/{instance}` con payload tipado.
- **Manejo de Errores y Timeouts:** Envuelto en `try/catch` con timeout de 8 segundos para evitar bloqueos del hilo servidor.

### 4.3 Integración en el Despachador de Alertas (`src/lib/alerts/dispatcher.ts`)
1. Al recibir una alerta con `config.canalWhatsapp === 1` y destinatario configurado:
2. Formatea el texto enriquecido para WhatsApp:
   ```text
   🚨 *ALERTA PRADA: {MÓDULO}*
   ━━━━━━━━━━━━━━━━━━━━━━━
   🚗 *Vehículo:* {PATENTE}
   📋 *Evento:* {TÍTULO}
   📝 *Detalle:* {MENSAJE}
   ⚡ *Severidad:* {SEVERIDAD}
   📅 *Fecha:* {FECHA_HORA}
   ━━━━━━━━━━━━━━━━━━━━━━━
   ```
3. Llama a `whatsAppProvider.sendMessage(phoneDest, formattedText)`.
4. Si la llamada es exitosa: guarda `alert_logs` con `estado = "ENVIADO"`.
5. Si la llamada falla: guarda `alert_logs` con `estado = "FALLIDO"` y registra el motivo en `metadata`.

---

## 5. Módulo SuperAdmin: Subsección Evolution API

### 5.1 Navegación en Barra Lateral (`src/components/layout/app-sidebar.tsx`)
En el grupo **"Dev & Operaciones"** para el rol `SUPER_ADMIN`, se agrega el elemento:
```typescript
{
  title: "Evolution API",
  url: "/panel/superadmin/dev/whatsapp",
  icon: MessageSquare, // O icono representativo de WhatsApp / chat
}
```

### 5.2 Vista de Control (`/panel/superadmin/dev/whatsapp/page.tsx` y componentes)
- **Tarjeta de Estado Principal:**
  - **Badge de Estado:** Verde (`Conectado`), Amarillo (`Esperando vinculación QR`), Rojo (`Desconectado`).
  - **Datos del Número Conectado:** Teléfono emisor, nombre de la cuenta de WhatsApp y foto de perfil si está disponible.
- **Zona de Código QR:**
  - Si la instancia está en estado `CONNECTING` o `DISCONNECTED`, muestra el código QR generado en base64 para ser escaneado con la cámara de WhatsApp ("Dispositivos vinculados").
  - Botón de refresco manual y auto-polling cada 15 segundos mientras espera conexión.
- **Herramienta de Prueba de Envío:**
  - Formulario con input de teléfono de prueba y mensaje personalizado.
  - Botón "Enviar Mensaje de Prueba" con feedback inmediato tipo toast.
- **Controles de Instancia:**
  - Botón *"Reiniciar Conexión"*.
  - Botón *"Desvincular / Cerrar Sesión"* (con diálogo de confirmación).

---

## 6. Server Actions (`src/lib/whatsapp-admin-actions.ts`)

Acciones protegidas exclusivas para el rol `SUPER_ADMIN`:
- `getWhatsAppStatusAction()`: Retorna el estado actual de la instancia de WhatsApp.
- `generateWhatsAppQrAction()`: Fuerza la generación / obtención del código QR actual.
- `sendWhatsAppTestAction(to: string, message: string)`: Realiza un envío de prueba directo.
- `restartWhatsAppInstanceAction()`: Reinicia el contenedor / sesión de Evolution API.
- `logoutWhatsAppInstanceAction()`: Desvincula la sesión activa.

---

## 7. Políticas de Seguridad y Anti-Baneo

1. **Mensaje de Bienvenida:** Disparado la primera vez que se configura el teléfono de una empresa para invitar al usuario a agendar el contacto de Prada.
2. **Delay Entre Despachos:** Pausa controlada (1.5 segundos) en lotes masivos.
3. **Pie de Mensaje:** Inclusión de texto de pie informativo con opción de pausar o gestionar las alertas en el panel.
4. **Resguardo de Logs:** Registro completo en `alert_logs` de todos los intentos, tiempos y respuestas de la API.

---

## 8. Verificación y Plan de Pruebas

1. **Prueba de Infraestructura Docker:**
   - Iniciar `docker-compose.dev.yml` con el servicio `evolution-api` y verificar que responde en `http://localhost:8080`.
2. **Prueba de Panel SuperAdmin:**
   - Navegar a `/panel/superadmin/dev/whatsapp`.
   - Verificar la visualización del estado inicial y generación del código QR.
3. **Prueba de Vinculación:**
   - Escanear el QR con WhatsApp y validar que la UI cambie automáticamente a estado `Conectado` con el número correspondiente.
4. **Prueba de Envío Directo:**
   - Enviar mensaje de prueba desde la herramienta de diagnóstico de SuperAdmin.
5. **Prueba de Despacho de Alerta:**
   - Ir a `/panel/administracion/configuracion`, activar WhatsApp, cargar un número de prueba y disparar una "Alerta de Prueba".
   - Verificar que el mensaje llega al WhatsApp y que el registro en `alert_logs` queda con `estado = "ENVIADO"`.
