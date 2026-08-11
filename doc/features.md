### FEATURES

- Panel de admin con usuarios y roles (admin, chofer, vendedor/instalador)

- Bitácora avisa por mail y WhatsApp (a eleccion, o las dos) cuándo cada camión, bus o utilitario de tu flota necesita mantenimiento — por kilómetro o por fecha, con o sin GPS. Y guarda el historial completo de cada unidad.

- Historial completo por vehículo
Fecha, kilometraje, costo y taller de cada service. Un timeline que sirve para auditorías o para vender la unidad.

- Conexión con GPS
Sumá el kilometraje automático de tu proveedor de rastreo, o cargalo a mano si todavía no tenés GPS instalado, que se actualize cada 2 minutos para ver en un mapa interactivo.

- Multiusuario por empresa
Sumá a los responsables de mantenimiento que necesites, todos viendo la misma flota en tiempo real.

- Precio por cantidad de vehículos
Pagás en función de tu flota real, sin funciones de más que nunca vas a usar.

- Planes por tamaño de flota

Alquiler de auto y translado de personal.

Mantenimiento (cuando le cambiaron X cosa) y seguimiento (km por dia con localizador) de los vehiculos, centrado.
Avisos de mantenimiento y seguimiento de los vehiculos, centrado, configurables.
Control de mantenimiento de flota.

#### Features a proponer:

- Panel tipo Google Analytics con Umamy Analytics para ver estadisticas de la web. 
- Dashboard de Analíticas
- Gestión de Combustible: Permitir que se carguen los tickets de nafta/gas, verificacion de discrepancias de comubistible, excel y pdf.  
- Gestión Documental y Vencimientos: Alertas de vencimiento de la VTV (Revisión Técnica), pólizas de seguro, matafuegos y habilitaciones de ruta. (Vencimiento de VTV Vencimiento de licencia de conducir de choferes,Habilitación municipal,Senasa,Póliza de seguro)
- Tracking en vivo en mapa dentro de la plataforma (se lee el dato del GPS, pero el mapa en tiempo real lo sigue viendo en la app de su proveedor). Wialon
- Pasarela de pago con suscripcion mensual o anual con facturacion automatica con integracion de Mercado Pago 
- Backup de la base de datos y que mande los archivos al sistema de archivos Cloudflare R2.
- Sistema de facturacion con arca. (en una segunda etapa)

### COSTOS 
COSTO VPS Plan KVM 2: pago x mes ARS 28.599 X
                      pago x 1 año ARS 241.188 (x mes ARS 20.099)
                      pago x 2 años ARS 415.176 (x mes ARS 17.299)

COSTO DOMINIO (aproximado): pago x 1 año ARS 21.009 
                            pago x 2 años ARS 50.019 (pasa que despues el segundo año se renueva mas caro)
                            pago x 3 años ARS 89.728 (pasa que despues el segundo año se renueva mas caro)
                            (yo pagaria el mail profesional, no tiene mucho costo y da profesionalidad, 1500 pesos + aprox)

SISTEMA DE MAILS: 3k mails x mes / free
                  50k mails x mes / USD $20 x mes 
    
ESTIMACION COSTO SISTEMA DE WHATSAPP (API Oficial de Meta):
25 empresas y 250 usuarios (10 destinatarios por empresa), se estiman entre 500 y 1.500 notificaciones mensuales (asumiendo de 2 a 6 alertas de servicio/vencimiento por empresa al mes).

(2 alertas/mes por empresa)~500 notificaciones USD $20 - USD $25 ~ ARS $24.000 - ARS $30.000
(4 alertas/mes por empresa)~1.000 notificaciones USD $40 - $45 ~ ARS $48.000 - ARS $54.000
(6 alertas/mes por empresa)~1.500 notificaciones USD $60 - $70 ~ ARS $72.000 - ARS $84.000

ALMACENAMIENTO DE ARCHIVOS Cloudflare R2: ARS $0 al principio, y menos de USD $2 a $5 mensuales a futuro.

Comisiones de pasarela de pago MP (depende en cuanto tiempo quieras liberar la plata (retencion)) 3,5% y un 6% + IVA aprox


### Stack Tecnologias y Servicios:

Nginx
Docker
Typescript
TanStack
React
Next.js
Umami Analytics
PostgreSQL (PostGIS ?)
PGAdmin
Redis?
Prisma ORM (o Drizzle ORM, mas rapido)
Portainer

Cloudflare R2
Resend
Meta API Oficial de WhatsApp

---

### Especificaciones Detalladas (Definidas en /grill-me):

#### 1. Arquitectura de Datos y Multitenancy
- **Row-Level Multitenancy**: Base de datos PostgreSQL compartida. Todas las tablas principales (`vehículos`, `mantenimientos`, `choferes`, `documentos`, `tickets_combustible`) incluirán la columna `empresa_id`.
- **Aislamiento**: Consultas filtradas a nivel de backend mediante Drizzle ORM garantizando que cada empresa solo acceda a su propia flota.

