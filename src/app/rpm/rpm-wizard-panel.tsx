"use client";

import { useEffect, useMemo, useState } from "react";

type StepKey = "R" | "P";
type Answers = Record<StepKey, Record<string, string>>;

type VagueCheck = {
  is_vague: boolean;
  missing_fields: string[];
  follow_up_questions: string[];
  specificity_score: number;
};

type VagueChecks = {
  R: VagueCheck | null;
  P: VagueCheck | null;
  M: null;
};

type PlanAction = {
  category: "research" | "build" | "sales" | "validation" | "learning";
  title: string;
  description: string;
  impact: string;
  effort: string;
  priority: string;
  timeframe: string;
};

type GeneratedPlan = {
  generated: boolean;
  summary: string;
  actions: PlanAction[];
  warnings_or_gaps: string[];
};

type Constraints = {
  available_time_per_week: string;
  skills: string;
  capital: string;
  resources: string;
};

const stepDefinitions: Array<{
  step: StepKey;
  title: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder: string }>;
}> = [
  {
    step: "R",
    title: "R - Results",
    description:
      "Define el resultado medible. Ejemplo: llegar a US$2,000 MRR en 6 meses con SaaS B2B y 15 horas semanales.",
    fields: [
      { key: "income_target", label: "Meta de ingresos", placeholder: "Ej: USD 2,000 MRR" },
      { key: "time_horizon", label: "Plazo", placeholder: "Ej: 6 meses" },
      { key: "business_type", label: "Tipo de negocio", placeholder: "Ej: micro SaaS B2B" },
      { key: "dedication", label: "Dedicacion", placeholder: "Ej: 15 horas por semana" },
      { key: "constraints", label: "Restricciones", placeholder: "Ej: no renunciar al trabajo" },
      { key: "success_definition", label: "Exito medible", placeholder: "Ej: 10 clientes pagos" },
    ],
  },
  {
    step: "P",
    title: "P - Purpose",
    description:
      "Define el por que. Ejemplo: independencia financiera, impacto familiar y urgencia personal.",
    fields: [
      { key: "emotional_reasons", label: "Razones emocionales", placeholder: "Ej: libertad y autonomia" },
      { key: "if_not_achieved", label: "Si no lo logras", placeholder: "Ej: estancamiento profesional" },
      { key: "beneficiaries", label: "A quien beneficia", placeholder: "Ej: familia y equipo futuro" },
      { key: "deep_motivation", label: "Motivacion profunda", placeholder: "Ej: construir patrimonio propio" },
    ],
  },
];

const emptyAnswers: Answers = { R: {}, P: {} };
const emptyConstraints: Constraints = {
  available_time_per_week: "",
  skills: "",
  capital: "",
  resources: "",
};

