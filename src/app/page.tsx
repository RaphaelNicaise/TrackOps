export default function Home() {
  const services = [
    {
      name: "PostgreSQL + PostGIS",
      status: "Activo en Dev",
      port: "5432",
      url: "postgresql://postgres:postgres@localhost:5432/prada_db",
      desc: "Base de datos relacional con extensiones geoespaciales para tracking GPS.",
      badge: "Database",
    },
    {
      name: "PGAdmin 4",
      status: "Activo en Dev",
      port: "5050",
      url: "http://localhost:5050",
      desc: "Panel GUI web para administrar PostgreSQL (User: admin@admin.com / Pass: admin).",
      badge: "Admin",
    },
    {
      name: "Portainer CE",
      status: "Activo en Dev",
      port: "9000",
      url: "http://localhost:9000",
      desc: "Administración visual de contenedores, imágenes y volúmenes Docker.",
      badge: "DevOps",
    },
    {
      name: "MinIO Storage (S3)",
      status: "Activo en Dev",
      port: "9001 (Console) / 9002 (API)",
      url: "http://localhost:9001",
      desc: "Servidor de almacenamiento de objetos compatible con S3 (MinIO Console).",
      badge: "Storage",
    },
    {
      name: "Umami Analytics",
      status: "Activo en Dev",
      port: "3002",
      url: "http://localhost:3002",
      desc: "Plataforma de analítica web auto-hospedada privacy-focused.",
      badge: "Analytics",
    },
    {
      name: "Next.js Fullstack App",
      status: "Activo en Dev",
      port: "3000",
      url: "http://localhost:3000",
      desc: "App principal con Node, React, TanStack, TypeScript y Drizzle ORM.",
      badge: "Fullstack",
    },
  ];

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <span style={{ 
          background: "rgba(56, 189, 248, 0.1)", 
          color: "var(--primary)", 
          padding: "0.25rem 0.75rem", 
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: "600"
        }}>
          ENTORNO DEV DOCKER
        </span>
        <h1 style={{ fontSize: "2.5rem", marginTop: "0.75rem", fontWeight: "800" }}>
          PRADA — Servicios & Estado de Infraestructura
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem", fontSize: "1.1rem" }}>
          Panel de desarrollo con Postgres (PostGIS), PGAdmin, Portainer, MinIO, Umami Analytics y Drizzle ORM.
        </p>
      </header>

      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {services.map((svc) => (
          <div 
            key={svc.name}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ 
                  background: "var(--muted)", 
                  color: "var(--muted-foreground)", 
                  fontSize: "0.75rem", 
                  padding: "0.2rem 0.6rem", 
                  borderRadius: "6px",
                  fontWeight: "600"
                }}>
                  {svc.badge}
                </span>
                <span style={{ 
                  color: "#4ade80", 
                  fontSize: "0.85rem", 
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
                  {svc.status}
                </span>
              </div>

              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.5rem" }}>{svc.name}</h2>
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", marginBottom: "1rem" }}>{svc.desc}</p>
            </div>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                Puerto: <strong style={{ color: "var(--foreground)" }}>{svc.port}</strong>
              </div>
              {svc.url.startsWith("http") ? (
                <a 
                  href={svc.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    width: "100%",
                    textAlign: "center",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "0.9rem"
                  }}
                >
                  Abrir Servicio &rarr;
                </a>
              ) : (
                <code style={{ 
                  display: "block", 
                  background: "var(--muted)", 
                  padding: "0.4rem 0.6rem", 
                  borderRadius: "6px", 
                  fontSize: "0.8rem",
                  wordBreak: "break-all" 
                }}>
                  {svc.url}
                </code>
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