#### 2. Arquitectura de Aplicación
- **Next.js Fullstack (App Router)**: Backend y Frontend unificados en una sola aplicación Next.js con TypeScript, TanStack Query y Drizzle ORM.

#### 3. Motor de Alertas y Notificaciones (WhatsApp & Mail)
- **Ejecución Ligera**: Cron job diario programado (ej. Node-cron / Next.js API cron Handler sin dependencia pesada de Redis) que evalúa mantenimientos por kilometraje/fecha y vencimientos documentales.
- **Canales de Notificación**: Envíos de emails mediante Resend y mensajes automáticos mediante la API Oficial de Meta WhatsApp.

#### 4. Gestión Documental, Incidentes y Almacenamiento (MinIO / R2)
- **Subida Eficiente vía Presigned URLs**: Generación de URLs firmadas temporales para que los dispositivos móviles y navegadores suban imágenes de tickets de combustible, denuncias policiales de choques y fotos de VTV directamente a MinIO (Dev) o Cloudflare R2 (Prod) sin saturar la RAM del servidor Next.js.
- **Organización de Objetos**: Estructura de carpetas por `empresa_id/{vehiculos|incidentes|tickets}/yyyy-mm/` garantizando aislamiento y facilidades para auditorías.

#### 5. Suscripciones y Facturación Automatizada (Mercado Pago)
- **Débito Automático por Cantidad de Vehículos**: Uso de Mercado Pago Preapproval API para cobros recurrentes automáticos (mensuales/anuales) adaptados al rango de flota.
- **Webhook de Eventos (`/api/webhooks/mercadopago`)**: Procesamiento automático de altas, cobros exitosos, impagos o cancelaciones, ajustando dinámicamente los límites de la cuenta de la empresa.


#### 7. Backups Automatizados & Operaciones VPS
- **Backups Diarios de Base de Datos**: Script automatizado en el VPS que ejecuta `pg_dump` de PostgreSQL, comprime el archivo y lo envía directamente al bucket de almacenamiento de Cloudflare R2 / MinIO.
- **Analíticas Privacy-focused**: Integración nativa de Umami Analytics mediante contenedor aislado en el puerto `3002`, filtrando accesos de administración.

#### 8. Autenticación y Control de Acceso por Roles (RBAC)
- **NextAuth.js v5 (Auth.js)**: Autenticación de sesiones basada en JWT almacenados en Cookies HTTP-only seguras.
- **Jerarquía de Roles**: 
  - `SuperAdmin`: Gestión global de la plataforma y cobros.
  - `AdminEmpresa`: Gestión completa de su flota, responsables y presupuestos.
  - `Chofer`: Vista móvil simplificada para registrar kilometraje, tickets de combustible y check-in/check-out de unidades.
  - `Vendedor/Instalador`: Gestión de instalación de GPS y seguimiento del estado de los dispositivos y unidades.

#### 9. Módulo de Gestión de Combustible y Detección de Anomalías
- **Registro con Odómetro**: Cada carga de combustible requiere foto del ticket, litros, precio total y kilometraje del odómetro.
- **Algoritmo de Eficiencia (L/100km)**: El sistema calcula automáticamente la diferencia de kilómetros desde la última carga completa y el consumo promedio.
- **Alertas de Desviación**: Notificación automática al Admin si el consumo excede un 20% el promedio histórico de ese vehículo (alerta de falla mecánica o posible robo de combustible).

#### 11. Módulo de Mapa Interactivo y Tracking GPS (PostGIS)
- **Mapa Vectorizado Nivel Flota**: Integración de React Leaflet / Mapbox GL para renderizar la última posición GPS enviada por los sensores/proveedores.
- **Indicadores de Estado**: Marcadores visuales según el estado de la unidad (verde: en marcha, amarillo: detenido/ralentí, rojo: sin transmisión > 10 min, gris: en service).
- **Reproductor de Recorridos**: Visualización de la ruta histórica guardada en PostGIS (`gps_logs`) permitiendo filtrar por fecha y hora.

#### 12. Ficha Digital del Vehículo y Exportación de Informes
- **Ficha Técnica & Timeline Completo**: Vista de hoja de vida única de cada camión/bus/utilitario con el registro histórico de services, gastos de taller, tickets de combustible e incidentes.
- **Exportación en PDF Profesional**: Generación de informe en PDF listo para descargar y presentar en auditorías o al momento de transferir/vender la unidad.
- **Exportación a Excel / CSV**: Descarga masiva de planillas de mantenimientos y gastos para el departamento contable de la empresa.

#### 13. Matriz de Mantenimiento Preventivo Granular
- **Planes por Ítem / Componente**: Cada plan de mantenimiento permite configurar reglas específicas por repuesto/servicio:
  - Cambios de Aceite y Filtros (ej: cada 10.000 km o 6 meses).
  - Pastillas de Freno y Fluidos (ej: cada 25.000 km).
  - Neumáticos y Alineación/Balanceo (ej: cada 40.000 km).
  - Correa de Distribución / Cadena (ej: cada 60.000 km o 3 años).
