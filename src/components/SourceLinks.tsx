"use client";

import { AppLink } from "@/lib/nav";
import { sourceSearchUrl } from "@/lib/sources";
import { useApp } from "./AppState";

/** "Zoek ook op": zoeklinks naar de receptbronnen uit het profiel */
export function SourceLinks({ query, title = "Zoek ook op je bronnen" }: { query: string; title?: string }) {
  const { data } = useApp();
  const sources = (data.profile.recipeSources ?? []).filter((s) => s.enabled);
  if (sources.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Wil je ook zoeken op sites als Allerhande of 24Kitchen?{" "}
        <AppLink href="/profiel" className="font-semibold text-herb underline underline-offset-2">
          Voeg receptbronnen toe
        </AppLink>
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-muted">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((s) => (
          <li key={s.id}>
            <a
              href={sourceSearchUrl(s, query)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-[13.5px] font-semibold hover:border-herb hover:text-herb"
            >
              {s.name}
              <span aria-hidden>↗</span>
              <span className="sr-only">(opent in een nieuw venster)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted">
        Recept gevonden?{" "}
        <AppLink href="/importeren" className="font-semibold text-herb underline underline-offset-2">
          Importeer het
        </AppLink>{" "}
        om het te kunnen kiezen.
      </p>
    </div>
  );
}
