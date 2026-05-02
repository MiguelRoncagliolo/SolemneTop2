"use client";

import { useEffect, useMemo, useState } from "react";

type ProposalOption = {
  id: string;
  title: string;
  fitScore: number;
  category: string;
  painPoint: { title: string };
};

type ValidationSummary = {
  id: string;
  status: string;
  decision: string | null;
  proposal: { title: string };
  _count: { interviews: number; assumptions: number; tests: number };
};

type ValidationDetail = {
  id: string;
  status: string;
  decision: string | null;
  decisionReasoning: string | null;
  nextStep: string | null;
  proposal: { title: string; firstMvtSuggestion: string };
  interviews: Array<{
    id: string;
    contactAlias: string;
    channel: string;
    interviewDate: string;
    summary: string;
    painIntensity: number;
    willingnessToPay: string;
    evidenceLink: string | null;
  }>;
  assumptions: Array<{
    id: string;
    assumptionText: string;
    riskLevel: string;
    isCritical: boolean;
  }>;
  tests: Array<{
    id: string;
    testType: string;
    description: string;
    metricDefinition: string;
    targetValue: string;
    evidenceLink: string | null;
    results: Array<{
      id: string;
      targetMetric: string;
      actualMetric: string;
      conclusion: string;
      analysis: string;
    }>;
  }>;
};

const initialInterview = {
  contactAlias: "",
  channel: "whatsapp",
  interviewDate: "",
  summary: "",
  currentProblem: "",
  currentSolution: "",
  painIntensity: 7,
  willingnessToPay: "",
  evidenceLink: "",
};