- **Márgenes de Pre-Aviso (Tolerancia)**: Umbral configurable de disparo (ej. notificar al usuario 500 km antes o 15 días antes de que venza el ítem) para solicitar turno de taller con anticipación.

#### 14. Asignación Dinámica de Choferes y Check-in / Check-out por QR
- **Toma y Entrega de Unidad (Shift Log)**: Al iniciar la jornada, el chofer escanea un código QR en el vehículo (o lo selecciona desde la PWA) registrando kilometraje inicial y estado estético/mecánico básico.
- **Trazabilidad de Infracciones e Incidentes**: Auditoría histórica de conducción que registra exactamente qué chofer estuvo a cargo del vehículo en cualquier fecha y hora determinada (clave para deslindar responsabilidades ante fotomultas o siniestros).

#### 15. Estrategia de Notificaciones Totales por WhatsApp (API Meta)
- **Omnicanalidad orientada a WhatsApp**: Enviar el 100% de las notificaciones (alertas preventivas de mantenimiento, vencimientos de VTV/seguros/licencias y avisos de incidentes) directamente por WhatsApp utilizando la API Oficial de Meta.
- **Plantillas Oficiales Homologadas (HSM)**: Configuración de plantillas pre-aprobadas en Meta para garantización de entrega instantánea a teléfonos de administradores y choferes.
- **Resguardo por Mail**: Copia en simultáneo por correo electrónico (Resend) para archivo contable.

#### 16. Desglose de Costos de Taller y Repuestos (no al menos mvp)
- **Categorización de Gastos de Service**: Registro detallado separando:
  - Costo de mano de obra y mecánico.
  - Repuestos y piezas reemplazadas (marca, cantidad, garantía).
  - Adjunto de factura / remito del taller vía S3/MinIO.
- **Indicador de Costo por Kilómetro (CPK)**: Cálculo automático del costo de mantenimiento por km recorrido de cada unidad para tomar decisiones de renovación de flota.

#### 17. Módulo de Infracciones y Multas de Tránsito
- **Registro Simplificado de Infracciones**: Carga de multas (jurisdicción, motivo, fecha y monto) como gastos generales del vehículo dentro del historial contable de la unidad.
- **Control de Vencimiento de Pago Voluntario**: Alertas para aprovechar los descuentos por pago a término de las multas de la empresa.

#### 18. Dashboard Ejecutivo y KPIs de Flota (Business Intelligence)
- **Panel Control en Tiempo Real**: Tarjetas principales y gráficos interactivos consolidados:
  - **Costo Operativo Total**: Sumatoria de Combustible + Mantenimientos + Multas en el período seleccionado.
  - **Disponibilidad Operativa (%)**: Porcentaje de la flota activa en calle vs en taller/mantenimiento.
  - **Eficiencia Global de Combustible**: Promedio en L/100km de la empresa comparando unidades del mismo tipo.
  - **Calendario Unificado a 30 Días**: Vista mensual interactiva indicando servicios agendados y vencimientos documentales inminentes.

#### 19. Gestión Simplificada de Neumáticos
- **Mantenimiento por Kilometraje**: El reemplazo, rotación y alineación de neumáticos se gestiona de forma directa dentro de la matriz de mantenimiento preventivo por kilometraje del vehículo, sin complejidad de tracking por rueda individual.

#### 20. Alta Dual de Flota (Carga Masiva Excel/CSV + Carga Manual Formulario)
- **Importación Masiva por Excel/CSV**: Descarga de plantilla oficial (.xlsx/.csv) para que las empresas carguen decenas de vehículos y choferes de una sola vez, con validación automática de datos duplicados e impresiciones.
- **Carga Individual Manual**: Formularios ágiles e intuitivos para dar de alta unidades y choferes uno a uno de forma directa.

#### 21. Modelo de Negocio: Planes por Rango de Flota (SaaS Escalonado)

- 39.990 ARS / mes hasta 5 vehiculos con instalaccion incluida
- **Descuento por Pago Anual**

Mandar link a la administracion de manera automatica para el tema de los vencimientos de las licencias profesionales de conducir.

Wialon Api SDK


Usuario de vendedor/instalador, va a gestionar la instalacion de los gps y el seguimiento de los mismos, va a poder ver el estado de los gps y el estado de las unidades.


Fleet = Flota, Ops = Operaciones
TrackOps
http://fleethub.com.ar/
http://trackops.com.ar/


2da fase:

Implementacion de chatbot por whatsapp con MCP para que los choferes puedan consultar el estado de su unidad, kilometraje, vencimientos, etc. y que el sistema les pueda responder automaticamente. O para subir pdfs, o varias cosas.

Hacer GEO/SEO para mejorar posicionamiento de la web