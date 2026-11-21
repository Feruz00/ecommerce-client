import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const SITE = "TechStore";

const SEO_TEXT = {
  en: {
    title: "Marketplace",
    description:
      "TechStore — online marketplace. Smartphones, laptops, audio devices and accessories with delivery.",
    locale: "en_US",
  },
  ru: {
    title: "Маркетплейс",
    description:
      "TechStore — онлайн-маркетплейс. Смартфоны, ноутбуки, аудио и аксессуары с доставкой.",
    locale: "ru_RU",
  },
  tm: {
    title: "Marketpleýs",
    description:
      "TechStore — onlaýn marketpleýs. Smartfonlar, noutbuklar, audio enjamlary we eltip bermek hyzmaty bilen aksessuarlar.",
    locale: "tk_TM",
  },
};

export default function Seo({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const { i18n } = useTranslation();

  const language = (i18n.resolvedLanguage || i18n.language || "en").split(
    "-",
  )[0];

  const seo = SEO_TEXT[language] || SEO_TEXT.en;

  const finalDescription = description || seo.description;

  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — ${seo.title}`;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.PUBLIC_ORIGIN || "http://localhost:3000";

  const url = `${origin}${path}`;
  const ogImage = image || `${origin}/og-default.jpg`;

  return (
    <Helmet>
      <html lang={language} />

      <title>{fullTitle}</title>

      <meta name="description" content={finalDescription} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={seo.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
