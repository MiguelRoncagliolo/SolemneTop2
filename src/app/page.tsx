import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

async function getDashboardData() {
  try {
    const [
      videosCount,
      lastRun,
      activeSettingsCount,
      painPointsCount,
      rpmCompleted,
      proposalsCount,
      mvtCount,
    ] = await Promise.all([
      prisma.video.count(),
      prisma.scraperRun.findFirst({
        orderBy: { startTime: "desc" },
      }),
      prisma.scraperSetting.count({
        where: { isActive: true },
      }),
      prisma.painPoint.count({
        where: { isActive: true },
      }),
      prisma.rpmProfile.count({
        where: { status: "completed" },
      }),
      prisma.solutionProposal.count(),
      prisma.mvtValidation.count(),
    ]);

    return {
      videosCount,
      lastRun,
      activeSettingsCount,
      painPointsCount,
      rpmCompleted,
      proposalsCount,
      mvtCount,
      dbReady: true,
    };
  } catch {
    return {
      videosCount: 0,
      lastRun: null,
      activeSettingsCount: 0,
      painPointsCount: 0,
      rpmCompleted: 0,
      proposalsCount: 0,
      mvtCount: 0,
      dbReady: false,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const checklist = [
    { label: "30+ videos procesados", done: data.videosCount >= 30 },
    { label: "2+ corridas scraper", done: Boolean(data.lastRun) && data.videosCount > 0 },
    { label: "Scheduler activo", done: data.activeSettingsCount > 0 },
    { label: "Pain points activos", done: data.painPointsCount >= 8 },
    { label: "RPM completado", done: data.rpmCompleted > 0 },
    { label: "4+ propuestas", done: data.proposalsCount >= 4 },
    { label: "MVT iniciado", done: data.mvtCount > 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Estado general del pipeline y cumplimiento de rúbrica.
        </p>
        {!data.dbReady ? (
          <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900">
            DB no disponible aún. Configura `DATABASE_URL` y ejecuta migraciones.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Videos procesados" value={String(data.videosCount)} />
        <StatCard label="Última ejecución scraper" value={formatDate(data.lastRun?.startTime ?? null)} />
        <StatCard label="Scheduler activo" value={data.activeSettingsCount > 0 ? "Activo" : "Pausado"} />
        <StatCard label="Pain points activos" value={String(data.painPointsCount)} />
        <StatCard label="RPM" value={data.rpmCompleted > 0 ? "Completado" : "Pendiente"} />
        <StatCard label="Propuestas" value={String(data.proposalsCount)} />
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Checklist de rúbrica</h3>
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
              <span className="text-sm">{item.label}</span>
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  item.done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {item.done ? "OK" : "Pendiente"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-zinc-300 bg-white p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}
