# Estrategia e Integración de WhatsApp (Evolution API & Roadmap MCP)

**Fecha de actualización:** 2026-08-25  
**Plataforma:** Prada / TrackOps  
**Objetivo:** Envío automatizado de alertas operativas en tiempo real y base de comunicación bidireccional para Chatbot Asistente con MCP.

---

## 1. Visión General y Arquitectura

El sistema de notificaciones de Prada adopta una arquitectura desacoplada basada en el patrón **`WhatsAppProvider`**. 

* **Fase 1 (Actual - Alertas Operativas):** Envío automático de notificaciones de mantenimiento preventivo, vencimientos de documentación (VTV, seguros, licencias), violaciones de geocercas e infracciones de horarios de uso.
* **Fase 2 (Próxima - Chatbot & MCP):** Canal bidireccional interactivo donde choferes, administradores y supervisores pueden consultar el estado de su unidad, kilometraje, cargar fotos de tickets de combustible o PDFs y ejecutar acciones asistidas por IA mediante el servidor **MCP (Model Context Protocol)** de Prada.

```
┌─────────────────────────────────────────────────────────────┐
│                      Prada Backend                          │
│   (Alert Dispatcher / Cron Jobs / AI & MCP Chatbot Engine)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌──────────────────────────┐  ┌──────────────────────────┐
   │      Evolution API       │  │    Meta Cloud API        │
   │  (Docker / Baileys QR)   │  │  (Oficial - Fallback)    │
   │  * Costo $0 por mensaje  │  │  * Enterprise / Plantillas│
   │  * Formato libre & Media │  │  * 0% riesgo protocolo   │
   │  * Webhooks bidireccional│  └──────────────────────────┘
   └────────────┬─────────────┘
                │
                ▼
        WhatsApp Network ──▶ Teléfonos de Choferes / Supervisores
```

---

## 2. Herramienta Seleccionada: Evolution API

### ¿Por qué Evolution API es la opción recomendada?
1. **Cero Costo Operativo por Mensaje:** No cobra tarifas por conversación ni suscripciones de terceros; utiliza la infraestructura propia de la empresa vía Docker.
2. **Formato Enriquecido Sin Aprobación Previa:** Permite enviar texto libre, emojis, negritas, links directos a la plataforma y archivos adjuntos sin depender de la aprobación burocrática de plantillas de Meta.
3. **Recepción Bidireccional de Eventos (Webhooks):** Emite eventos HTTP (`MESSAGES_UPSERT`) cada vez que un usuario escribe al número, permitiendo alimentar el webhook de Prada (`/api/whatsapp/webhook`).
4. **Base Lista para MCP y Agentes de IA:** Dispone de soporte nativo para webhooks estructurados, lo que permite que el backend de Prada identifique al remitente (por número de teléfono), consulte al servidor MCP y responda en segundos.
5. **Vinculación Ágil por Código QR:** Se genera y vincula una instancia escaneando el código QR desde cualquier celular en segundos.

---

## 3. Análisis de Riesgo de Baneo y Mitigación

