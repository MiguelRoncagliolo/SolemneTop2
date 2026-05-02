"use client";

import { useEffect, useState } from "react";

type Proposal = {
  id: string;
  title: string;
  category: string;
  fitScore: number;
  difficulty: "low" | "medium" | "high";
  capitalEstimate: string;
  requiredSkills: string[];
  firstMvtSuggestion: string;
  targetCustomers: string;
  proposedSolution: string;
  latamFitReason: string;
  latamAdaptation: string;
  rpmAlignment: string;
  constraintsConsidered: string;
  scoreBreakdown: {
    pain_severity?: number;
    rpm_fit?: number;
    feasibility?: number;
    video_evidence?: number;
    tech_reg_complexity?: number;
  };
  painPoint: {
    title: string;
    category: string;
    evidence: string;
  };
  videoSources: Array<{
    id: string;
    usageNotes: string;
    video: {
      title: string;
      url: string;
    };
  }>;
};

type ProposalsApiStatus = {
  running: boolean;
  lastError: string | null;
  lastResult: { createdCount: number } | null;
};

export function ProposalsPanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [status, setStatus] = useState<ProposalsApiStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/proposals");
    const json = await response.json();
    setProposals(json.proposals ?? []);
    setStatus(json.status ?? null);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function generate() {
    setMessage(null);
    const response = await fetch("/api/proposals/generate", { method: "POST" });
    const json = await response.json();
    setMessage(json.ok ? "Propuestas regeneradas." : json.message ?? "Error");
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">Motor de Propuestas</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Cruza pain points LATAM, clasificaciones IA y perfil RPM para generar propuestas dinamicas.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => void generate()}
          >
            Generar / regenerar propuestas
          </button>
          <button
            type="button"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            onClick={() => void load()}
          >
            Refrescar
          </button>
        </div>
        {status ? (
          <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <p>Estado: {status.running ? "Generando" : "Idle"}</p>
            {status.lastResult ? <p>Ultima corrida: {status.lastResult.createdCount} propuestas.</p> : null}
            {status.lastError ? <p>Error: {status.lastError}</p> : null}
          </div>
        ) : null}
        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Propuestas activas ({proposals.length})</h3>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
        {!loading && proposals.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No hay propuestas aun. Completa RPM, ejecuta clasificacion y genera propuestas.
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          {proposals.map((proposal) => (
            <article key={proposal.id} className="rounded border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">{proposal.title}</h4>
                <span className="rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                  Fit {proposal.fitScore}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Pain point:</span> {proposal.painPoint.title}
              </p>
              <p className="text-sm text-zinc-700">
                <span className="font-medium">Categoria:</span> {proposal.category}
              </p>
              <p className="mt-2 text-sm text-zinc-700">{proposal.proposedSolution}</p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Clientes objetivo:</span> {proposal.targetCustomers}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Por que funciona en LATAM:</span> {proposal.latamFitReason}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Adaptacion LATAM:</span> {proposal.latamAdaptation}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Alineacion RPM:</span> {proposal.rpmAlignment}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Restricciones:</span> {proposal.constraintsConsidered}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Dificultad:</span> {proposal.difficulty} |{" "}
                <span className="font-medium">Capital:</span> {proposal.capitalEstimate}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Skills:</span> {proposal.requiredSkills.join(", ")}
              </p>
              <p className="mt-1 text-sm text-zinc-700">
                <span className="font-medium">Primer MVT:</span> {proposal.firstMvtSuggestion}
              </p>

              <div className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-700">
                <p className="font-medium">Desglose score</p>
                <p>
                  severidad {proposal.scoreBreakdown?.pain_severity ?? "-"} | rpm_fit{" "}
                  {proposal.scoreBreakdown?.rpm_fit ?? "-"} | viabilidad{" "}
                  {proposal.scoreBreakdown?.feasibility ?? "-"} | evidencia videos{" "}
                  {proposal.scoreBreakdown?.video_evidence ?? "-"} | complejidad tech/reg{" "}
                  {proposal.scoreBreakdown?.tech_reg_complexity ?? "-"}
                </p>
              </div>

              <div className="mt-2 text-sm">
                <p className="font-medium">Videos fuente</p>
                <ul className="mt-1 space-y-1">
                  {proposal.videoSources.map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        {source.video.title}
                      </a>{" "}
                      - {source.usageNotes}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
