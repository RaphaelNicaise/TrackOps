| Servicio | URL Local | Puerto | Usuario / Email | Contraseña / Clave | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js App** | [http://localhost:3000](http://localhost:3000) | `3000` | — | — | App Fullstack en modo Dev |
| **PGAdmin 4** | [http://localhost:5050](http://localhost:5050) | `5050` | `admin@admin.com` | `admin` | Configurado en `.env` (`PGADMIN_...`) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | `9001` | `minioadmin` | `minioadmin` | S3 Console (API en puerto `9002`) |
| **Umami Analytics** | [http://localhost:3002](http://localhost:3002) | `3002` | `admin` | `umami` | Usuario y clave por defecto de Umami |
| **Portainer CE** | [http://localhost:9000](http://localhost:9000) | `9000` | Te pide registrarlo | Te pide registrarlo | Infraestructura 24/7 permanente |
| **PostgreSQL DB** | [http://localhost:5432](http://localhost:5432) | `5432` | `postgres` | `postgres` | Base de datos principal (`prada_db`) |

---



### 1. Infraestructura Permanente (Portainer 24/7)
Se ejecuta una sola vez. No se apaga cuando detienes los servicios de la aplicación:

```bash
docker compose -f docker-compose.infra.yml up -d
```

### 2. Servicios de Aplicación (App, DB, MinIO, Umami, PGAdmin)
Para levantar todos los servicios del proyecto:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Para apagar la aplicación y la base de datos (sin apagar Portainer):

```bash
docker compose -f docker-compose.dev.yml down
```
