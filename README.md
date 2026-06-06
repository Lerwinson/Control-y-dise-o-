# Furniture Structure Designer Pro

Plataforma web industrial para **diseño técnico de muebles, sofás, camas, bases, colchones y estructuras de madera**. Permite diseñar en 2D y 3D, generar **vistas explotadas** tipo planos industriales, calcular **lista de materiales (BOM)** y **costos**, gestionar **producción** y exportar documentación técnica.

> **DESARROLLADO POR: LERWINSON MENDOZA**

---

## Demo rápida

La app es **100% client-side** y carga sus librerías (Three.js, Tailwind, fuentes) desde CDN **en el navegador**. No requiere `npm install`.

Como usa ES Modules + importmap, debe servirse por HTTP (no `file://`):

```bash
# Opción 1: Python
python3 -m http.server 8080
# luego abre http://localhost:8080

# Opción 2: Node (npx serve)
npx serve .

# Opción 3: GitHub Pages
# Settings → Pages → Deploy from branch (root)
```

Pantalla de acceso: **demo** — usa cualquier correo y contraseña.

---

## Funcionalidades implementadas

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs, proyectos recientes, distribución de costos, estado de producción, acciones rápidas |
| **Top panel** | Buscador global, notificaciones, idioma, perfil, estado del sistema en línea |
| **Proyectos / Catálogo** | Sofás, Camas, Colchones, Muebles + crear, duplicar, eliminar, versionado |
| **Biblioteca de piezas** | Plantillas por categoría (sofás, camas, bases, mesas, closets, etc.) |
| **Diseño 2D** | Canvas con rejilla, imán, zoom, herramientas Línea/Rectángulo/Polígono/Medición, acotación, edición en vivo, export PNG/SVG |
| **Diseño 3D** | Three.js + OrbitControls, vistas frontal/lateral/superior/isométrica, rotación, wireframe, añadir bloques, export PNG |
| **Vista explotada** | Separación automática de piezas, numeración, medidas y etiquetas tipo plano industrial |
| **Sistema de piezas** | Código, nombre, categoría, material, largo/ancho/espesor, cantidad, peso, costo, observaciones, color — todo editable |
| **BOM automática** | Consumo de madera/espuma/tela, herrajes, peso total — recálculo en tiempo real |
| **Costos** | Materia prima, mano de obra, transporte, impuestos, indirectos, margen, precio final + gráficos |
| **Producción** | Etapas Diseño → Corte → Armado → Tapizado → Acabado → Finalizado con % de avance |
| **Reportes** | Producción diaria/semanal/mensual, costos, material consumido, rentabilidad + export CSV |
| **Multiidioma** | Español / Português con cambio instantáneo |
| **Asistente IA** | Generar estructuras paramétricas, recomendar materiales, detectar errores, optimizar consumo |
| **Exportaciones** | PDF técnico (print), PNG, SVG, CSV/Excel |
| **Seguridad** | Login / registro / roles y permisos (demo), recuperación |
| **Almacenamiento** | Guardado, duplicado, versionado automático, backup/restore (localStorage + JSON) |

---

## Diseño visual

- Paleta: Negro `#000000` · Rojo `#FF0000` · Rojo oscuro `#8B0000`
- Fondo degradado rojo → negro, efecto iridiscente, glassmorphism, sombras neón, bordes luminosos
- Responsive (PC / Tablet / Smartphone)

---

## Arquitectura

```
index.html            # shell + CDN (Tailwind, Three.js importmap, fuentes)
css/styles.css        # efectos neón / glass / iridiscente
js/
  app.js              # auth, layout, router (hash), idioma
  store.js            # estado + persistencia localStorage + versionado
  data.js             # materiales, plantillas, datos de ejemplo
  calc.js             # motor BOM + costos
  i18n.js             # ES / PT
  ui/                 # icons, toasts/modales, charts SVG
  utils/              # helpers + exportadores
  modules/            # dashboard, projects, catalog, library, designer2d,
                      # designer3d, bom, costs, production, reports, ai, settings
```

### Nota sobre el stack solicitado (Next.js / Express / Prisma / PostgreSQL)

El entorno de construcción no tiene acceso al registro de npm, por lo que no fue posible
compilar un proyecto Next.js/Express con dependencias instaladas. Esta versión entrega
**toda la funcionalidad central funcionando** como app estática portátil. La capa lógica
(`store.js`, `calc.js`, modelos en `data.js`) está aislada para migrarse luego a:

- **Frontend:** Next.js + React + TypeScript + TailwindCSS + ShadCN + React Three Fiber
- **Backend:** Node.js + Express + Prisma ORM
- **DB:** PostgreSQL · **Auth:** JWT con roles/permisos

---

© Furniture Structure Designer Pro — Desarrollado por **Lerwinson Mendoza**
