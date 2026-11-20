import { Helmet } from 'react-helmet-async';

const SITE = 'TechStore';
const DEFAULT_DESC =
  'TechStore — онлайн-маркетплейс. Смартфоны, ноутбуки, аудио и аксессуары с доставкой.';

/**
 * SEO head tags for SSR + client.
 * Renders into <head> via react-helmet-async (works with renderToString).
 */
export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — Маркетплейс`;
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
  const url = `${origin}${path}`;
  const ogImage = image || `${origin}/og-default.jpg`;

  return (
    <Helmet>
      <html lang="ru" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="ru_RU" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
