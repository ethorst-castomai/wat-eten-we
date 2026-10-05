"use client";

import type { ReactNode } from "react";
import { AppLink, usePath } from "@/lib/nav";
import { useApp } from "./AppState";
import { IconBasket, IconCalendar, IconHeart, IconPlate, IconUser } from "./Icons";

const TABS = [
  { href: "/", label: "Vandaag", Icon: IconPlate },
  { href: "/week", label: "Week", Icon: IconCalendar },
  { href: "/boodschappen", label: "Boodschappen", Icon: IconBasket },
  { href: "/favorieten", label: "Favorieten", Icon: IconHeart },
  { href: "/profiel", label: "Profiel", Icon: IconUser },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePath();
  const { data, ready } = useApp();
  const shoppingCount = data.shopping.recipes.length;

  return (
    <div className="min-h-dvh">
      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6">{ready ? children : <LoadingState />}</main>
      <nav
        aria-label="Hoofdnavigatie"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map(({ href, label, Icon }) => {
            const active = href === "/" ? path === "/" || path.startsWith("/recept") : path.startsWith(href);
            return (
              <li key={href}>
                <AppLink
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-1 px-0.5 pb-2.5 pt-3 text-[11px] tracking-tight font-semibold transition ${active ? "text-herb" : "text-muted hover:text-ink"}`}
                >
                  <span className="relative">
                    {href === "/favorieten" ? <IconHeart width={23} height={23} filled={active} /> : <Icon width={23} height={23} />}
                    {label === "Boodschappen" && shoppingCount > 0 && (
                      <span className="tabular absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-chili px-1 text-[10.5px] font-bold text-white">
                        {shoppingCount}
                      </span>
                    )}
                  </span>
                  {label}
                </AppLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
      <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-surface-2 md:col-span-3" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-80 animate-pulse rounded-3xl bg-surface-2" />
      ))}
    </div>
  );
}
