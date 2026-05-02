# Starter Story Intelligence Engine

Aplicacion web para evaluar ideas de negocio en LATAM usando videos reales de `@starterstory`, clasificacion con IA, perfil RPM y validacion MVT.

## Estado

- Sprint 0: documentacion base completada.
- Sprint 1: scraper real + DB persistente + scheduler + logs completado.
- Sprint 2: pain points LATAM + clasificador IA completado.
- Sprint 3: RPM wizard + motor de propuestas dinamicas completado.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Prisma ORM
- YouTube Data API v3
- OpenAI Responses API con structured outputs
- GitHub Actions para scheduler background

## Configuracion

1. Copiar variables:

```bash
cp .env.example .env
```

2. Completar en `.env`:

- `DATABASE_URL` (pooler `:6543` con `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` (host directo `db.<project-ref>.supabase.co:5432`)
- `YOUTUBE_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (ejemplo: `gpt-4o-mini`)
- `STARTER_STORY_HANDLE` (default `@starterstory`)
- `SCRAPER_DEFAULT_MAX_VIDEOS` (default `30`)

3. Instalar y preparar DB:

```bash
npm install
npm run db:generate
npm run db:migrate
```

4. Ejecutar app:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run scraper:run`
- `npm run scraper:scheduler`
- `npm run classify:run`
- `npm run proposals:generate`

## Sprint 2 (Pain Points + Clasificador)

Incluye:
- CRUD de pain points con fuente y evidencia.
- Seed de 8+ pain points LATAM reales con fuentes citadas.
- Clasificacion video x pain point con structured JSON.
- Boton de clasificar/reclasificar.
- Reclasificacion automatica cuando se edita un pain point.
- Vista por video (top pain points) y por pain point (top videos).
- Filtros por categoria, pain point y umbral de relevancia.

## Sprint 3 (RPM + Propuestas)

Incluye:
- Wizard RPM por pasos R/P/M con ayuda contextual.
- Deteccion IA de respuestas vagas por paso.
- Interpretacion estructurada RPM persistida en DB.
- Motor de propuestas con 4+ salidas (JSON estructurado).
- Propuestas trazables a pain points y videos fuente.
- Regeneracion dinamica al cambiar RPM/pain points o al actualizar videos.

## Scheduler background

Workflow: `.github/workflows/scraper-scheduler.yml`

Secrets requeridos:
- `DATABASE_URL`
- `DIRECT_URL`
- `YOUTUBE_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `STARTER_STORY_HANDLE`
- `SCRAPER_DEFAULT_MAX_VIDEOS`

## Nota

No hay resultados hardcodeados para simular scraping o clasificacion. Seeds se identifican como datos base para investigacion y desarrollo.