### ¿Por qué banea WhatsApp?
Meta aplica algoritmos de seguridad y filtros anti-spam basados en:
1. **Reportes de usuarios (Factor Crítico #1):** Si destinatarios desconocidos tocan el botón *"Reportar o Bloquear como Spam"*.
2. **Disparos masivos repentinos:** Enviar cientos de mensajes en pocos segundos desde números sin historial previo.
3. **Comportamiento unidireccional:** Números que emiten miles de mensajes salientes pero jamás reciben respuestas ni conversaciones orgánicas.

### ¿Por qué en Prada el riesgo es muy bajo?
* **Mensajes transaccionales esperados:** Los destinatarios son los propios administradores, supervisores y choferes de la empresa que configuraron su teléfono en el panel.
* **Volumen espaciado:** Los avisos se emiten por eventos puntuales (un service vencido, un documento por caducar).
* **Interacción conversacional:** Con la llegada del chatbot MCP, las conversaciones bidireccionales aumentan la reputación orgánica del número ante los servidores de WhatsApp.

---

## 4. Las 5 Reglas de Oro para Blindar el Número (Cero Baneos)

Para garantizar la continuidad operativa y cuidar la reputación de la línea, se implementan las siguientes políticas:

1. **Mensaje de Bienvenida y Agendado de Contacto (Clave):**
   * Al dar de alta un número en la plataforma, se envía un mensaje de confirmación:
     > *"¡Hola! Te damos la bienvenida a las notificaciones de Prada Flotas. Agendá este contacto para recibir tus alertas operativas sin interrupciones."*
   * Cuando el usuario tiene el número agendado en su agenda, **WhatsApp no le muestra el botón de reporte de spam**.
2. **Calentamiento de la Línea (Warm-Up):**
   * No utilizar un chip 100% virgen recién comprado para emitir cientos de alertas de golpe.
   * Utilizar una línea con semanas de uso previo o realizar conversaciones cotidianas durante los primeros días antes de activar el tráfico intensivo.
3. **Delay Humano y Rate Limiting en Backend:**
   * El despachador de alertas de Prada introduce un retraso programado (1 a 3 segundos) entre mensajes cuando se procesan lotes de alertas simultáneas.
4. **Opción de Silenciamiento / Opt-out:**
   * Las alertas incluyen al pie una indicación clara para el usuario:
     > *"Para pausar notificaciones, respondé PAUSAR o configuralo en tu panel."*
5. **Arquitectura con Fallback a Meta Cloud API:**
   * Si en el futuro la plataforma escala a miles de empresas y se desea certificación oficial con tilde verde y 0% de riesgo por protocolo, se puede activar la API Oficial de Meta cambiando la configuración en `.env` sin modificar la lógica del sistema.

---

## 5. Comparativa Técnica: Evolution API vs Meta Cloud API

| Característica | Evolution API (Docker) | Meta WhatsApp Cloud API |
| :--- | :--- | :--- |
| **Costo por mensaje** | **$0 (Gratis)** | ~USD $0.03 - $0.05 por conversación (Utility) |
| **Aprobación de plantillas** | **No requiere** (Texto libre y dinámico) | Requiere registro y aprobación previa en Meta |
| **Infraestructura** | Contenedor Docker en VPS propio | Servidores Cloud de Meta |
| **Vinculación** | Escaneo de Código QR (10 seg) | Meta Business Manager + CUIT + App Token |
| **Riesgo de bloqueo** | Bajo (siguiendo las 5 reglas de oro) | Nulo (Canal Oficial) |
| **Chatbot & Soporte MCP** | Nativo vía Webhooks / REST | Vía Webhooks de Graph API |

---

## 6. Despliegue Técnico en Prada

### 6.1 Servicio Docker (`docker-compose.infra.yml` / `docker-compose.dev.yml`)
```yaml
evolution-api:
  image: atendai/evolution-api:v2.1.2
  container_name: prada-evolution-api
  restart: always
  ports:
    - "8080:8080"
  environment:
    - SERVER_URL=http://localhost:8080
    - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
    - DATABASE_ENABLED=false
```

### 6.2 Variables de Entorno (`.env`)
```env
WHATSAPP_PROVIDER=evolution # 'evolution' | 'meta' | 'mock'
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=tu-api-key-segura-aqui
EVOLUTION_INSTANCE_NAME=prada-main
```

### 6.3 Flujo de Despacho de Alertas (`src/lib/alerts/dispatcher.ts`)
1. El backend detecta un evento (ej. kilometraje de service alcanzado).
2. Valida que la empresa tenga activo el canal de WhatsApp (`alert_configs.canal_whatsapp === 1`).
3. Formatea el mensaje con formato enriquecido (emojis, datos del vehículo, link directo al panel).
4. Despacha vía `WhatsAppProvider` (Evolution API `POST /message/sendText/{instance}`).
5. Registra el estado (`ENVIADO` o `FALLIDO`) y el `messageId` en la tabla `alert_logs`.

---

## 7. Roadmap Fase 2: Chatbot Asistente con MCP (Model Context Protocol)

Con Evolution API recibiendo mensajes entrantes mediante el webhook `/api/whatsapp/webhook`, se habilitará la interacción inteligente para la flota:

1. **Identificación de Usuario:** El sistema cruza el número de WhatsApp con la base de datos de usuarios y choferes de Prada.
2. **Conexión con Servidor MCP:** El mensaje en lenguaje natural es interpretado por el agente de IA, que tiene acceso a herramientas (*tools*) como:
   * `consultar_ubicacion_vehiculo(patente)`
   * `consultar_proximos_services(patente)`
   * `consultar_vencimientos_documentos(empresaId)`
   * `registrar_ticket_combustible(fotoUrl, litros, monto, odometro)`
   * `reportar_incidente_mecanico(vehiculoId, descripcion)`
3. **Respuesta Inmediata:** El bot responde por WhatsApp con los datos solicitados o confirmando la operación realizada en Prada.