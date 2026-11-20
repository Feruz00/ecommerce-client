import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { UiProvider } from './context/UiContext';
import { prefetchForUrl } from './ssr/prefetch';
import './i18n';

/**
 * Render app to HTML string + head tags + dehydrated query state.
 */
export async function render(url, { lang = 'ru' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  const { status } = await prefetchForUrl(url, queryClient, lang);

  const helmetContext = {};
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <UiProvider>
            <StaticRouter location={url}>
              <App />
            </StaticRouter>
          </UiProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );

  const { helmet } = helmetContext;

  // Dehydrate query cache for client hydration
  const dehydrated = dehydrate(queryClient);

  return {
    html,
    helmet,
    state: dehydrated,
    status,
  };
}

/** Minimal dehydrate without @tanstack/react-query-persist — JSON-safe snapshot */
function dehydrate(queryClient) {
  const cache = queryClient.getQueryCache().getAll();
  return cache
    .filter((q) => q.state.status === 'success' && q.state.data !== undefined)
    .map((q) => ({
      queryKey: q.queryKey,
      state: {
        data: q.state.data,
        dataUpdateCount: 1,
        dataUpdatedAt: q.state.dataUpdatedAt,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        isInvalidated: false,
        status: 'success',
        fetchStatus: 'idle',
      },
    }));
}
