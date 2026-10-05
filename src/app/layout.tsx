import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/components/AppState";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Wat eten we vandaag?",
  description: "Iedere dag drie recepten die passen bij jullie huishouden.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#141915" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
