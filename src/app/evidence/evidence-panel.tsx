"use client";

import { useEffect, useState } from "react";

type EvidencePayload = {
  evidenceLinks: Array<{
    id: string;
    entityType: string;
    entityId: string;
    label: string;
    url: string;
    createdAt: string;
  }>;
  interviews: Array<{
    id: string;
    summary: string;
    evidenceLink: string | null;
    interviewDate: string;
  }>;
  tests: Array<{
    id: string;
    description: string;
    evidenceLink: string | null;
    createdAt: string;
  }>;
};

export function EvidencePanel() {
  const [data, setData] = useState<EvidencePayload | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/evidence");
    const json = await response.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="space-y-6">
      <article className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">Evidencias</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Links y soportes de entrevistas y tests MVT.
        </p>
        <button
          type="button"
          className="mt-3 rounded border border-zinc-300 px-3 py-2 text-sm"
          onClick={() => void load()}
        >
          Refrescar
        </button>
      </article>

      {loading ? <p className="text-sm text-zinc-500">Cargando...</p> : null}

      {!loading && data ? (
        <>
          <article className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">Evidence links ({data.evidenceLinks.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.evidenceLinks.map((item) => (
                <li key={item.id} className="rounded border border-zinc-200 p-2">
                  <p className="text-xs text-zinc-500">
                    {item.entityType} | {new Date(item.createdAt).toLocaleString("es-CL")}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline"
                  >
                    {item.url}
                  </a>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">Entrevistas con evidencia ({data.interviews.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.interviews.map((item) => (
                <li key={item.id} className="rounded border border-zinc-200 p-2">
                  <p>{item.summary}</p>
                  {item.evidenceLink ? (
                    <a
                      href={item.evidenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      {item.evidenceLink}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">Tests con evidencia ({data.tests.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.tests.map((item) => (
                <li key={item.id} className="rounded border border-zinc-200 p-2">
                  <p>{item.description}</p>
                  {item.evidenceLink ? (
                    <a
                      href={item.evidenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      {item.evidenceLink}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        </>
      ) : null}
    </section>
  );
}
