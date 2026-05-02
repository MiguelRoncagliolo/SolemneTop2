"use client";

import { useCallback, useEffect, useState } from "react";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  classifications: Array<{
    id: string;
    relevanceScore: number;
    painPoint: {
      id: string;
      title: string;
      category: string;
    };
  }>;
};

export function VideosPanel() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/videos/top-pain-points");
    const json = await response.json();
    setVideos(json.videos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Videos y pain points top</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Vista por video con top clasificaciones de pain points.
          </p>
        </div>
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          onClick={() => void load()}
        >
          Refrescar
        </button>
      </div>
      {loading ? <p className="mt-3 text-sm text-zinc-500">Cargando...</p> : null}
      {!loading && videos.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No hay clasificaciones disponibles aún.</p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {videos.map((video) => (
          <article key={video.id} className="rounded border border-zinc-200 p-3">
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-blue-700 underline"
            >
              {video.title}
            </a>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              {video.classifications.length === 0 ? (
                <li>Sin clasificaciones</li>
              ) : (
                video.classifications.map((classification) => (
                  <li key={classification.id}>
                    {classification.painPoint.category} - {classification.painPoint.title} (
                    {classification.relevanceScore.toFixed(2)})
                  </li>
                ))
              )}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
