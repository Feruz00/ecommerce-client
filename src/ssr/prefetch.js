/**
 * Server-side data loaders for SEO routes.
 * Fills TanStack Query cache before renderToString.
 */
import axios from 'axios';

const API =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://localhost:5000/api';

function client(lang = 'ru') {
  const base = API.replace(/\/$/, '');
  const baseURL = base.endsWith('/api') ? base : `${base}/api`;
  return axios.create({
    baseURL,
    headers: { 'Accept-Language': lang },
    timeout: 8000,
  });
}

export async function prefetchForUrl(url, queryClient, lang = 'ru') {
  const api = client(lang);
  const path = url.split('?')[0];
  const search = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  const params = Object.fromEntries(new URLSearchParams(search));

  try {
    if (path === '/' || path === '') {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['banners'],
          queryFn: () => api.get('/banners/active').then((r) => r.data),
        }),
        queryClient.prefetchQuery({
          queryKey: ['categories'],
          queryFn: () => api.get('/categories').then((r) => r.data),
        }),
        queryClient.prefetchQuery({
          queryKey: ['products', { limit: 12, sort: 'created_at' }],
          queryFn: () =>
            api.get('/products', { params: { limit: 12 } }).then((r) => r.data),
        }),
      ]);
      return { status: 200 };
    }

    if (path === '/products') {
      const q = {
        page: params.page || 1,
        limit: 12,
        category: params.category,
        search: params.search,
        featured: params.featured,
        sort: params.sort || 'created_at',
      };
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['categories'],
          queryFn: () => api.get('/categories').then((r) => r.data),
        }),
        queryClient.prefetchQuery({
          queryKey: ['products', q],
          queryFn: () => api.get('/products', { params: q }).then((r) => r.data),
        }),
      ]);
      return { status: 200 };
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const id = productMatch[1];
      await queryClient.prefetchQuery({
        queryKey: ['product', id],
        queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
      });
      const cached = queryClient.getQueryData(['product', id]);
      if (!cached?.data?.product) return { status: 404 };
      return { status: 200 };
    }

    return { status: 200 };
  } catch (err) {
    console.error('[SSR prefetch]', path, err.message);
    return { status: 200 };
  }
}
