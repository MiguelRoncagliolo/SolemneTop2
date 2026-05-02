"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PainPointLite = {
  id: string;
  title: string;
  category: string;
};

type Classification = {
  id: string;
  relevanceScore: number;
  confidenceScore: number;
  categoryMatch: boolean;
  reasoning: string;
  businessModelConnection: string;
  latamAdaptationNotes: string;
  evidenceFromTranscript: string[];
  video: {
    id: string;
    title: string;
    url: string;
    publishedAt: string;
  };
  painPoint: {
    id: string;
    title: string;
    category: string;
    severity: string;
  };
};

type ClassifierStatus = {
  running: boolean;
  lastSummary: {
    processedPairs: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null;
  lastError: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
};

export function ClassifierPanel() {
  const [painPoints, setPainPoints] = useState<PainPointLite[]>([]);
  const [selectedPainPointId, setSelectedPainPointId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minRelevance, setMinRelevance] = useState(0.6);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [status, setStatus] = useState<ClassifierStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const groupedByVideo = useMemo(() => {
    const map = new Map<string, Classification[]>();
    for (const item of classifications) {
      const list = map.get(item.video.id) ?? [];
      list.push(item);
      map.set(item.video.id, list);
    }
    return Array.from(map.entries()).slice(0, 12);
  }, [classifications]);

  const groupedByPainPoint = useMemo(() => {
    const map = new Map<string, Classification[]>();
    for (const item of classifications) {
      const list = map.get(item.painPoint.id) ?? [];
      list.push(item);
      map.set(item.painPoint.id, list);
    }
    return Array.from(map.entries()).slice(0, 12);
  }, [classifications]);

  const loadPainPoints = useCallback(async () => {
    const response = await fetch("/api/pain-points");
    const json = await response.json();
    const activePoints = (json.painPoints ?? []).filter((point: { isActive: boolean }) => point.isActive);
    setPainPoints(
      activePoints.map((point: { id: string; title: string; category: string }) => ({
        id: point.id,
        title: point.title,
        category: point.category,
      })),
    );
  }, []);

  const loadClassifications = useCallback(async () => {
    const search = new URLSearchParams({
      minRelevance: String(minRelevance),
      take: "200",
    });
    if (selectedPainPointId) {
      search.set("painPointId", selectedPainPointId);
    }
    if (selectedCategory) {
      search.set("category", selectedCategory);
    }
    const response = await fetch(`/api/classifier/results?${search.toString()}`);
    const json = await response.json();
    setClassifications(json.classifications ?? []);
  }, [minRelevance, selectedCategory, selectedPainPointId]);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/classifier/run");
    const json = await response.json();
    setStatus(json);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPainPoints(), loadClassifications(), loadStatus()]);
    setLoading(false);
  }, [loadClassifications, loadPainPoints, loadStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAll]);

  async function startClassification() {
    setMessage(null);
    const response = await fetch("/api/classifier/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        painPointId: selectedPainPointId || undefined,
        maxPairs: 200,
      }),
    });
    const json = await response.json();
    setMessage(json.message ?? (json.ok ? "Clasificación iniciada." : "Error"));
    await loadStatus();
  }

  async function refreshData() {
    await Promise.all([loadClassifications(), loadStatus()]);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">Clasificador IA video × pain point</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Structured output JSON, filtros por umbral y vistas cruzadas.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-sm">
            Pain point objetivo
            <select
              className="ml-2 rounded border border-zinc-300 px-2 py-1"
              value={selectedPainPointId}
              onChange={(event) => setSelectedPainPointId(event.target.value)}
            >
              <option value="">Todos</option>
              {painPoints.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.category} - {point.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Categoría
            <select
              className="ml-2 rounded border border-zinc-300 px-2 py-1"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="">Todas</option>
              {Array.from(new Set(painPoints.map((point) => point.category))).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Umbral relevancia
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={minRelevance}
              onChange={(event) => setMinRelevance(Number(event.target.value))}
              className="ml-2 w-20 rounded border border-zinc-300 px-2 py-1"
            />
          </label>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => void startClassification()}
          >
            Clasificar / reclasificar
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            onClick={() => void refreshData()}
          >
            Refrescar resultados
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
        {status ? (
          <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <p>Estado: {status.running ? "Ejecutando" : "Idle"}</p>
            {status.lastSummary ? (
              <p>
                Última corrida: pairs {status.lastSummary.processedPairs}, created{" "}
                {status.lastSummary.created}, updated {status.lastSummary.updated}, failed{" "}
                {status.lastSummary.failed}
              </p>
            ) : null}
            {status.lastError ? <p>Error: {status.lastError}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Resultados filtrados</h3>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
        {!loading && classifications.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Sin resultados para el filtro actual. Ejecuta clasificación y refresca.
          </p>
        ) : null}
        {classifications.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-300 text-left">
                  <th className="px-2 py-2">Video</th>
                  <th className="px-2 py-2">Pain point</th>
                  <th className="px-2 py-2">Relevancia</th>
                  <th className="px-2 py-2">Confianza</th>
                  <th className="px-2 py-2">Category match</th>
                </tr>
              </thead>
              <tbody>
                {classifications.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200 align-top">
                    <td className="px-2 py-2">
                      <a
                        href={item.video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        {item.video.title}
                      </a>
                    </td>
                    <td className="px-2 py-2">
                      {item.painPoint.category} - {item.painPoint.title}
                    </td>
                    <td className="px-2 py-2">{item.relevanceScore.toFixed(2)}</td>
                    <td className="px-2 py-2">{item.confidenceScore.toFixed(2)}</td>
                    <td className="px-2 py-2">{item.categoryMatch ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-zinc-300 bg-white p-4">
          <h4 className="text-base font-semibold">Top pain points por video</h4>
          <div className="mt-3 space-y-2 text-sm">
            {groupedByVideo.map(([videoId, items]) => (
              <div key={videoId} className="rounded border border-zinc-200 p-2">
                <p className="font-medium">{items[0].video.title}</p>
                <ul className="mt-1 space-y-1 text-zinc-700">
                  {items.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      {item.painPoint.title} ({item.relevanceScore.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-zinc-300 bg-white p-4">
          <h4 className="text-base font-semibold">Top videos por pain point</h4>
          <div className="mt-3 space-y-2 text-sm">
            {groupedByPainPoint.map(([painPointId, items]) => (
              <div key={painPointId} className="rounded border border-zinc-200 p-2">
                <p className="font-medium">{items[0].painPoint.title}</p>
                <ul className="mt-1 space-y-1 text-zinc-700">
                  {items.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      {item.video.title} ({item.relevanceScore.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
