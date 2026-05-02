import type { PrismaClient } from "@prisma/client";

export interface RubricItem {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RubricSnapshot {
  generatedAt: string;
  stats: {
    videos: number;
    scraperRuns: number;
    painPoints: number;
    classifications: number;
    rpmCompleted: number;
    proposalsActive: number;
    mvtValidations: number;
    mvtInterviews: number;
    evidenceLinks: number;
  };
  items: RubricItem[];
  blockers: string[];
  readyForDemo: boolean;
}

export async function getRubricSnapshot(prisma: PrismaClient): Promise<RubricSnapshot> {
  const [
    videos,
    scraperRuns,
    painPoints,
    classifications,
    rpmCompleted,
    proposalsActive,
    mvtValidations,
    mvtInterviews,
    evidenceLinks,
    settingsActive,
    latestRuns,
  ] = await Promise.all([
    prisma.video.count(),
    prisma.scraperRun.count(),
    prisma.painPoint.count({ where: { isActive: true } }),
    prisma.videoPainPointClassification.count(),
    prisma.rpmProfile.count({ where: { status: "completed", isActive: true } }),
    prisma.solutionProposal.count({ where: { status: "active" } }),
    prisma.mvtValidation.count(),
    prisma.mvtInterview.count(),
    prisma.evidenceLink.count(),
    prisma.scraperSetting.count({ where: { isActive: true } }),
    prisma.scraperRun.findMany({
      orderBy: { startTime: "desc" },
      take: 2,
      select: {
        videosCreated: true,
        videosUpdated: true,
        status: true,
      },
    }),
  ]);

  const incrementalDetected =
    latestRuns.length >= 2 &&
    latestRuns.some((run) => run.videosCreated > 0) &&
    latestRuns.some((run) => run.videosUpdated > 0);

  const items: RubricItem[] = [
    {
      key: "videos_30",
      label: "30+ videos reales procesados",
      passed: videos >= 30,
      detail: `${videos} videos`,
    },
    {
      key: "scraper_runs_2",
      label: "2+ corridas scraper con timestamps",
      passed: scraperRuns >= 2,
      detail: `${scraperRuns} corridas`,
    },
    {
      key: "incremental_scraping",
      label: "Scraping incremental demostrado",
      passed: incrementalDetected,
      detail: incrementalDetected
        ? "Se detecta corrida de creación y corrida de actualización."
        : "Faltan evidencias de created>0 y updated>0 en corridas recientes.",
    },
    {
      key: "scheduler_config",
      label: "Scheduler configurable activo",
      passed: settingsActive > 0,
      detail: `${settingsActive} configuraciones activas`,
    },
    {
      key: "pain_points_8",
      label: "8+ pain points LATAM con fuentes",
      passed: painPoints >= 8,
      detail: `${painPoints} pain points`,
    },
    {
      key: "classifications",
      label: "Clasificacion IA video x pain point",
      passed: classifications > 0,
      detail: `${classifications} clasificaciones`,
    },
    {
      key: "rpm_completed",
      label: "RPM completado",
      passed: rpmCompleted > 0,
      detail: `${rpmCompleted} perfiles RPM completados`,
    },
    {
      key: "proposals_4",
      label: "4+ propuestas dinamicas",
      passed: proposalsActive >= 4,
      detail: `${proposalsActive} propuestas activas`,
    },
    {
      key: "mvt_started",
      label: "MVT iniciado",
      passed: mvtValidations > 0,
      detail: `${mvtValidations} validaciones`,
    },
    {
      key: "mvt_interviews_5",
      label: "5+ entrevistas reales en MVT",
      passed: mvtInterviews >= 5,
      detail: `${mvtInterviews} entrevistas`,
    },
    {
      key: "evidence_visible",
      label: "Evidencias visibles en app",
      passed: evidenceLinks > 0,
      detail: `${evidenceLinks} evidencias registradas`,
    },
  ];

  const blockers = items.filter((item) => !item.passed).map((item) => item.label);

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      videos,
      scraperRuns,
      painPoints,
      classifications,
      rpmCompleted,
      proposalsActive,
      mvtValidations,
      mvtInterviews,
      evidenceLinks,
    },
    items,
    blockers,
    readyForDemo: blockers.length === 0,
  };
}
