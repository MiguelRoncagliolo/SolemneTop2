# Modelo de Datos (PostgreSQL + Prisma)

## Principios

- Multi-canal desde el diseño.
- Separación estricta entre metadata, transcript, análisis IA y propuesta.
- Históricos de métricas para series temporales.
- Trazabilidad completa de decisiones.

## Entidades principales

### Ingesta

- `channels`
  - id (uuid), youtube_channel_id (unique), handle, title, url, created_at, updated_at
- `videos`
  - id, channel_id (fk), youtube_video_id (unique), title, description, published_at, url, thumbnail_url, duration_seconds
  - view_count, like_count, comment_count, tags (text[])
  - raw_metadata (jsonb), first_seen_at, last_seen_at, last_metrics_at, created_at, updated_at
- `video_metric_snapshots`
  - id, video_id (fk), captured_at, view_count, like_count, comment_count, raw_metrics (jsonb)
- `transcripts`
  - id, video_id (fk unique), transcript_text, language_code, transcript_source, fetched_at, quality_score, raw_transcript (jsonb)
- `scraper_runs`
  - id, channel_id (fk), start_time, end_time, status, videos_found, videos_created, videos_updated, errors_count, errors_json (jsonb), duration_ms, trigger_run_id
- `scraper_settings`
  - id, channel_id (fk unique), schedule_type (`interval|daily|weekly|paused`), interval_hours, daily_time, weekly_day, weekly_time, timezone, is_active, updated_by, updated_at

### Investigación LATAM

- `pain_points`
  - id, title, category, description, evidence, region_country, severity (`low|medium|high|critical`), digital_opportunity, is_active, created_at, updated_at
- `pain_point_sources`
  - id, pain_point_id (fk), source_name, source_url, citation_text, published_at, created_at

### IA de clasificación

- `video_ai_analyses`
  - id, video_id (fk), analysis_type, model_provider, model_name, prompt_version, input_hash, output_json (jsonb), created_at
- `video_pain_point_classifications`
  - id, video_id (fk), pain_point_id (fk), relevance_score, category_match, reasoning, business_model_connection, latam_adaptation_notes, confidence_score, evidence_from_transcript, model_name, prompt_version, created_at, updated_at
  - unique(video_id, pain_point_id)

### RPM

- `rpm_profiles`
  - id, user_id nullable, status (`draft|completed`), version, is_active, created_at, updated_at
- `rpm_answers`
  - id, rpm_profile_id (fk), step (`R|P|M`), question_key, answer_text, created_at, updated_at
- `rpm_ai_interpretations`
  - id, rpm_profile_id (fk), model_name, prompt_version, structured_json (jsonb), vagueness_flags (jsonb), summary, created_at

### Propuestas

- `solution_proposals`
  - id, rpm_profile_id (fk), pain_point_id (fk), title, category, problem_evidence, proposed_solution, target_customers, latam_fit_reason, latam_adaptation, rpm_alignment, constraints_considered, difficulty, capital_estimate, required_skills (text[]), first_mvt_suggestion, fit_score, score_breakdown (jsonb), status, generated_at
- `proposal_video_sources`
  - id, proposal_id (fk), video_id (fk), usage_notes, extracted_model_elements (jsonb)

### MVT

- `mvt_validations`
  - id, proposal_id (fk), owner_user_id nullable, status, decision, decision_reasoning, next_step, created_at, updated_at
- `mvt_interviews`
  - id, validation_id (fk), contact_alias, channel, interview_date, summary, current_problem, current_solution, pain_intensity, willingness_to_pay, evidence_link, evidence_file_path, created_at
- `mvt_assumptions`
  - id, validation_id (fk), assumption_text, risk_level, is_critical, created_at
- `mvt_tests`
  - id, validation_id (fk), test_type, description, metric_definition, target_value, evidence_link, evidence_file_path, executed_at, created_at
- `mvt_results`
  - id, test_id (fk), target_metric, actual_metric, conclusion (`validated|invalidated|inconclusive`), analysis, created_at
- `evidence_links`
  - id, entity_type, entity_id, label, url, notes, created_at

## Relaciones clave a demostrar

- `solution_proposals` -> `proposal_video_sources` -> `videos`
- `solution_proposals` -> `pain_points` -> `pain_point_sources`
- `solution_proposals` -> `rpm_profiles` -> `rpm_ai_interpretations`
- `scraper_runs` + `video_metric_snapshots` para evidencia temporal

## Índices mínimos recomendados

- `videos(youtube_video_id) unique`
- `videos(channel_id, published_at desc)`
- `video_metric_snapshots(video_id, captured_at desc)`
- `video_pain_point_classifications(pain_point_id, relevance_score desc)`
- `solution_proposals(rpm_profile_id, fit_score desc)`
