# Furniture Structure Designer Pro — Next.js stack

Migración de la app a **Next.js + React + TypeScript + TailwindCSS + Three.js / React Three Fiber** (frontend) con **Node.js + Express + Prisma + PostgreSQL + JWT** (backend).

> **DESARROLLADO POR: LERWINSON MENDOZA**

---

## Requisitos

- Node.js 18+ (recomendado 20/22)
- PostgreSQL 14+ (solo si vas a usar el backend con base de datos)

---

## 1) Instalación

```bash
cd furniture-pro
npm install
cp .env.example .env   # edita DATABASE_URL y JWT_SECRET
```

## 2) Frontend (Next.js)

El frontend funciona **de forma autónoma** usando un store local (Zustand + persistencia en `localStorage`), por lo que puedes verlo sin base de datos:

```bash
npm run dev
# http://localhost:3000   (login: cualquier correo + contraseña)
```

## 3) Backend (Express + Prisma + PostgreSQL) — opcional

```bash
# genera el cliente Prisma y crea las tablas
npm run prisma:generate
npm run db:push          # o: npm run prisma:migrate
npm run prisma:seed      # usuario admin: lerwinson@fsdpro.com / admin123

# arranca la API en http://localhost:4000/api
npm run server
```

El frontend consume la API mediante `src/lib/api.ts` (URL en `NEXT_PUBLIC_API_URL`).

---

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Next.js en modo desarrollo |
| `npm run build` / `npm start` | Build y producción de Next.js |
| `npm run server` | API Express (tsx watch) |
| `npm run prisma:generate` | Genera el cliente Prisma |
| `npm run db:push` | Sincroniza el esquema con PostgreSQL |
| `npm run prisma:seed` | Carga datos de ejemplo + admin |

---

## Estructura

```
furniture-pro/
├─ prisma/
│  ├─ schema.prisma        # User, Project, Part, Version (Postgres)
│  └─ seed.ts              # admin + proyecto de ejemplo
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        # fuentes (Orbitron/Inter), fondo aurora
│  │  ├─ page.tsx          # redirección login/dashboard
│  │  ├─ login/            # autenticación (demo + listo para JWT)
│  │  └─ (dashboard)/      # shell con guard de sesión
│  │     ├─ dashboard, projects, designs
│  │     ├─ sofas, beds, mattress, furniture, library
│  │     ├─ design2d, design3d, exploded
│  │     ├─ bom, costs, production, reports
│  │     └─ ai, settings
│  ├─ components/
│  │  ├─ ui/               # Button, Card (estilo ShadCN)
│  │  ├─ layout/           # Sidebar, Topbar, Brandbar, PageHeader, nav
│  │  ├─ charts.tsx        # donut/bar/line en SVG
│  │  ├─ CatalogView.tsx
│  │  └─ three/Designer3D.tsx   # editor 3D + vista explotada (R3F)
│  ├─ lib/
│  │  ├─ types.ts, utils.ts, i18n.ts (ES/PT), data.ts
│  │  ├─ calc.ts           # motor BOM + costos
│  │  ├─ store.ts          # Zustand (persistencia local)
│  │  └─ api.ts            # cliente del backend
│  └─ server/              # Express + Prisma + JWT
│     ├─ index.ts, prisma.ts, auth.ts
│     └─ routes/{auth,projects}.ts
└─ tailwind.config.ts, tsconfig*.json, next.config.mjs
```

---

## Funcionalidades

- **Diseño 3D** con React Three Fiber + drei (OrbitControls, vistas, etiquetas) y **vista explotada** animada con piezas numeradas.
- **Diseño 2D** en canvas (rejilla, imán, línea/rectángulo/polígono/medición, zoom, export PNG).
- **Sistema de piezas** paramétrico y **BOM automática** (madera/espuma/tela/herrajes/peso).
- **Motor de costos** (materia prima, mano de obra, transporte, impuestos, indirectos, margen, precio final).
- **Producción** por etapas, **reportes** con gráficos, **multiidioma ES/PT**, **asistente IA**.
- **Auth JWT** con roles (admin/designer/production/viewer) y CRUD persistido en PostgreSQL vía Prisma.

---

## Notas de la migración

- El frontend conserva toda la lógica de la versión estática, ahora tipada en TypeScript y reactiva con Zustand.
- **Integración con el backend implementada:**
  - El login/registro usan la API real (JWT). Si el backend no responde, cae automáticamente a **modo demo offline**.
  - Al iniciar sesión con un token válido, `SyncProvider` **descarga los proyectos** desde PostgreSQL y reemplaza el estado local (`src/lib/sync.ts` → `pullProjects`).
  - El botón **Guardar** en la página BOM persiste el proyecto y sus piezas en el servidor (`saveProjectToServer`), reconciliando los IDs locales con los del servidor.
  - Mapeo API ↔ frontend en `src/lib/mappers.ts`; cliente HTTP en `src/lib/api.ts`.
- El entorno donde se generó este código no tenía acceso al registro npm, por lo que **`npm install` debe ejecutarse en tu máquina** (con internet) antes del primer `npm run dev`.

© Furniture Structure Designer Pro — Desarrollado por **Lerwinson Mendoza**
