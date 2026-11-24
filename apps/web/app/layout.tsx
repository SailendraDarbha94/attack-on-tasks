import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SITE } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  themeColor: "#fffbf4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