export function RpmWizardPanel() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [constraints, setConstraints] = useState<Constraints>(emptyConstraints);
  const [vagueChecks, setVagueChecks] = useState<VagueChecks>({
    R: null,
    P: null,
    M: null,
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string>("draft");
  const [summary, setSummary] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const currentStep = stepDefinitions[currentStepIndex];
  const canFinalize = useMemo(() => {
    const basicsOk = stepDefinitions.every((stepDef) =>
      stepDef.fields.every((field) => (answers[stepDef.step][field.key] ?? "").trim().length > 0),
    );
    const constraintsOk = Object.values(constraints).every((value) => value.trim().length > 0);
    return basicsOk && constraintsOk && Boolean(generatedPlan?.actions.length);
  }, [answers, constraints, generatedPlan]);

  async function loadProfile() {
    const response = await fetch("/api/rpm/profile");
    const json = await response.json();
    setAnswers({
      R: json.answers?.R ?? {},
      P: json.answers?.P ?? {},
    });
    setProfileStatus(json.profile?.status ?? "draft");
    setSummary(json.interpretation?.summary ?? "");
    const gaps = Array.isArray(json.interpretation?.vaguenessFlags)
      ? (json.interpretation.vaguenessFlags as string[])
      : [];
    setWarnings(gaps);
    setGeneratedPlan((json.generatedM as GeneratedPlan | null) ?? null);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function setAnswer(step: StepKey, key: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [step]: {
        ...current[step],
        [key]: value,
      },
    }));
  }

  function setConstraint(key: keyof Constraints, value: string) {
    setConstraints((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveCurrentStep(runVagueCheck: boolean) {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/rpm/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          ...answers,
          M: {},
        },
        runVagueCheck,
      }),
    });
    const json = await response.json();
    setSaving(false);

    if (!json.ok) {
      setMessage(json.message ?? "No se pudo guardar");
      return;
    }

    if (json.vagueChecks) {
      setVagueChecks(json.vagueChecks as VagueChecks);
      const stepCheck = json.vagueChecks[currentStep.step] as VagueCheck | undefined;
      if (stepCheck?.is_vague) {
        setMessage(
          `Tu paso ${currentStep.step} esta vago (score ${stepCheck.specificity_score}/100). Revisa las preguntas de seguimiento.`,
        );
      } else {
        setMessage(`Paso ${currentStep.step} guardado con buena especificidad.`);
      }
    } else {
      setMessage("Borrador guardado.");
    }
  }

  async function generatePlan() {
    setGeneratingPlan(true);
    setMessage("Generando tu plan...");

    const response = await fetch("/api/rpm/massive-action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        R: answers.R,
        P: answers.P,
        constraints,
      }),
    });

    const json = await response.json();
    setGeneratingPlan(false);

    if (!json.ok) {
      setMessage(json.message ?? "No se pudo generar M automatico.");
      return;
    }

    setGeneratedPlan(json.generatedM as GeneratedPlan);
    setMessage("Massive Action Plan generado. Puedes editarlo y regenerarlo.");
  }

  async function saveEditedPlan() {
    if (!generatedPlan) {
      return;
    }
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/rpm/massive-action-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatedPlan),
    });
    const json = await response.json();
    setSaving(false);
    if (!json.ok) {
      setMessage(json.message ?? "No se pudo guardar el plan editado.");
      return;
    }
    setMessage("Plan M editado y guardado.");
  }

  async function finalizeRpm() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/rpm/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          ...answers,
          M: {},
        },
      }),
    });
    const json = await response.json();
    setSaving(false);

    if (!json.ok) {
      setMessage(json.message ?? "No se pudo finalizar RPM.");
      return;
    }

    setProfileStatus("completed");
    setSummary(json.interpretation?.summary ?? "");
    setWarnings(
      Array.isArray(json.interpretation?.vaguenessFlags)
        ? (json.interpretation.vaguenessFlags as string[])
        : [],
    );
    setMessage("RPM completado. Ya puedes generar propuestas.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">RPM Wizard</h2>
        <p className="mt-1 text-sm text-zinc-600">
          R y P manuales. El Massive Action Plan (M) se genera automaticamente con IA.
        </p>
        <p className="mt-2 text-xs text-zinc-500">Estado perfil: {profileStatus}</p>
        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <div className="mb-3 flex gap-2">
          {stepDefinitions.map((step, index) => (
            <button
              key={step.step}
              type="button"
              onClick={() => setCurrentStepIndex(index)}
              className={`rounded px-3 py-2 text-sm ${
                currentStepIndex === index
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-700"
              }`}
            >
              {step.step}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentStepIndex(stepDefinitions.length)}
            className={`rounded px-3 py-2 text-sm ${
              currentStepIndex === stepDefinitions.length
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-700"
            }`}
          >
            M (Auto)
          </button>
        </div>

        {currentStepIndex < stepDefinitions.length ? (
          <>
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{currentStep.description}</p>

            <div className="mt-3 grid gap-3">
              {currentStep.fields.map((field) => (
                <label key={field.key} className="text-sm">
                  {field.label}
                  <textarea
                    className="mt-1 min-h-20 w-full rounded border border-zinc-300 px-2 py-1"
                    value={answers[currentStep.step][field.key] ?? ""}
                    onChange={(event) => setAnswer(currentStep.step, field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
                disabled={saving}
                onClick={() => void saveCurrentStep(false)}
              >
                Guardar borrador
              </button>
              <button
                type="button"
                className="rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
                disabled={saving}
                onClick={() => void saveCurrentStep(true)}
              >
                Validar especificidad con IA
              </button>
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                  onClick={() => setCurrentStepIndex((index) => index - 1)}
                >
                  Anterior
                </button>
              ) : null}
              {currentStepIndex < stepDefinitions.length ? (
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                  onClick={() => setCurrentStepIndex((index) => index + 1)}
                >
                  Siguiente
                </button>
              ) : null}
            </div>

            {vagueChecks[currentStep.step]?.is_vague ? (
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">
                  Este paso requiere mas precision (score{" "}
                  {vagueChecks[currentStep.step]?.specificity_score}/100).
                </p>
                <p className="mt-1">
                  Faltantes: {vagueChecks[currentStep.step]?.missing_fields.join(", ")}
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {vagueChecks[currentStep.step]?.follow_up_questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold">M - Massive Action Plan (Generado)</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Ingresa restricciones minimas y genera el plan automaticamente.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                label="Tiempo disponible por semana"
                value={constraints.available_time_per_week}
                onChange={(value) => setConstraint("available_time_per_week", value)}
              />
              <Input
                label="Habilidades actuales"
                value={constraints.skills}
                onChange={(value) => setConstraint("skills", value)}
              />
              <Input
                label="Capital disponible"
                value={constraints.capital}
                onChange={(value) => setConstraint("capital", value)}
              />
              <Input
                label="Recursos/herramientas"
                value={constraints.resources}
                onChange={(value) => setConstraint("resources", value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void generatePlan()}
                disabled={generatingPlan}
              >
                {generatedPlan ? "Regenerar M" : "Generar M automatico"}
              </button>
              {generatedPlan ? (
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                  onClick={() => void saveEditedPlan()}
                  disabled={saving}
                >
                  Guardar edicion del plan
                </button>
              ) : null}
            </div>

            {generatingPlan ? (
              <p className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                Generando tu plan...
              </p>
            ) : null}

            {generatedPlan ? (
              <div className="mt-4 space-y-3">
                <label className="text-sm font-medium">
                  Resumen del plan
                  <textarea
                    className="mt-1 min-h-20 w-full rounded border border-zinc-300 px-2 py-1"
                    value={generatedPlan.summary}
                    onChange={(event) =>
                      setGeneratedPlan((current) =>
                        current ? { ...current, summary: event.target.value } : current,
                      )
                    }
                  />
                </label>

                <div className="space-y-2">
                  {generatedPlan.actions.map((action, index) => (
                    <article key={`${action.category}-${index}`} className="rounded border border-zinc-200 p-3">
                      <p className="text-xs font-semibold uppercase text-zinc-500">{action.category}</p>
                      <Input
                        label="Titulo"
                        value={action.title}
                        onChange={(value) =>
                          setGeneratedPlan((current) =>
                            current
                              ? {
                                  ...current,
                                  actions: current.actions.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, title: value } : item,
                                  ),
                                }
                              : current,
                          )
                        }
                      />
                      <label className="mt-2 block text-sm">
                        Descripcion
                        <textarea
                          className="mt-1 min-h-20 w-full rounded border border-zinc-300 px-2 py-1"
                          value={action.description}
                          onChange={(event) =>
                            setGeneratedPlan((current) =>
                              current
                                ? {
                                    ...current,
                                    actions: current.actions.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? { ...item, description: event.target.value }
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                      </label>
                      <div className="mt-2 grid gap-2 md:grid-cols-4">
                        <Input
                          label="Impact"
                          value={action.impact}
                          onChange={(value) =>
                            setGeneratedPlan((current) =>
                              current
                                ? {
                                    ...current,
                                    actions: current.actions.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, impact: value } : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        <Input
                          label="Effort"
                          value={action.effort}
                          onChange={(value) =>
                            setGeneratedPlan((current) =>
                              current
                                ? {
                                    ...current,
                                    actions: current.actions.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, effort: value } : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        <Input
                          label="Priority"
                          value={action.priority}
                          onChange={(value) =>
                            setGeneratedPlan((current) =>
                              current
                                ? {
                                    ...current,
                                    actions: current.actions.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, priority: value } : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        <Input
                          label="Timeframe"
                          value={action.timeframe}
                          onChange={(value) =>
                            setGeneratedPlan((current) =>
                              current
                                ? {
                                    ...current,
                                    actions: current.actions.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, timeframe: value } : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Resumen RPM (editable en origen)</h3>
        {summary ? (
          <p className="mt-2 text-sm text-zinc-700">{summary}</p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Aun no hay resumen estructurado. Finaliza RPM para generarlo.
          </p>
        )}
        {warnings.length > 0 ? (
          <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p className="font-medium">Warnings or gaps:</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!canFinalize || saving}
          onClick={() => void finalizeRpm()}
        >
          Finalizar RPM y generar interpretacion IA
        </button>
      </section>
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
