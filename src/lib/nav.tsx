"use client";

/**
 * Navigatie-abstractie. De schermen gebruiken alleen deze exports,
 * zodat dezelfde componenten ook in de losse preview-build (hash routing) werken.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function AppLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} />;
}

export function usePath(): string {
  return usePathname() ?? "/";
}

export function useNavigate(): (href: string) => void {
  const router = useRouter();
  return (href) => router.push(href);
}

export function useGoBack(): () => void {
  const router = useRouter();
  return () => (window.history.length > 1 ? router.back() : router.push("/"));
}
