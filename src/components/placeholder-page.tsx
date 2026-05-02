export function PlaceholderPage({
  title,
  description,
  sprint,
}: {
  title: string;
  description: string;
  sprint: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-700">{description}</p>
      <p className="mt-4 inline-flex rounded bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700">
        Implementación objetivo: {sprint}
      </p>
    </section>
  );
}
