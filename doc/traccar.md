

---

# Arquitectura de Telemetría e Ingestión - TrackOps

## 1. Visión General

Para evitar intermediarios y proveedores SaaS terceros, TrackOps utiliza **Traccar Server** como motor de ingestión headless (sin interfaz gráfica). Traccar escucha las tramas de red directas de los equipos GPS, decodifica los protocolos binarios/hexadecimales, responde los handshakes/ACKs obligatorios y reenvía los datos estructurados en formato JSON a la API principal de TrackOps.

### Diagrama de Flujo

* **Capa Física:** Dispositivos GPS (Teltonika, Suntech, Coban, etc.) enviando datos por sockets TCP/UDP con chips SIM M2M.
* **Ingestión:** Traccar Engine corriendo en Docker dentro de un VPS con IP pública fija.
* **Despacho:** Webhooks HTTP POST con payloads JSON hacia el backend de TrackOps.
* **Procesamiento:** API en Next.js / Node.js guardando en PostgreSQL y publicando en Redis Pub/Sub.
* **Consumo:** WebSockets en vivo para el Dashboard, auditoría de combustible con IA, alertas por WhatsApp y consultas en lenguaje natural mediante el servidor MCP.

---

## 2. Compatibilidad de Hardware

Traccar decodifica más de 200 protocolos propietarios. Cada marca reporta en un puerto TCP/UDP específico:

| Fabricante | Protocolo | Puerto Default Traccar | Modelos comunes |
| --- | --- | --- | --- |
| **Teltonika** | Codec 8 / 8 Extended | `5027` | FMB920, FMC130, FMM |
| **Suntech** | ST | `5011` | ST310, ST340 |
| **Queclink** | @Track | `5004` | GL300, GV55 |
| **Coban / Xexun** | GPS103 | `5001` | TK103, TK303 |
| **Concox / Jimi** | GT06 | `5023` | CRX3, WeTrack |

Cualquier dispositivo GPS comercial se conecta configurándole el APN de la SIM y apuntando la IP pública del VPS al puerto correspondiente.

---

## 3. Componentes del Sistema

### Capa de Dispositivos (Hardware y SIMs)

* **SIMs M2M / IoT:** Chips con APN corporativo y tráfico multi-operador (Claro, Movistar, Personal).
* **Configuración del GPS:** Mediante cable USB o comandos SMS se define:
* APN del proveedor de datos móviles.
* IP pública fija o subdominio del VPS (`ingest.trackops.com`).
* Puerto TCP o UDP según la marca del equipo.
* Intervalo de reporte (ej. cada 30 segundos en movimiento, cada 5 minutos en reposo).



### Ingestión (Traccar Headless)

* Corre en un VPS accesible con IP pública fija.
* Recibe las conexiones de socket, devuelve el ACK para evitar reenvíos innecesarios y extrae:
* IMEI / identificador único.
* Coordenadas geográficas (latitud, longitud, altitud).
* Timestamp original de generación del dato satelital.
* Velocidad, rumbo y estado de ignición.
* Odómetro acumulado y voltaje de batería.


* Despacha los eventos mediante `forward.url` a tu endpoint HTTP.

### Backend y Reglas de Negocio (TrackOps API)

* **Endpoint receptor:** `POST /api/telemetry/webhook`.
* **Rastreo en vivo:** Envía la posición vía Redis / WebSockets al mapa web en tiempo real.
* **Mantenimiento predictivo:** Compara los km acumulados contra el plan de services (cambio de aceite, filtros, cubiertas) y dispara alertas preventivas.
* **Alertas operativas:** Detecta eventos críticos (desconexión de batería, excesos de velocidad, geocercas) y notifica vía WhatsApp.
* **Auditoría de combustible:** Cruza los trayectos y km reales con las fotos de tickets de carga procesadas con IA por WhatsApp.
* **Servidor MCP:** Expone herramientas de consulta a agentes de IA externos para auditar consumos, estados e historial sin pasar por la interfaz web.

---

## 4. Despliegue de Traccar (Docker)

### docker-compose.yml

```yaml
version: '3.8'

services:
  traccar:
    image: traccar/traccar:latest
    container_name: trackops-ingestion
    restart: unless-stopped
    ports:
      - "8082:8082"       # Panel web administrativo interno
      - "5027:5027/tcp"   # Teltonika
      - "5011:5011/tcp"   # Suntech
      - "5001:5001/tcp"   # Coban
    volumes:
      - ./traccar.xml:/opt/traccar/conf/traccar.xml:ro
      - ./logs:/opt/traccar/logs

```

### traccar.xml (Configuración de Webhook)

```xml
&lt;?xml version='1.0' encoding='UTF-8'?&gt;
&lt;!DOCTYPE properties SYSTEM 'http://java.sun.com/dtd/properties.dtd'&gt;
&lt;properties&gt;
    &lt;entry key='database.driver'&gt;org.h2.Driver&lt;/entry&gt;
    &lt;entry key='database.url'&gt;jdbc:h2:./data/database&lt;/entry&gt;

    &lt;!-- Reenvío de eventos a la API de TrackOps --&gt;
    &lt;entry key='event.forward.enable'&gt;true&lt;/entry&gt;
    &lt;entry key='forward.enable'&gt;true&lt;/entry&gt;
    &lt;entry key='forward.url'&gt;https://api.trackops.com/api/telemetry/webhook&lt;/entry&gt;
    &lt;entry key='forward.json'&gt;true&lt;/entry&gt;
&lt;/properties&gt;

```

---

## 5. Estructura del Payload Recibido en Webhook

```json
{
  "position": {
    "id": 84210,
    "deviceId": 3,
    "protocol": "teltonika",
    "deviceTime": "2026-09-17T03:30:00.000Z",
    "fixTime": "2026-09-17T03:30:00.000Z",
    "valid": true,
    "latitude": -38.7183,
    "longitude": -62.2663,
    "altitude": 24.0,
    "speed": 65.4,
    "course": 182.0,
    "attributes": {
      "ignition": true,
      "motion": true,
      "totalDistance": 18450200.0,
      "power": 12.6,
      "battery": 4.1
    }
  },
  "device": {
    "id": 3,
    "uniqueId": "864201041234567",
    "name": "Camion-04"
  }
}

```

---

## 6. Pasos para Iniciar el Desarrollo

1. Levantar una instancia VPS (Hetzner, AWS EC2 o DigitalOcean) con IP pública estática.
2. Iniciar el contenedor Docker de Traccar exponiendo los puertos requeridos.
3. Crear la ruta `POST /api/telemetry/webhook` en la API de TrackOps para procesar los datos entrantes.
4. Adquirir una unidad GPS física de pruebas (por ejemplo, Teltonika FMB920), configurarla con un chip M2M apuntando a la IP del VPS y validar la llegada del payload.