export function MvtPanel() {
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [validations, setValidations] = useState<ValidationSummary[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [selectedValidationId, setSelectedValidationId] = useState("");
  const [detail, setDetail] = useState<ValidationDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState(initialInterview);
  const [assumptionText, setAssumptionText] = useState("");
  const [assumptionRisk, setAssumptionRisk] = useState("high");
  const [assumptionCritical, setAssumptionCritical] = useState(false);
  const [testForm, setTestForm] = useState({
    testType: "landing",
    description: "",
    metricDefinition: "",
    targetValue: "",
    evidenceLink: "",
  });
  const [resultForm, setResultForm] = useState({
    testId: "",
    targetMetric: "",
    actualMetric: "",
    conclusion: "inconclusive",
    analysis: "",
  });
  const [decisionForm, setDecisionForm] = useState({
    decision: "retestear",
    decisionReasoning: "",
    nextStep: "",
  });

  const selectedValidationSummary = useMemo(
    () => validations.find((item) => item.id === selectedValidationId) ?? null,
    [selectedValidationId, validations],
  );

  async function loadOverview() {
    const response = await fetch("/api/mvt");
    const json = await response.json();
    setProposals(json.proposals ?? []);
    setValidations(json.validations ?? []);
  }

  async function loadValidationDetail(validationId: string) {
    const response = await fetch(`/api/mvt/validation/${validationId}`);
    const json = await response.json();
    if (!json.ok) {
      setMessage(json.message ?? "No se pudo cargar validacion");
      return;
    }
    setDetail(json.validation);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOverview();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function selectProposal() {
    setMessage(null);
    const response = await fetch("/api/mvt/select-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: selectedProposalId }),
    });
    const json = await response.json();
    if (!json.ok) {
      setMessage(json.message ?? "No se pudo crear validacion");
      return;
    }
    setSelectedValidationId(json.validationId);
    await loadOverview();
    await loadValidationDetail(json.validationId);
    setMessage("Validacion MVT iniciada.");
  }

  async function submitInterview() {
    if (!selectedValidationId) return;
    const response = await fetch("/api/mvt/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationId: selectedValidationId,
        ...interviewForm,
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Entrevista registrada." : json.message ?? "Error");
    if (json.ok) {
      setInterviewForm(initialInterview);
      await loadValidationDetail(selectedValidationId);
      await loadOverview();
    }
  }

  async function submitAssumption() {
    if (!selectedValidationId) return;
    const response = await fetch("/api/mvt/assumptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationId: selectedValidationId,
        assumptionText,
        riskLevel: assumptionRisk,
        isCritical: assumptionCritical,
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Supuesto registrado." : json.message ?? "Error");
    if (json.ok) {
      setAssumptionText("");
      await loadValidationDetail(selectedValidationId);
      await loadOverview();
    }
  }

  async function submitTest() {
    if (!selectedValidationId) return;
    const response = await fetch("/api/mvt/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationId: selectedValidationId,
        ...testForm,
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Test registrado." : json.message ?? "Error");
    if (json.ok) {
      setTestForm({
        testType: "landing",
        description: "",
        metricDefinition: "",
        targetValue: "",
        evidenceLink: "",
      });
      await loadValidationDetail(selectedValidationId);
      await loadOverview();
    }
  }

  async function submitResult() {
    const response = await fetch("/api/mvt/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultForm),
    });
    const json = await response.json();
    setMessage(json.ok ? "Resultado registrado." : json.message ?? "Error");
    if (json.ok && selectedValidationId) {
      setResultForm({
        testId: "",
        targetMetric: "",
        actualMetric: "",
        conclusion: "inconclusive",
        analysis: "",
      });
      await loadValidationDetail(selectedValidationId);
    }
  }

  async function submitDecision() {
    if (!selectedValidationId) return;
    const response = await fetch("/api/mvt/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationId: selectedValidationId,
        ...decisionForm,
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Decision final registrada." : json.message ?? "Error");
    if (json.ok) {
      await loadValidationDetail(selectedValidationId);
      await loadOverview();
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">MVT Validation</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Inmersion, hipotesis, test, analisis y decision con evidencia.
        </p>
        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Seleccionar propuesta</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="min-w-96 rounded border border-zinc-300 px-2 py-1 text-sm"
            value={selectedProposalId}
            onChange={(event) => setSelectedProposalId(event.target.value)}
          >
            <option value="">Seleccionar propuesta</option>
            {proposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.title} | fit {proposal.fitScore} | {proposal.painPoint.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => void selectProposal()}
          >
            Iniciar MVT
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Validaciones existentes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {validations.map((validation) => (
              <button
                key={validation.id}
                type="button"
                className={`rounded border px-2 py-1 text-xs ${
                  selectedValidationId === validation.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300"
                }`}
                onClick={() => {
                  setSelectedValidationId(validation.id);
                  void loadValidationDetail(validation.id);
                }}
              >
                {validation.proposal.title} | I:{validation._count.interviews} A:
                {validation._count.assumptions} T:{validation._count.tests}
              </button>
            ))}
          </div>
        </div>
      </section>

      {detail ? (
        <>
          <section className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">1) Inmersion - entrevistas</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Minimo requerido: 5 entrevistas reales.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input label="Contacto (alias)" value={interviewForm.contactAlias} onChange={(value) => setInterviewForm((current) => ({ ...current, contactAlias: value }))} />
              <Input label="Canal" value={interviewForm.channel} onChange={(value) => setInterviewForm((current) => ({ ...current, channel: value }))} />
              <Input label="Fecha" value={interviewForm.interviewDate} onChange={(value) => setInterviewForm((current) => ({ ...current, interviewDate: value }))} type="date" />
              <Input label="Intensidad dolor (1-10)" value={String(interviewForm.painIntensity)} onChange={(value) => setInterviewForm((current) => ({ ...current, painIntensity: Number(value) }))} type="number" />
              <Input label="Disposicion a pagar" value={interviewForm.willingnessToPay} onChange={(value) => setInterviewForm((current) => ({ ...current, willingnessToPay: value }))} />
              <Input label="Link evidencia" value={interviewForm.evidenceLink} onChange={(value) => setInterviewForm((current) => ({ ...current, evidenceLink: value }))} />
              <TextArea label="Resumen" value={interviewForm.summary} onChange={(value) => setInterviewForm((current) => ({ ...current, summary: value }))} />
              <TextArea label="Problema actual" value={interviewForm.currentProblem} onChange={(value) => setInterviewForm((current) => ({ ...current, currentProblem: value }))} />
              <TextArea label="Solucion actual" value={interviewForm.currentSolution} onChange={(value) => setInterviewForm((current) => ({ ...current, currentSolution: value }))} />
            </div>
            <button type="button" className="mt-3 rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => void submitInterview()}>
              Guardar entrevista
            </button>
            <p className="mt-3 text-xs text-zinc-500">Entrevistas registradas: {detail.interviews.length}</p>
          </section>

          <section className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">2) Hipotesis</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input label="Supuesto" value={assumptionText} onChange={setAssumptionText} />
              <Input label="Riesgo" value={assumptionRisk} onChange={setAssumptionRisk} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={assumptionCritical}
                  onChange={(event) => setAssumptionCritical(event.target.checked)}
                />
                Critico
              </label>
            </div>
            <button type="button" className="mt-3 rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => void submitAssumption()}>
              Guardar supuesto
            </button>
            <p className="mt-3 text-xs text-zinc-500">Supuestos: {detail.assumptions.length}</p>
          </section>

          <section className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">3) Test</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input label="Tipo test" value={testForm.testType} onChange={(value) => setTestForm((current) => ({ ...current, testType: value }))} />
              <Input label="Metrica definida" value={testForm.metricDefinition} onChange={(value) => setTestForm((current) => ({ ...current, metricDefinition: value }))} />
              <Input label="Valor objetivo" value={testForm.targetValue} onChange={(value) => setTestForm((current) => ({ ...current, targetValue: value }))} />
              <Input label="Link evidencia" value={testForm.evidenceLink} onChange={(value) => setTestForm((current) => ({ ...current, evidenceLink: value }))} />
              <TextArea label="Descripcion test" value={testForm.description} onChange={(value) => setTestForm((current) => ({ ...current, description: value }))} />
            </div>
            <button type="button" className="mt-3 rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => void submitTest()}>
              Guardar test
            </button>
            <p className="mt-3 text-xs text-zinc-500">Tests: {detail.tests.length}</p>
          </section>

          <section className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">4) Analisis (resultado por test)</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <select
                className="rounded border border-zinc-300 px-2 py-1 text-sm"
                value={resultForm.testId}
                onChange={(event) =>
                  setResultForm((current) => ({ ...current, testId: event.target.value }))
                }
              >
                <option value="">Seleccionar test</option>
                {detail.tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.testType} - {test.description}
                  </option>
                ))}
              </select>
              <Input label="Metrica objetivo" value={resultForm.targetMetric} onChange={(value) => setResultForm((current) => ({ ...current, targetMetric: value }))} />
              <Input label="Metrica real" value={resultForm.actualMetric} onChange={(value) => setResultForm((current) => ({ ...current, actualMetric: value }))} />
              <Input label="Conclusion (validated/invalidated/inconclusive)" value={resultForm.conclusion} onChange={(value) => setResultForm((current) => ({ ...current, conclusion: value }))} />
              <TextArea label="Analisis honesto" value={resultForm.analysis} onChange={(value) => setResultForm((current) => ({ ...current, analysis: value }))} />
            </div>
            <button type="button" className="mt-3 rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => void submitResult()}>
              Guardar resultado
            </button>
          </section>

          <section className="rounded-lg border border-zinc-300 bg-white p-4">
            <h3 className="text-lg font-semibold">5) Decision</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input label="Decision (avanzar/pivotear/retestear/descartar)" value={decisionForm.decision} onChange={(value) => setDecisionForm((current) => ({ ...current, decision: value }))} />
              <TextArea label="Razonamiento" value={decisionForm.decisionReasoning} onChange={(value) => setDecisionForm((current) => ({ ...current, decisionReasoning: value }))} />
              <TextArea label="Siguiente paso" value={decisionForm.nextStep} onChange={(value) => setDecisionForm((current) => ({ ...current, nextStep: value }))} />
            </div>
            <button type="button" className="mt-3 rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => void submitDecision()}>
              Guardar decision final
            </button>
            {selectedValidationSummary ? (
              <p className="mt-3 text-xs text-zinc-500">
                Estado actual: {selectedValidationSummary.status}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        type={type}
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
