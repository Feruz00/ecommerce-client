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

  const roots = useMemo(
    () =>
      categories
        .filter((cat) => !cat.parent_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories],
  );

  const [activeId, setActiveId] = useState(null);

  // Set the first root category when categories are loaded
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

  const children = useMemo(() => {
    if (!active) return [];

    return categories
      .filter((cat) => cat.parent_id === active.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, active]);

  const handleSelect = () => {
    onSelect?.();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="absolute top-[calc(100%+12px)] left-0 w-[680px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-mega grid grid-cols-[220px_1fr] overflow-hidden z-[200]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main categories */}
      <ul className="bg-slate-100 py-3 border-r border-slate-200">
        {roots.map((cat) => {
          const isActive = active?.id === cat.id;

          return (
            <li key={cat.id}>
              <Link
                to={`/products?category=${cat.id}`}
                onMouseEnter={() => setActiveId(cat.id)}
                onClick={handleSelect}
                className={`w-full text-left px-5 py-3 font-medium flex justify-between items-center transition-colors ${
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
      <div className="p-5 grid grid-cols-2 gap-4 content-start">
        {/* Subcategories */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">
            {active ? getName(active, currentLanguage) : t("nav.categories")}
          </h4>

          <ul className="space-y-1.5">
            {active && (
              <li>
                <Link
                  to={`/products?category=${active.id}`}
                  onClick={handleSelect}
                  className="text-[13px] text-slate-500 hover:text-primary transition-colors"
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
                  className="text-[13px] text-slate-500 hover:text-primary transition-colors"
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
          <h4 className="text-sm font-semibold text-slate-900 mb-2">
            {t("megaMenu.quickLinks")}
          </h4>

          <ul className="space-y-1.5">
            <li>
              <Link
                to="/products?featured=true"
                onClick={handleSelect}
                className="text-[13px] text-slate-500 hover:text-primary transition-colors"
              >
                {t("footer.bestSellers")}
              </Link>
            </li>

            <li>
              <Link
                to="/products"
                onClick={handleSelect}
                className="text-[13px] text-slate-500 hover:text-primary transition-colors"
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
