const docs = [
  { name: "Arquitectura", path: "/docs/architecture.md" },
  { name: "Plan de Sprints", path: "/docs/sprint-plan.md" },
  { name: "Modelo de Datos", path: "/docs/data-model.md" },
  { name: "Estrategia YouTube", path: "/docs/youtube-strategy.md" },
  { name: "Prompts IA", path: "/docs/ai-prompts.md" },
  { name: "Proceso MVT", path: "/docs/mvt-process.md" },
];

export default function EvaluationPage() {
  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-6">
      <h2 className="text-xl font-bold">README / Evaluación</h2>
      <p className="mt-2 text-sm text-zinc-700">
        Referencias de diseño inicial y evidencia para la rúbrica.
      </p>
      <ul className="mt-4 space-y-2">
        {docs.map((doc) => (
          <li key={doc.path} className="rounded border border-zinc-200 px-3 py-2 text-sm">
            <span className="font-medium">{doc.name}</span>
            <p className="text-zinc-600">{doc.path}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
