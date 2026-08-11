1. El Concepto (Remitente Centralizado)
La plataforma operará con un único número de WhatsApp oficial a nombre de tu sistema (ej. "Notificaciones FleetHub"). Todas las alertas preventivas y de vencimientos, de todas las flotas, saldrán desde este número unificado. Esto te da control total de la infraestructura, vos gestionás el pago del consumo mensual a Meta y se lo trasladás a las empresas logísticas dentro de su abono mensual o como un paquete extra. Esto evita el bloqueo burocrático de tener que verificar la empresa de cada nuevo cliente que se suscriba.

2. La Lógica de Funcionamiento (Plantillas)
Para evitar el spam y bloqueos, Meta prohíbe el envío masivo de texto libre. El sistema utilizará Plantillas Pre-aprobadas (categoría Utilidad). Vos redactás el esqueleto del mensaje en Meta una sola vez (ej. "Atención: El vehículo {{1}} debe realizar el mantenimiento de {{2}} el día {{3}}"). Cuando el Cron Job detecta un vencimiento, tu sistema rellena automáticamente esas variables y dispara el mensaje al chofer o administrador.

3. La Ejecución Técnica
El envío se realiza consumiendo la Graph API de Meta. Tu backend en Next.js armará un payload en formato JSON con el token de seguridad y los datos de la plantilla, ejecutando una petición HTTP POST a los servidores de WhatsApp. Para mantener la estabilidad del servidor (VPS), estos envíos deben procesarse en una cola de tareas en segundo plano (background jobs) para no saturar los recursos ni superar los límites de tasa (rate limits) de Meta en caso de envíos masivos.

4. Requisitos Excluyentes (Para el dueño del negocio)
Para poder conectar la API y salir a producción, la persona o entidad dueña del software debe proveer:

Un número de teléfono virgen: Un chip o línea que nunca se haya registrado en ninguna aplicación de WhatsApp (ni normal ni Business).

Business Manager Verificado: La cuenta comercial de Meta aprobada con documentación fiscal (CUIT/Razón Social).

Método de Pago: Una tarjeta de crédito cargada en la plataforma de Meta para facturar el costo por "conversación de 24 horas" iniciada.

Nombre de Perfil Público: El nombre oficial aprobado que verán los usuarios al recibir el mensaje.