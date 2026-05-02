# Estrategia YouTube (Scraping Real)

## Objetivo

Ingerir metadata y transcripts de `@starterstory` de manera real, incremental y auditable.

## Flujo propuesto

1. Resolver `channel_id` desde handle `@starterstory` (API search/channels).
2. Listar videos con paginación (`playlistItems` de uploads o `search` por canal).
3. Para cada `video_id`, consultar `videos.list(part=snippet,contentDetails,statistics)`.
4. Upsert de `videos` y snapshot de métricas.
5. Obtener transcript (múltiples estrategias) y guardar con fuente.
6. Registrar corrida en `scraper_runs`.

## Incrementalidad

- No reprocesar metadata estática si el video ya existe.
- Reconsultar solo métricas cambiantes en ventana configurable.
- Transcript:
  - si no existe, intentar obtener.
  - si existe, no reextraer salvo forzado/manual.

## Campos obligatorios

- `video_id`, `channel_id`, `title`, `description`, `published_at`, `url`, `thumbnail_url`
- `duration`, `view_count`, `like_count`, `comment_count`, `tags`
- `transcript`, `transcript_source`, `raw_metadata`, timestamps

## Manejo ético y robustez

- Respetar límites de API y usar backoff exponencial.
- Manejar faltantes (`likes/comments/tags`) sin fallar corrida.
- No bypass de mecanismos de protección.

## Scheduler configurable desde UI

Opciones:
- Cada X horas
- Diario
- Semanal
- Pausado/activo

Persistencia:
- configuración en `scraper_settings`
- reconciliación contra job scheduler real

## Evidencias de cumplimiento

- `scraper_runs` con `start_time`, `end_time`, `status`, `videos_found`, `videos_created`, `videos_updated`, `errors`, `duration_ms`.
- Mínimo dos corridas con timestamps distintos.
- Query de control: total videos >= 30.
