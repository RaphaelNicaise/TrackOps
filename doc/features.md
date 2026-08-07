### FEATURES

- Panel de admin con usuarios y roles (admin, chofer)

- Bitácora avisa por mail y WhatsApp cuándo cada camión, bus o utilitario de tu flota necesita mantenimiento — por kilómetro o por fecha, con o sin GPS. Y guarda el historial completo de cada unidad.

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
- Gestión de Combustible: Permitir que se carguen los tickets de nafta/gas
- Gestión Documental y Vencimientos: Alertas de vencimiento de la VTV (Revisión Técnica), pólizas de seguro, matafuegos y habilitaciones de ruta. (Vencimiento de VTV Vencimiento de licencia de conducir de choferes,Habilitación municipal,Senasa,Póliza de seguro)
- Módulo de Choques e Incidentes: Un flujo donde se pueda reportar un accidente al instante. Que permita subir fotos de los daños (directo desde el celular), registrar los datos del tercero involucrado, cargar la denuncia policial y hacer el seguimiento del reclamo al seguro.
- Modo Offline para Mobile
- Tracking en vivo en mapa dentro de la plataforma (se lee el dato del GPS, pero el mapa en tiempo real lo sigue viendo en la app de su proveedor).
- Pasarela de pago con suscripcion mensual o anual con facturacion automatica con integracion de Mercado Pago 
- Backup de la base de datos y que mande los archivos al sistema de archivos Cloudflare R2.
- Sistema de facturacion con arca (a eleccion)

### COSTOS 
COSTO VPS Plan KVM 2: pago x mes ARS 28.599
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
VPS KVM 2 + Dominio + Mail profesional
Meta API Oficial de WhatsApp