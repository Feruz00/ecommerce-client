import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { UiProvider } from './context/UiContext';
import './i18n';
import './index.css';

const dehydratedState = window.__REACT_QUERY_STATE__ || [];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Restore SSR-prefetched queries
if (Array.isArray(dehydratedState)) {
  dehydratedState.forEach((entry) => {
    queryClient.setQueryData(entry.queryKey, entry.state.data);
  });
}

hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={undefined}>
          <UiProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </UiProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
