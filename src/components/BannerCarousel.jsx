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

  return (
    translations[language] ||
    translations[language.split("-")[0]] ||
    translations.en ||
    translations.ru ||
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
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  // Keep the active index valid if banners change.
  useEffect(() => {
    setCurrent((previous) => Math.min(previous, total - 1));
  }, [total]);

  // Automatic slide rotation.
  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setCurrent((previous) => (previous + 1) % total);
    }, 5500);

    return () => clearInterval(timer);
  }, [total]);

  return (
    <section className="my-6">
      <div className="relative h-[280px] overflow-hidden rounded-2xl bg-slate-800 sm:h-[340px]">
        <div
          className="flex h-full transition-transform duration-[450ms] ease-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`relative flex h-full min-w-full items-center justify-between bg-gradient-to-br ${slide.gradient} px-8 text-white sm:px-14`}
            >
              {slide.image && (
                <img
                  src={slide.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
              )}

              <div className="relative z-10 max-w-lg">
                <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {slide.tag}
                </span>

                <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-4xl">
                  {slide.title}
                </h2>

                <p className="mb-6 hidden text-sm opacity-90 sm:block sm:text-base">
                  {slide.text}
                </p>

                <Link
                  to={slide.link}
                  className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {slide.btn}
                </Link>
              </div>

              <div className="relative z-10 hidden select-none text-[90px] md:block sm:text-[110px]">
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
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-slate-900 shadow-card transition hover:bg-white"
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
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl font-bold text-slate-900 shadow-card transition hover:bg-white"
          >
            ›
          </button>
        )}

        {/* Indicators */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t("home.goToSlide", {
                  number: index + 1,
                })}
                aria-current={index === current ? "true" : undefined}
                onClick={() => go(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === current ? "w-6 bg-white" : "w-2.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
