- Bypass de auth demo en producción. src/auth.ts:82 si !user || !user.passwordHash permite login con cualquier password vía DEMO_USERS src/auth.ts:10. src/auth.config.ts:4 secret fallback dev-secret-key-trackops-authjs-123456789. En prod con DATABASE_URL caído entrás como [admin@test.com](mailto:admin@test.com) sin validar. Propuesta: exigir passwordHash siempre, demo solo si ALLOW_DEMO_LOGIN=true &amp;&amp; NODE_ENV!=production, y AUTH_SECRET obligatorio en prod
- 

- [x] Tipografía unificada. Eliminado Playfair_Display y fuentes fantasma (SF Pro/Geist). Unificado 100% en Outfit (Sans industrial) + JetBrains Mono (Mono para datos/patentes/telemetría) en layout.tsx, tailwind.config.ts y globals.css. Landing y panel completamente consistentes.

- Que el Chofer o el admin de la empresa, cuando quiera crear el viaje pueda elegir tanto un sitio (preconfigurado en la seccion sitios) como algun lugar de google places.
- Ver el tema del cobro escalonado, porque hay que cobrar mensual pero puede pasar que en el medio de la mensualidad se agreguen vehiculos.
- Integrarle a cada vehiculo la columnas para verificar si tiene o no el gps instalado, que modelo, etc. Que eso iria conectado con la cuenta instalador vendedor, cuando instale el GPS, se tendria que reflejar en el vehiculo, que esta funcionando. 
- Seccion de Combustible + Funcionalidades para el chofer, carga de tickets (foto o manual) para gestionar tema combustible
- [x] Fixear modo oscuro (Logo del panel blanco en dark mode, capas de mapas Leaflet dinámicas con CartoDB Dark Matter / Voyager, eliminación del delay/jank en el cambio de tema para transición instantánea a 60fps, y contraste mejorado en tarjetas, tablas y modales).
- Funcionalidad con DNI para choferes para hacer checkin
- Crear un tutorial para la demo y un tutorial para cuando entras por primera vez
- Los viajes deberian tener info adicional tipo motivo no?

- [x] Que lo de Crear sitio con google places te deje buscar lugares especificas, o que te deje meter un link de google maps y de ahi obtiene las coords exactas (soporte para links estándar, links cortos maps.app.goo.gl y búsqueda Nominatim/Places con autocompletado en Sitios y Viajes).
- [x] Fixear el + + Nuevo Sitio (y + + Nuevo Chofer) unificando botones con icono Plus + texto sin signo '+' redundante.
- [x] Fixear las geocercas que se puedan crear y que se vean (soporte completo de centro [lat, lng] en schema, prevención de doble stringificación en BD y fallback dinámico en sesión demo).
- [x] Que cuando creas geocercas, en los grupos aparezcan los grupos de vehículos que existen en la empresa; si no hay grupos de vehículos no se puede seleccionar la opción de grupos (gating y estado deshabilitado en pestaña Grupos).

