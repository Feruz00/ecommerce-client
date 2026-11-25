import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FALLBACK = [
  {
    id: "fallback-1",
    key: "banner1",
    link: "/products",
    gradient: "from-blue-900 to-blue-500",
    emoji: "📱",
  },
  {
    id: "fallback-2",
    key: "banner2",
    link: "/products",
    gradient: "from-slate-900 to-slate-600",
    emoji: "💻",
  },
  {
    id: "fallback-3",
    key: "banner3",
    link: "/products",
    gradient: "from-violet-900 to-violet-600",
    emoji: "🎧",
  },
];

function mapBanner(banner, index, t) {
  const fallback = FALLBACK[index % FALLBACK.length];

  return {
    id: banner.id ?? `banner-${index}`,
    link: banner.link || fallback.link,
    btn: t(`home.${fallback.key}.button`),
    gradient: fallback.gradient,
    emoji: fallback.emoji,
    image: banner.image || banner.imageFile?.url || null,
  };
}

function getSafeLink(link) {
  if (!link || typeof link !== "string") return "/products";

  const value = link.trim();

  // Only allow internal paths or HTTP(S) external URLs.
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch {
      return "/products";
    }
  }

  return "/products";
}

function BannerButton({ link, children }) {
  const safeLink = getSafeLink(link);
  const isExternal = /^https?:\/\//i.test(safeLink);

  if (isExternal) {
    return (
      <a
        href={safeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:min-h-11 sm:px-6 sm:text-sm"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={safeLink}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:min-h-11 sm:px-6 sm:text-sm"
    >
      {children}
    </Link>
  );
}

export default function BannerCarousel({ banners = [] }) {
  const { t } = useTranslation();
  const slides = useMemo(() => {
    if (banners.length) {
      return banners.map((banner, index) => mapBanner(banner, index, t));
    }

    return FALLBACK.map((slide) => ({
      ...slide,
      tag: t(`home.${slide.key}.tag`),
      btn: t(`home.${slide.key}.button`),
      image: null,
    }));
  }, [banners, t]);

  const [current, setCurrent] = useState(0);

  const total = slides.length;

  const go = useCallback(
    (index) => {
      if (!total) return;

      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  // Keep active slide valid when banners change.
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
            <Link
              to={slide.link}
              key={slide.id}
              className={`relative cursor-pointer flex h-full min-w-full items-center overflow-hidden bg-gradient-to-br ${slide.gradient} px-5 py-6 text-white sm:px-10 sm:py-8 lg:px-14`}
            >
              {/* Background image */}
              {slide.image && (
                <>
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-slate-950/55" />
                </>
              )}

              {!slide.image && (
                <div className="relative z-10 ml-auto hidden shrink-0 select-none text-7xl md:block lg:text-[110px]">
                  {slide.emoji}
                </div>
              )}
            </Link>
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
            className="absolute right-2 
            top-1/2 flex h-8 w-8 -translate-y-1/2
              text-xl
            items-center justify-center rounded-full bg-white/85 
            font-bold text-slate-900 shadow-card transition hover:bg-white sm:right-4 sm:h-10 sm:w-10 sm:text-xl"
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
