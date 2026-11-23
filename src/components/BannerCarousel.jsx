import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FALLBACK = [
  {
    id: 1,
    key: "banner1",
    link: "/products",
    gradient: "from-blue-900 to-blue-500",
    emoji: "📱",
  },
  {
    id: 2,
    key: "banner2",
    link: "/products",
    gradient: "from-slate-900 to-slate-600",
    emoji: "💻",
  },
  {
    id: 3,
    key: "banner3",
    link: "/products",
    gradient: "from-violet-900 to-violet-600",
    emoji: "🎧",
  },
];

function getBannerTranslation(banner, language) {
  const translations = banner?.translations || {};
  const lang = language?.split("-")[0] || "en";

  return (
    translations[lang] ||
    translations.en ||
    translations.ru ||
    translations.tm ||
    {}
  );
}

function mapBanner(banner, index, language, t) {
  const fallback = FALLBACK[index % FALLBACK.length];
  const translated = getBannerTranslation(banner, language);

  return {
    id: banner.id,
    tag: t(`home.${fallback.key}.tag`),
    title: translated.title || banner.title || t(`home.${fallback.key}.title`),
    text: translated.text || banner.text || t(`home.${fallback.key}.text`),
    link: banner.link || fallback.link,
    btn: t(`home.${fallback.key}.button`),
    gradient: fallback.gradient,
    emoji: fallback.emoji,
    image: banner.image || banner.imageFile?.url,
  };
}

export default function BannerCarousel({ banners = [] }) {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage || i18n.language || "en";

  const slides = banners.length
    ? banners.map((banner, index) => mapBanner(banner, index, language, t))
    : FALLBACK.map((slide) => ({
        ...slide,
        tag: t(`home.${slide.key}.tag`),
        title: t(`home.${slide.key}.title`),
        text: t(`home.${slide.key}.text`),
        btn: t(`home.${slide.key}.button`),
      }));

  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const go = useCallback(
    (index) => {
      if (!total) return;

      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  // Keep active index valid if banners change.
  useEffect(() => {
    setCurrent((previous) => (total > 0 ? Math.min(previous, total - 1) : 0));
  }, [total]);

  // Automatic slide rotation.
  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setCurrent((previous) => (previous + 1) % total);
    }, 5500);

    return () => clearInterval(timer);
  }, [total]);

  if (!total) return null;

  return (
    <section className="my-4 sm:my-6">
      <div className="relative h-[260px] overflow-hidden rounded-xl bg-slate-800 sm:h-[320px] sm:rounded-2xl lg:h-[360px]">
        {/* Slides */}
        <div
          className="flex h-full transition-transform duration-[450ms] ease-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`relative flex h-full min-w-full items-center overflow-hidden bg-gradient-to-br ${slide.gradient} px-5 py-6 text-white sm:px-10 sm:py-8 lg:px-14`}
            >
              {/* Background image */}
              {slide.image && (
                <>
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-slate-950/55" />
                </>
              )}

              {/* Content */}
              <div className="relative z-10 w-full max-w-2xl pr-7 sm:pr-12">
                <span className="mb-2 inline-block max-w-full rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold sm:mb-3 sm:text-xs">
                  {slide.tag}
                </span>

                <h2 className="mb-2 break-words text-xl font-bold leading-tight sm:mb-3 sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h2>

                <p className="mb-4 line-clamp-3 max-w-xl text-xs leading-relaxed text-white/90 sm:mb-6 sm:text-sm lg:text-base">
                  {slide.text}
                </p>

                <Link
                  to={slide.link}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:min-h-11 sm:px-6 sm:text-sm"
                >
                  {slide.btn}
                </Link>
              </div>

              {/* Decorative emoji */}
              <div className="relative z-10 ml-auto hidden shrink-0 select-none text-7xl md:block lg:text-[110px]">
                {slide.emoji}
              </div>
            </div>
          ))}
        </div>

        {/* Previous */}
        {total > 1 && (
          <button
            type="button"
            aria-label={t("home.previousSlide")}
            onClick={() => go(current - 1)}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg font-bold text-slate-900 shadow-card transition hover:bg-white sm:left-4 sm:h-10 sm:w-10 sm:text-xl"
          >
            ‹
          </button>
        )}

        {/* Next */}
        {total > 1 && (
          <button
            type="button"
            aria-label={t("home.nextSlide")}
            onClick={() => go(current + 1)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg font-bold text-slate-900 shadow-card transition hover:bg-white sm:right-4 sm:h-10 sm:w-10 sm:text-xl"
          >
            ›
          </button>
        )}

        {/* Indicators */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t("home.goToSlide", {
                  number: index + 1,
                })}
                aria-current={index === current ? "true" : undefined}
                onClick={() => go(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current
                    ? "w-6 bg-white sm:w-7"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
