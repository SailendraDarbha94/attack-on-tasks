import type { StoreSummary } from "@nukkad/core";
import { cacheLife } from "next/cache";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/**
 * The stores, for the "where we deliver" section.
 *
 * The site must still build and render when the API is down, so a failure
 * comes back as an empty list rather than an error. The result is reused for
 * a few minutes, then fetched again.
 */
export async function getStores(): Promise<StoreSummary[]> {
  "use cache";
  cacheLife("minutes");
  try {
    const response = await fetch(`${API_URL}/stores`);
    if (!response.ok) return [];
    return (await response.json()) as StoreSummary[];
  } catch {
    return [];
  }
}
