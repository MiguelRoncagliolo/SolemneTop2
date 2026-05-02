"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/scraper", label: "Scraper" },
  { href: "/videos", label: "Videos" },
  { href: "/pain-points", label: "Pain Points LATAM" },
  { href: "/classifier", label: "Clasificador" },
  { href: "/rpm", label: "RPM Wizard" },
  { href: "/proposals", label: "Propuestas" },
  { href: "/mvt", label: "MVT" },
  { href: "/evidence", label: "Evidencias" },
  { href: "/evaluation", label: "README / Evaluación" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full overflow-x-auto border-b border-zinc-300 bg-zinc-100/80">
      <ul className="mx-auto flex max-w-7xl min-w-max gap-1 px-4 py-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-zinc-100"
                    : "text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
