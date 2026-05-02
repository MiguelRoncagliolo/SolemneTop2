"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Source = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  citationText: string;
};

type PainPoint = {
  id: string;
  title: string;
  category: string;
  description: string;
  evidence: string;
  regionCountry: string | null;
  severity: "low" | "medium" | "high" | "critical";
  digitalOpportunity: string;
  isActive: boolean;
  sources: Source[];
  _count: { classifications: number };
};

type FormState = {
  title: string;
  category: string;
  description: string;
  evidence: string;
  regionCountry: string;
  severity: "low" | "medium" | "high" | "critical";
  digitalOpportunity: string;
  sourceName: string;
  sourceUrl: string;
  citationText: string;
};

const initialForm: FormState = {
  title: "",
  category: "fintech",
  description: "",
  evidence: "",
  regionCountry: "LatAm",
  severity: "high" as const,
  digitalOpportunity: "",
  sourceName: "",
  sourceUrl: "",
  citationText: "",
};

export function PainPointsPanel() {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(painPoints.map((point) => point.category))).sort(),
    [painPoints],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/pain-points");
    const json = await response.json();
    setPainPoints(json.painPoints ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function createPainPoint() {
    setMessage(null);
    const response = await fetch("/api/pain-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        description: form.description,
        evidence: form.evidence,
        regionCountry: form.regionCountry,
        severity: form.severity,
        digitalOpportunity: form.digitalOpportunity,
        source: {
          sourceName: form.sourceName,
          sourceUrl: form.sourceUrl,
          citationText: form.citationText,
        },
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Pain point creado." : json.message ?? "Error");
    if (json.ok) {
      setForm(initialForm);
      await load();
    }
  }

  async function seedPainPoints() {
    setMessage(null);
    const response = await fetch("/api/pain-points/seed", { method: "POST" });
    const json = await response.json();
    setMessage(
      json.ok
        ? `Seed completado: creados ${json.created}, omitidos ${json.skipped}.`
        : json.message ?? "Error",
    );
    await load();
  }

  async function deletePainPoint(id: string) {
    setMessage(null);
    const response = await fetch(`/api/pain-points/${id}`, { method: "DELETE" });
    const json = await response.json();
    setMessage(json.ok ? "Pain point desactivado." : json.message ?? "Error");
    await load();
  }

  async function saveEdit(point: PainPoint) {
    const source = point.sources[0];
    const response = await fetch(`/api/pain-points/${point.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: point.title,
        category: point.category,
        description: point.description,
        evidence: point.evidence,
        regionCountry: point.regionCountry ?? "LatAm",
        severity: point.severity,
        digitalOpportunity: point.digitalOpportunity,
        source: source
          ? {
              sourceName: source.sourceName,
              sourceUrl: source.sourceUrl,
              citationText: source.citationText,
            }
          : undefined,
      }),
    });
    const json = await response.json();
    setMessage(
      json.ok
        ? "Pain point actualizado. Se lanzó reclasificación automática."
        : json.message ?? "Error",
    );
    setEditingId(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Pain Points LATAM</h2>
            <p className="mt-1 text-sm text-zinc-600">
              CRUD de pain points con fuente citada y evidencia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void seedPainPoints()}
            className="rounded bg-zinc-800 px-3 py-2 text-sm font-semibold text-white"
          >
            Cargar 8+ pain points base
          </button>
        </div>
        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Crear pain point</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Título" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
          <Input label="Categoría" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
          <Input label="Región/país" value={form.regionCountry} onChange={(value) => setForm((current) => ({ ...current, regionCountry: value }))} />
          <Select
            label="Severidad"
            value={form.severity}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                severity: value as "low" | "medium" | "high" | "critical",
              }))
            }
            options={["low", "medium", "high", "critical"]}
          />
          <TextArea
            label="Descripción"
            value={form.description}
            onChange={(value) => setForm((current) => ({ ...current, description: value }))}
          />
          <TextArea
            label="Evidencia concreta"
            value={form.evidence}
            onChange={(value) => setForm((current) => ({ ...current, evidence: value }))}
          />
          <TextArea
            label="Oportunidad digital/tecnológica"
            value={form.digitalOpportunity}
            onChange={(value) =>
              setForm((current) => ({ ...current, digitalOpportunity: value }))
            }
          />
          <Input
            label="Fuente"
            value={form.sourceName}
            onChange={(value) => setForm((current) => ({ ...current, sourceName: value }))}
          />
          <Input
            label="URL fuente"
            value={form.sourceUrl}
            onChange={(value) => setForm((current) => ({ ...current, sourceUrl: value }))}
          />
          <TextArea
            label="Cita resumida"
            value={form.citationText}
            onChange={(value) => setForm((current) => ({ ...current, citationText: value }))}
          />
        </div>
        <button
          type="button"
          className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void createPainPoint()}
        >
          Guardar pain point
        </button>
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Pain points registrados ({painPoints.length})</h3>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
        {!loading && painPoints.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No hay pain points aún.</p>
        ) : null}
        {categories.length > 0 ? (
          <p className="mt-2 text-xs text-zinc-500">Categorías: {categories.join(", ")}</p>
        ) : null}
        <div className="mt-3 space-y-3">
          {painPoints.map((point) => {
            const source = point.sources[0];
            const isEditing = editingId === point.id;

            return (
              <article key={point.id} className="rounded border border-zinc-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{point.title}</p>
                    <p className="text-xs text-zinc-600">
                      {point.category} | severidad: {point.severity} | clasificaciones:{" "}
                      {point._count.classifications}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                      onClick={() => setEditingId(isEditing ? null : point.id)}
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                      onClick={() => void deletePainPoint(point.id)}
                    >
                      Desactivar
                    </button>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="mt-2 space-y-1 text-sm text-zinc-700">
                    <p>{point.description}</p>
                    <p>
                      <span className="font-medium">Evidencia:</span> {point.evidence}
                    </p>
                    <p>
                      <span className="font-medium">Oportunidad:</span>{" "}
                      {point.digitalOpportunity}
                    </p>
                    {source ? (
                      <p>
                        <span className="font-medium">Fuente:</span> {source.sourceName} -{" "}
                        <a
                          href={source.sourceUrl}
                          className="text-blue-700 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.sourceUrl}
                        </a>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <PainPointEditor
                    painPoint={point}
                    onChange={(nextPoint) =>
                      setPainPoints((current) =>
                        current.map((item) => (item.id === point.id ? nextPoint : item)),
                      )
                    }
                    onSave={() => void saveEdit(point)}
                  />
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PainPointEditor({
  painPoint,
  onChange,
  onSave,
}: {
  painPoint: PainPoint;
  onChange: (next: PainPoint) => void;
  onSave: () => void;
}) {
  const source = painPoint.sources[0];

  return (
    <div className="mt-3 grid gap-2">
      <Input
        label="Título"
        value={painPoint.title}
        onChange={(value) => onChange({ ...painPoint, title: value })}
      />
      <Input
        label="Categoría"
        value={painPoint.category}
        onChange={(value) => onChange({ ...painPoint, category: value })}
      />
      <TextArea
        label="Descripción"
        value={painPoint.description}
        onChange={(value) => onChange({ ...painPoint, description: value })}
      />
      <TextArea
        label="Evidencia"
        value={painPoint.evidence}
        onChange={(value) => onChange({ ...painPoint, evidence: value })}
      />
      <TextArea
        label="Oportunidad digital"
        value={painPoint.digitalOpportunity}
        onChange={(value) => onChange({ ...painPoint, digitalOpportunity: value })}
      />
      {source ? (
        <>
          <Input
            label="Fuente"
            value={source.sourceName}
            onChange={(value) =>
              onChange({
                ...painPoint,
                sources: [{ ...source, sourceName: value }],
              })
            }
          />
          <Input
            label="URL fuente"
            value={source.sourceUrl}
            onChange={(value) =>
              onChange({
                ...painPoint,
                sources: [{ ...source, sourceUrl: value }],
              })
            }
          />
          <TextArea
            label="Cita"
            value={source.citationText}
            onChange={(value) =>
              onChange({
                ...painPoint,
                sources: [{ ...source, citationText: value }],
              })
            }
          />
        </>
      ) : null}
      <button
        type="button"
        className="mt-1 w-fit rounded bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
        onClick={onSave}
      >
        Guardar cambios
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <textarea
        className="mt-1 min-h-20 w-full rounded border border-zinc-300 px-2 py-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <select
        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
