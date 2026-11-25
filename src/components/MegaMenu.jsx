import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

function getName(cat, lang = "tm") {
  return (
    cat?.translations?.[lang]?.name ||
    cat?.translations?.en?.name ||
    cat?.name ||
    cat?.slug ||
    ""
  );
}

export default function MegaMenu({ open, categories = [], onClose, onSelect }) {
  const { t, i18n } = useTranslation();

  const currentLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "tm"
  ).split("-")[0];

  // Categories are already nested by the backend
  const roots = useMemo(
    () =>
      [...categories]
        .filter((cat) => !cat.parent_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories],
  );

  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!roots.length) {
      setActiveId(null);
      return;
    }

    if (!roots.some((cat) => cat.id === activeId)) {
      setActiveId(roots[0].id);
    }
  }, [roots, activeId]);

  const active = roots.find((cat) => cat.id === activeId) || roots[0];

  // IMPORTANT: Read children directly from active category
  const children = active?.children || [];

  const handleSelect = () => {
    onSelect?.();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="absolute top-[calc(100%+12px)] left-0 z-[200] grid w-[680px] max-w-[90vw] grid-cols-[220px_1fr] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-mega"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main categories */}
      <ul className="border-r border-slate-200 bg-slate-100 py-3">
        {roots.map((cat) => {
          const isActive = active?.id === cat.id;

          return (
            <li key={cat.id}>
              <Link
                to={`/products?category=${cat.id}`}
                onMouseEnter={() => setActiveId(cat.id)}
                onClick={handleSelect}
                className={`flex w-full items-center justify-between px-5 py-3 text-left font-medium transition-colors ${
                  isActive
                    ? "bg-white text-primary"
                    : "hover:bg-white hover:text-primary"
                }`}
              >
                <span>{getName(cat, currentLanguage)}</span>
                <span className="text-slate-400">›</span>
              </Link>
            </li>
          );
        })}

        {!roots.length && (
          <li className="px-5 py-3 text-sm text-slate-500">
            {t("megaMenu.noCategories")}
          </li>
        )}
      </ul>

      {/* Category content */}
      <div className="grid grid-cols-2 content-start gap-4 p-5">
        {/* Subcategories */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {active ? getName(active, currentLanguage) : t("nav.categories")}
          </h4>

          <ul className="space-y-1.5">
            {active && (
              <li>
                <Link
                  to={`/products?category=${active.id}`}
                  onClick={handleSelect}
                  className="text-[13px] text-slate-500 transition-colors hover:text-primary"
                >
                  {t("footer.allProducts")}
                </Link>
              </li>
            )}

            {children.map((sub) => (
              <li key={sub.id}>
                <Link
                  to={`/products?category=${sub.id}`}
                  onClick={handleSelect}
                  className="text-[13px] text-slate-500 transition-colors hover:text-primary"
                >
                  {getName(sub, currentLanguage)}
                </Link>
              </li>
            ))}

            {!children.length && active && (
              <li className="text-[13px] text-slate-400">
                {t("megaMenu.noSubcategories")}
              </li>
            )}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {t("megaMenu.quickLinks")}
          </h4>

          <ul className="space-y-1.5">
            <li>
              <Link
                to="/products?featured=true"
                onClick={handleSelect}
                className="text-[13px] text-slate-500 transition-colors hover:text-primary"
              >
                {t("footer.bestSellers")}
              </Link>
            </li>

            <li>
              <Link
                to="/products"
                onClick={handleSelect}
                className="text-[13px] text-slate-500 transition-colors hover:text-primary"
              >
                {t("footer.allProducts")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
