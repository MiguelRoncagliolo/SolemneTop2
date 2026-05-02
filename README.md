# Starter Story Intelligence Engine

Aplicación web inteligente para evaluar ideas de negocio en LATAM usando videos reales de `@starterstory`, clasificación con IA, perfil RPM y validación MVT documentada.

## Estado actual

Proyecto en construcción por sprints (entrega actual: Sprint 0 + base de Sprint 1).

- Sprint 0: documentación de arquitectura y plan.
- Sprint 1 (en progreso): scraper real + DB persistente + scheduler + logs.

## Documentación inicial

- [Arquitectura](./docs/architecture.md)
- [Plan de sprints](./docs/sprint-plan.md)
- [Modelo de datos](./docs/data-model.md)
- [Estrategia YouTube](./docs/youtube-strategy.md)
- [Prompts IA](./docs/ai-prompts.md)
- [Proceso MVT](./docs/mvt-process.md)

## Stack objetivo

- Next.js (App Router) + TypeScript estricto
- Tailwind + shadcn/ui
- Supabase PostgreSQL
- Prisma ORM
- YouTube Data API v3 + extracción de transcript
- LLM con structured outputs JSON
- Jobs en background con Trigger.dev + scheduler configurable desde UI
- Deploy en Vercel

## Requisitos de entorno

- Node.js 22+
- npm 11+
- Base PostgreSQL (Supabase recomendado)
- API key de YouTube Data API v3

## Configuración rápida

1. Copiar variables:

```bash
cp .env.example .env
```

2. Completar en `.env`:
- `DATABASE_URL`
- `YOUTUBE_API_KEY`
- `STARTER_STORY_HANDLE` (por defecto `@starterstory`)
- `SCRAPER_DEFAULT_MAX_VIDEOS` (por defecto `30`)

3. Instalar dependencias:

```bash
npm install
```

4. Generar cliente Prisma y migrar:

```bash
npm run db:generate
npm run db:migrate
```

5. Ejecutar app:

```bash
npm run dev
```

## Scripts principales

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run scraper:run`
- `npm run scraper:scheduler`
- `npm run classify:run` (placeholder Sprint 2)
- `npm run proposals:generate` (placeholder Sprint 3)

## Scheduler background

- Se incluye workflow en `.github/workflows/scraper-scheduler.yml`.
- Corre cada hora y respeta configuración guardada en `scraper_settings`:
  - intervalo
  - diario
  - semanal
  - pausado/activo

Secrets requeridos en GitHub:
- `DATABASE_URL`
- `YOUTUBE_API_KEY`
- `STARTER_STORY_HANDLE`
- `SCRAPER_DEFAULT_MAX_VIDEOS`

## Nota importante

No se hardcodearán resultados para simular scraping, clasificación o propuestas. Seeds, cuando existan, serán marcadas explícitamente como datos demo para desarrollo.
