# Estrategia de Prompts IA (Structured Outputs)

## Reglas base

- Todo output IA crítico debe cumplir JSON schema validado con Zod.
- Guardar `model`, `provider`, `prompt_version`, `input_hash`.
- Si falla validación, reintento controlado y luego estado de error persistido.

## Prompt 1: Clasificación Video x Pain Point

### Input

- Título, descripción, transcript resumido del video.
- Pain point (título, categoría, evidencia, severidad, región, fuentes).

### Output schema

```json
{
  "relevance_score": 0.0,
  "category_match": true,
  "reasoning": "string",
  "business_model_connection": "string",
  "latam_adaptation_notes": "string",
  "confidence_score": 0.0,
  "evidence_from_transcript": ["string"]
}
```

## Prompt 2: Detección de vaguedad RPM

### Objetivo

Detectar respuestas genéricas e indicar qué falta en R/P/M.

### Output schema

```json
{
  "is_vague": true,
  "missing_fields": ["string"],
  "follow_up_questions": ["string"],
  "specificity_score": 0
}
```

## Prompt 3: Interpretación estructurada de RPM

### Output schema

```json
{
  "interests": ["string"],
  "constraints": ["string"],
  "available_time_per_week": 0,
  "capital_available": "string",
  "skills": ["string"],
  "preferred_business_models": ["string"],
  "risk_tolerance": "low|medium|high",
  "ambition_level": "low|medium|high",
  "geographic_focus": ["string"],
  "impact_goals": ["string"],
  "dealbreakers": ["string"],
  "summary": "string",
  "warnings_or_gaps": ["string"]
}
```

## Prompt 4: Generación de propuestas

### Input

- Top pain points clasificados por relevancia.
- Perfil RPM estructurado.
- Evidencia de videos fuente.

### Output schema resumido

```json
{
  "proposals": [
    {
      "title": "string",
      "pain_point_id": "uuid",
      "solution": "string",
      "target_customers": "string",
      "latam_fit_reason": "string",
      "video_sources": [{"video_id": "uuid", "usage_notes": "string"}],
      "difficulty": "low|medium|high",
      "capital_estimate": "string",
      "required_skills": ["string"],
      "first_mvt_suggestion": "string",
      "fit_score": 0,
      "score_breakdown": {
        "pain_severity": 0,
        "rpm_fit": 0,
        "feasibility": 0,
        "video_evidence": 0,
        "tech_reg_complexity": 0
      }
    }
  ]
}
```

## Versionado

- `PROMPT_VERSION` por módulo (`classifier.v1`, `rpm.v1`, `proposal.v1`).
- Incrementar versión cuando cambie estructura, instrucciones o scoring.
