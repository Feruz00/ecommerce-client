import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK = [
  {
    id: 1,
    tag: 'Новинка 2026',
    title: 'Флагманские смартфоны со скидкой до 20%',
    text: 'Рассрочка 0% на 12 месяцев и бесплатная экспресс-доставка в день заказа.',
    link: '/products',
    btn: 'Смотреть каталог',
    gradient: 'from-blue-900 to-blue-500',
    emoji: '📱',
  },
  {
    id: 2,
    tag: 'Для работы и игр',
    title: 'Ультрабуки нового поколения',
    text: 'Максимальная автономность и производительность в тонком алюминиевом корпусе.',
    link: '/products',
    btn: 'Выбрать ноутбук',
    gradient: 'from-slate-900 to-slate-600',
    emoji: '💻',
  },
  {
    id: 3,
    tag: 'Звук без границ',
    title: 'Беспроводные наушники с шумоподавлением',
    text: 'Погрузитесь в любимую музыку без лишнего шума.',
    link: '/products',
    btn: 'Перейти к покупкам',
    gradient: 'from-violet-900 to-violet-600',
    emoji: '🎧',
  },
];

function mapBanner(b, i) {
  const title =
    b.translations?.ru?.title ||
    b.translations?.en?.title ||
    b.title ||
    FALLBACK[i % 3].title;
  return {
    id: b.id,
    tag: FALLBACK[i % 3].tag,
    title,
    text: FALLBACK[i % 3].text,
    link: b.link || '/products',
    btn: FALLBACK[i % 3].btn,
    gradient: FALLBACK[i % 3].gradient,
    emoji: FALLBACK[i % 3].emoji,
    image: b.image || b.imageFile?.url,
  };
}

export default function BannerCarousel({ banners = [] }) {
  const slides = banners.length ? banners.map(mapBanner) : FALLBACK;
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const go = useCallback(
    (i) => setCurrent(((i % total) + total) % total),
    [total]
  );

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 5500);
    return () => clearInterval(t);
  }, [current, go]);

  return (
    <section className="my-6">
      <div className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[340px] bg-slate-800">
        <div
          className="flex h-full transition-transform duration-[450ms] ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((s) => (
            <div
              key={s.id}
              className={`min-w-full h-full flex items-center justify-between px-8 sm:px-14 bg-gradient-to-br ${s.gradient} text-white relative`}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative max-w-lg z-10">
                <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  {s.tag}
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold leading-tight mb-3">{s.title}</h2>
                <p className="text-sm sm:text-base opacity-90 mb-6 hidden sm:block">{s.text}</p>
                <Link
                  to={s.link}
                  className="inline-block bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
                >
                  {s.btn}
                </Link>
              </div>
              <div className="relative text-[90px] sm:text-[110px] select-none hidden md:block z-10">
                {s.emoji}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Prev"
          onClick={() => go(current - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/85 hover:bg-white rounded-full flex items-center justify-center font-bold shadow-card text-xl"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => go(current + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/85 hover:bg-white rounded-full flex items-center justify-center font-bold shadow-card text-xl"
        >
          ›
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current ? 'bg-white w-6' : 'bg-white/40 w-2.5'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
