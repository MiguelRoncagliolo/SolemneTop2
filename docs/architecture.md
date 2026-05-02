# Arquitectura Técnica

## 1) Objetivo técnico

Construir un pipeline verificable end-to-end:

1. Ingesta real de videos de YouTube (`@starterstory`) con ejecución incremental.
2. Persistencia relacional en PostgreSQL.
3. Enriquecimiento IA trazable (video -> pain point -> RPM -> propuesta).
4. UI operativa para ejecutar, observar y reconfigurar procesos (incluye scheduler).
5. Soporte de validación MVT documentada con evidencia.

## 2) Stack y decisiones

### Frontend y backend app

- `Next.js App Router + TypeScript`: full-stack coherente, API routes y Server Actions.
- `Tailwind + shadcn/ui`: velocidad de entrega y consistencia visual.

### Base de datos y acceso

- `Supabase PostgreSQL` como DB persistente gestionada.
- `Prisma ORM` como capa de acceso principal.

Justificación de Prisma vs solo Supabase client:
- Modelo relacional grande y evolutivo (20+ tablas) con relaciones complejas.
- Migraciones versionadas (`prisma migrate`) y tipado estricto.
- Más control para joins y trazabilidad analítica.
- Supabase client puede coexistir para auth/storage si luego se requiere.

### Scraping / ingestión

- `YouTube Data API v3` para metadata oficial y paginación.
- Estrategia de transcripts:
  1. Intento por API oficial de captions cuando aplique.
  2. Fallback por librería compatible (`youtube-transcript-api` vía microservicio/worker).
  3. Marcar `transcript_source` y estado de calidad.

### IA y structured outputs

- Cliente LLM desacoplado por interfaz (`OpenAI/Anthropic/Gemini`).
- Todas las salidas críticas se validan con `Zod` + JSON schema.
- Guardar prompt versionado, modelo, tokens y timestamp en tablas de análisis.

### Background jobs + scheduler configurable en UI

- `Trigger.dev` como motor de ejecución async (manual + cron dinámico).
- La UI edita `scraper_settings`; un reconciler sincroniza la programación real.
- Jobs con idempotencia e incrementalidad (upsert + checkpoints).

### Deploy

- App en Vercel.
- DB en Supabase.
- Worker Trigger.dev (cloud/self-hosted) según disponibilidad de cuenta.

## 3) Vista de alto nivel

1. Usuario configura scheduler y dispara scraper desde UI.
2. Job enumera videos del canal, procesa mínimo 30 y actualiza incrementalmente.
3. Metadata/transcripts se persisten y se registran snapshots de métricas cambiantes.
4. Clasificador IA cruza videos con pain points LATAM editables.
5. Wizard RPM produce perfil estructurado.
6. Motor de propuestas combina pain points + videos + RPM.
7. Módulo MVT documenta entrevistas, hipótesis, tests, resultados y decisión.

## 4) Estrategia de evidencia para rúbrica

- Scraping real: guardar `raw_metadata`, ids reales, timestamps y logs por corrida.
- 30+ videos: validación con query sobre tabla `videos`.
- Scheduler UI: pantalla `Scraper Settings` + job activo/pausado persistido.
- Background: runs con `trigger_run_id` y logs asincrónicos.
- Incremental: `last_scraped_at`, `last_metrics_at`, y conteo created/updated.
- Re-clasificación: trigger por cambios en pain points/RPM.
- Propuestas dinámicas: hash de dependencias para regeneración automática.
- MVT real: evidencias con links/archivos y trazabilidad por propuesta.

## 5) Riesgos técnicos y mitigaciones

- Límites API YouTube: backoff, cuota diaria, batch por ventanas.
- Disponibilidad de transcripts: fallback + bandera de cobertura.
- Costos IA: lotes pequeños, caché por hash de transcript/pain point/RPM.
- Reprocesamiento excesivo: jobs idempotentes y filtros por cambios.
- Cambios de scheduler: reconciliación explícita y auditoría en logs.

## 6) Seguridad y buenas prácticas

- Secretos en variables de entorno, nunca hardcodeados.
- `.env.example` obligatorio.
- Validación de inputs server-side con Zod.
- Logging estructurado sin datos sensibles.
