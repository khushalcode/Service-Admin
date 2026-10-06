"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Bump this when a cached query's shape changes incompatibly — it
// invalidates every persisted cache on load instead of rendering stale/
// mismatched data against newer component code.
const PERSIST_BUSTER = "v1";

// One QueryClient instance per browser tab, created lazily in useState so it
// survives client-side route changes (Pages Router keeps _app mounted across
// navigations) — that's what lets a cached query skip refetching when the
// user revisits a page instead of re-fetching on every mount.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // localStorage is unavailable during SSR/static export — guard so the
  // persister is only ever constructed client-side.
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? undefined
      : createSyncStoragePersister({ storage: window.localStorage, key: "app-query-cache" })
  );

  if (!persister) {
    // SSR (no `window`) — plain provider, no persistence to wire up.
    // Same QueryClient either way, so no cache is lost once the client
    // branch below takes over.
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Cached pages older than this are dropped rather than restored —
        // stale enough that showing them at all (even before revalidation)
        // would be misleading.
        maxAge: 24 * 60 * 60 * 1000,
        buster: PERSIST_BUSTER,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
