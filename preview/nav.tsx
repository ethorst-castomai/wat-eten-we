/**
 * Preview-versie van src/lib/nav.tsx: een kleine router in het geheugen,
 * met de route ook in de URL-hash als dat mag.
 */
import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

interface Nav {
  path: string;
  go(href: string): void;
  back(): void;
}
const NavCtx = createContext<Nav>({ path: "/", go: () => {}, back: () => {} });

function readHash(): string {
  try {
    const h = window.location.hash.slice(1);
    return h.startsWith("/") ? h : "/";
  } catch {
    return "/";
  }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>(() => [readHash()]);
  const path = stack[stack.length - 1];

  useEffect(() => {
    try {
      if (window.location.hash.slice(1) !== path) window.history.replaceState(null, "", "#" + path);
    } catch {
      // Hash niet beschikbaar: routing blijft in het geheugen werken
    }
    window.scrollTo(0, 0);
  }, [path]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      setStack((s) => (s[s.length - 1] === h ? s : [...s, h]));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (href: string) => setStack((s) => (s[s.length - 1] === href ? s : [...s, href]));
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : ["/"]));
  return <NavCtx.Provider value={{ path, go, back }}>{children}</NavCtx.Provider>;
}

export function AppLink({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { go } = useContext(NavCtx);
  return (
    <a
      href={"#" + href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        go(href);
      }}
      {...rest}
    />
  );
}

export function usePath(): string {
  return useContext(NavCtx).path;
}

export function useNavigate(): (href: string) => void {
  return useContext(NavCtx).go;
}

export function useGoBack(): () => void {
  return useContext(NavCtx).back;
}
