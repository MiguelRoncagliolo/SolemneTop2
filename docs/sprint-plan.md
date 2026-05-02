# Sprint Plan

## Sprint 0 — Fundación

Entregables:
- Estructura base del repo.
- Documentación técnica inicial.
- Checklist de rúbrica con evidencias verificables.

Criterio de salida:
- Decisiones de arquitectura cerradas y riesgos identificados.

## Sprint 1 — Scraper + DB (prioridad inmediata)

Objetivo:
- Pipeline real desde YouTube a PostgreSQL con 30+ videos mínimos.

Entregables:
- Proyecto Next.js + TypeScript + Tailwind + shadcn.
- Prisma schema v1 + migración inicial.
- Tabla de `scraper_runs` y logs visibles en UI.
- Ingesta metadata + transcripts + snapshots de métricas.
- Scheduler configurable en UI (X horas, diario, semanal, pausado/activo).
- Ejecución background e incremental.

Pruebas de aceptación:
- 2 corridas con timestamps distintos.
- `videos >= 30`.
- `videos_created`, `videos_updated`, `errors` registrados.

## Sprint 2 — Pain Points + Clasificador

Objetivo:
- CRUD de investigación LATAM + clasificación video x pain point.

Entregables:
- 8+ pain points con fuentes citadas.
- Clasificación con structured output y score.
- Filtros y pantallas cruzadas (por video / por pain point).
- Reclasificación al modificar pain point.

Pruebas de aceptación:
- Clasificaciones persistidas y trazables por versión de prompt/modelo.

## Sprint 3 — RPM + Motor de Soluciones

Objetivo:
- Wizard RPM real y generación de 4+ propuestas dinámicas.

Entregables:
- Flujo por pasos R/P/M con detección de vaguedad.
- Interpretación IA estructurada editable.
- Motor de propuestas con scoring y fuentes de video.
- Regeneración al cambiar RPM/pain points/videos.

Pruebas de aceptación:
- 4+ propuestas con links reales y score desglosado.

## Sprint 4 — MVT

Objetivo:
- Documentar validación real end-to-end sobre una propuesta.

Entregables:
- Entrevistas, hipótesis, tests, análisis y decisión.
- Gestión de evidencias (link/archivo).

Pruebas de aceptación:
- Al menos 5 entrevistas y evidencia visible.

## Sprint 5 — Pulido y evaluación

Objetivo:
- Endurecer la app para prueba destructiva.

Entregables:
- Corrección P1.
- README final de máquina limpia.
- Checklist de demo (<= 5 min).
- Autoevaluación por rúbrica.

## Dependencias críticas

- API key YouTube válida.
- Proveedor LLM y key.
- Proyecto Supabase.
- Cuenta Trigger.dev (o alternativa validada).
