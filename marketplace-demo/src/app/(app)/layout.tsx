import { Suspense, type ReactNode } from "react";
import { Splash } from "@/components/brand";
import { BrowserApp } from "@/components/browser-app";

// Everything under here reads demo data from browser storage, so it renders in
// the browser only. The server sends the splash as the static shell.
// Replace BrowserApp once the data comes from a real backend.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Splash />}>
      <BrowserApp>{children}</BrowserApp>
    </Suspense>
  );
}
