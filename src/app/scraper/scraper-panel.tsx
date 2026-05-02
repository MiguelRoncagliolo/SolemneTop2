"use client";

import { useCallback, useEffect, useState } from "react";

type ScraperRun = {
  id: string;
  startTime: string;
  endTime: string | null;
  status: "running" | "success" | "failed";
  videosFound: number;
  videosCreated: number;
  videosUpdated: number;
  errorsCount: number;
  durationMs: number | null;
  channel: {
    title: string;
    youtubeChannelId: string;
  };
};

type ChannelWithSettings = {
  id: string;
  title: string;
  youtubeChannelId: string;
  handle: string | null;
  scraperSetting: {
    scheduleType: "interval" | "daily" | "weekly" | "paused";
    intervalHours: number | null;
    dailyTime: string | null;
    weeklyDay: number | null;
    weeklyTime: string | null;
    timezone: string;
    isActive: boolean;
  } | null;
};

const weeklyDayOptions = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
];

export function ScraperPanel() {
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maxVideos, setMaxVideos] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelWithSettings[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [scheduleType, setScheduleType] =
    useState<"interval" | "daily" | "weekly" | "paused">("paused");
  const [isActive, setIsActive] = useState(false);
  const [intervalHours, setIntervalHours] = useState(24);
  const [dailyTime, setDailyTime] = useState("10:00");
  const [weeklyDay, setWeeklyDay] = useState(1);
  const [weeklyTime, setWeeklyTime] = useState("10:00");
  const [timezone, setTimezone] = useState("America/Santiago");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsResponse, settingsResponse] = await Promise.all([
        fetch("/api/scraper/runs"),
        fetch("/api/scraper/settings"),
      ]);
      const runsJson = await runsResponse.json();
      const settingsJson = await settingsResponse.json();

      setRuns(runsJson.runs ?? []);
      setRunning(Boolean(runsJson.runningInMemory));
      setChannels(settingsJson.channels ?? []);

      const firstChannel = (settingsJson.channels ?? [])[0] as ChannelWithSettings | undefined;
      if (firstChannel) {
        setSelectedChannelId(firstChannel.id);
        hydrateSettings(firstChannel);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar scraper.");
    } finally {
      setLoading(false);
    }
  }, []);

  function hydrateSettings(channel: ChannelWithSettings) {
    const current = channel.scraperSetting;
    setScheduleType(current?.scheduleType ?? "paused");
    setIsActive(current?.isActive ?? false);
    setIntervalHours(current?.intervalHours ?? 24);
    setDailyTime(current?.dailyTime ?? "10:00");
    setWeeklyDay(current?.weeklyDay ?? 1);
    setWeeklyTime(current?.weeklyTime ?? "10:00");
    setTimezone(current?.timezone ?? "America/Santiago");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  async function onRunScraper() {
    setMessage(null);
    const response = await fetch("/api/scraper/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxVideos }),
    });
    const json = await response.json();
    setMessage(json.message ?? (json.ok ? "Ejecución iniciada" : "Error"));
    await loadData();
  }

  async function onSaveSettings() {
    if (!selectedChannelId) {
      setMessage("No hay canal registrado aún. Ejecuta primero el scraper manual.");
      return;
    }

    const response = await fetch("/api/scraper/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: selectedChannelId,
        scheduleType,
        intervalHours: scheduleType === "interval" ? intervalHours : null,
        dailyTime: scheduleType === "daily" ? dailyTime : null,
        weeklyDay: scheduleType === "weekly" ? weeklyDay : null,
        weeklyTime: scheduleType === "weekly" ? weeklyTime : null,
        timezone,
        isActive,
      }),
    });
    const json = await response.json();
    setMessage(json.ok ? "Configuración guardada" : json.message ?? "No se pudo guardar");
    await loadData();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h2 className="text-xl font-bold">Scraper</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Ejecuta scraping real en background y revisa corridas persistentes.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Máx. videos:
            <input
              type="number"
              min={1}
              max={200}
              className="ml-2 w-24 rounded border border-zinc-300 px-2 py-1"
              value={maxVideos}
              onChange={(event) => setMaxVideos(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void onRunScraper()}
            disabled={running}
          >
            {running ? "Scraper en ejecución..." : "Ejecutar scraper manual"}
          </button>
        </div>
        {message ? (
          <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">{message}</p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Scheduler configurable</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Esta configuración se aplica por canal y la procesa `scraper:scheduler` en background.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Canal
            <select
              value={selectedChannelId}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
              onChange={(event) => {
                const newChannel = channels.find((channel) => channel.id === event.target.value);
                setSelectedChannelId(event.target.value);
                if (newChannel) {
                  hydrateSettings(newChannel);
                }
              }}
            >
              <option value="">Seleccionar</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.title} ({channel.handle ?? channel.youtubeChannelId})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Tipo
            <select
              value={scheduleType}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
              onChange={(event) =>
                setScheduleType(
                  event.target.value as "interval" | "daily" | "weekly" | "paused",
                )
              }
            >
              <option value="interval">Cada X horas</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="paused">Pausado</option>
            </select>
          </label>

          {scheduleType === "interval" ? (
            <label className="text-sm">
              Intervalo (horas)
              <input
                type="number"
                min={1}
                max={168}
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
                value={intervalHours}
                onChange={(event) => setIntervalHours(Number(event.target.value))}
              />
            </label>
          ) : null}

          {scheduleType === "daily" ? (
            <label className="text-sm">
              Hora diaria
              <input
                type="time"
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
                value={dailyTime}
                onChange={(event) => setDailyTime(event.target.value)}
              />
            </label>
          ) : null}

          {scheduleType === "weekly" ? (
            <>
              <label className="text-sm">
                Día semanal
                <select
                  className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
                  value={weeklyDay}
                  onChange={(event) => setWeeklyDay(Number(event.target.value))}
                >
                  {weeklyDayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Hora semanal
                <input
                  type="time"
                  className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
                  value={weeklyTime}
                  onChange={(event) => setWeeklyTime(event.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="text-sm">
            Timezone
            <input
              type="text"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Scheduler activo
          </label>
        </div>

        <button
          type="button"
          className="mt-4 rounded bg-zinc-800 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void onSaveSettings()}
        >
          Guardar scheduler
        </button>
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4">
        <h3 className="text-lg font-semibold">Logs de ejecución</h3>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
        {!loading && runs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Sin corridas registradas aún.</p>
        ) : null}
        {!loading && runs.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-300 text-left">
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Found</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2">Errors</th>
                  <th className="px-2 py-2">Duración ms</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-200">
                    <td className="px-2 py-2">
                      {new Date(run.startTime).toLocaleString("es-CL")}
                    </td>
                    <td className="px-2 py-2">{run.status}</td>
                    <td className="px-2 py-2">{run.videosFound}</td>
                    <td className="px-2 py-2">{run.videosCreated}</td>
                    <td className="px-2 py-2">{run.videosUpdated}</td>
                    <td className="px-2 py-2">{run.errorsCount}</td>
                    <td className="px-2 py-2">{run.durationMs ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
