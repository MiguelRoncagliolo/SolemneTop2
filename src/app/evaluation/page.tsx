"use client";

import { useEffect, useState } from "react";

type RubricItem = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

type RubricSnapshot = {
  generatedAt: string;
  readyForDemo: boolean;
  blockers: string[];
  stats: Record<string, number>;
  items: RubricItem[];
};

const docs = [
  { name: "Arquitectura", path: "/docs/architecture.md" },
  { name: "Plan de Sprints", path: "/docs/sprint-plan.md" },
  { name: "Modelo de Datos", path: "/docs/data-model.md" },
  { name: "Estrategia YouTube", path: "/docs/youtube-strategy.md" },
  { name: "Prompts IA", path: "/docs/ai-prompts.md" },
  { name: "Proceso MVT", path: "/docs/mvt-process.md" },
];

export default function EvaluationPage() {
  const [snapshot, setSnapshot] = useState<RubricSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSnapshot() {
    setLoading(true);
    const response = await fetch("/api/evaluation/check");
    const json = await response.json();
    setSnapshot(json);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSnapshot();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="space-y-6">
      <article className="rounded-lg border border-zinc-300 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Evaluacion y destructive testing</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Verificacion automatica de cumplimiento por rubrica.
            </p>
          </div>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            onClick={() => void loadSnapshot()}
          >
            Refrescar chequeo
          </button>
        </div>

        {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
        {snapshot ? (
          <div className="mt-4">
            <p className="text-sm">
              Estado global:{" "}
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  snapshot.readyForDemo
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {snapshot.readyForDemo ? "Listo para demo" : "Pendiente"}
              </span>
            </p>
            {!snapshot.readyForDemo ? (
              <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Bloqueos actuales:</p>
                <ul className="mt-1 list-disc pl-5">
                  {snapshot.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {snapshot ? (
        <article className="rounded-lg border border-zinc-300 bg-white p-6">
          <h3 className="text-lg font-semibold">Checklist de rubrica</h3>
          <div className="mt-3 space-y-2">
            {snapshot.items.map((item) => (
              <div key={item.key} className="rounded border border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      item.passed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {item.passed ? "OK" : "Pendiente"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="rounded-lg border border-zinc-300 bg-white p-6">
        <h3 className="text-lg font-semibold">Documentos de soporte</h3>
        <ul className="mt-3 space-y-2">
          {docs.map((doc) => (
            <li key={doc.path} className="rounded border border-zinc-200 px-3 py-2 text-sm">
              <p className="font-medium">{doc.name}</p>
              <p className="text-zinc-600">{doc.path}</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
