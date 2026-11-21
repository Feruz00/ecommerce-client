import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api from "../api/axios";

/**
 * Get localized text from category, facet or option.
 *
 * Supports:
 * translations: {
 *   en: { name: "Clothing" },
 *   ru: { name: "Одежда" },
 *   tm: { name: "Geýimler" }
 * }
 *
 * Also supports translations containing strings directly.
 */
function getLocalizedValue(item, language, field = "name") {
  if (!item) return "";

  const translations = item.translations || {};

  const lang = language?.split("-")[0] || "en";

  const localized =
    translations[lang]?.[field] ||
    (typeof translations[lang] === "string" ? translations[lang] : null);

  const english =
    translations.en?.[field] ||
    (typeof translations.en === "string" ? translations.en : null);

  const russian =
    translations.ru?.[field] ||
    (typeof translations.ru === "string" ? translations.ru : null);

  const turkmen =
    translations.tm?.[field] ||
    (typeof translations.tm === "string" ? translations.tm : null);

  return (
    localized ||
    english ||
    russian ||
    turkmen ||
    item[field] ||
    item.name ||
    item.label ||
    item.value ||
    item.slug ||
    ""
  );
}

function getInitialAttributes(params) {
  const initial = {};

  params.forEach((value, key) => {
    if (key.startsWith("attr_")) {
      initial[key.slice(5)] = value;
    }
  });

  return initial;
}

export default function FiltersSidebar({ categories = [] }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage || i18n.language;

  const roots = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories],
  );

  // Attribute facets
  const { data: facetsData } = useQuery({
    queryKey: ["facets"],
    queryFn: () =>
      api.get("/attributes/facets").then((response) => response.data),
    staleTime: 5 * 60 * 1000,
  });

  const facets = facetsData?.data?.facets || [];

  // Filter states
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");

  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");

  const [selectedCats, setSelectedCats] = useState(() => {
    const category = params.get("category");
    return category ? [category] : [];
  });

  const [featuredOnly, setFeaturedOnly] = useState(
    params.get("featured") === "true",
  );

  const [attrFilters, setAttrFilters] = useState(() =>
    getInitialAttributes(params),
  );

  // Synchronize filters when URL changes.
  useEffect(() => {
    setMinPrice(params.get("minPrice") || "");
    setMaxPrice(params.get("maxPrice") || "");

    const category = params.get("category");
    setSelectedCats(category ? [category] : []);

    setFeaturedOnly(params.get("featured") === "true");

    setAttrFilters(getInitialAttributes(params));
  }, [params]);

  // Category selection.
  // The API uses one category query parameter, so only one category
  // can be selected at a time.
  const toggleCat = (id) => {
    const value = String(id);

    setSelectedCats((previous) => (previous.includes(value) ? [] : [value]));
  };

  // Attribute selection.
  const setAttr = (code, value) => {
    setAttrFilters((previous) => {
      const next = { ...previous };

      if (!value) {
        delete next[code];
      } else {
        next[code] = value;
      }

      return next;
    });
  };

  // Apply filters.
  const apply = () => {
    const query = new URLSearchParams();

    if (selectedCats[0]) {
      query.set("category", selectedCats[0]);
    }

    if (minPrice !== "") {
      query.set("minPrice", minPrice);
    }

    if (maxPrice !== "") {
      query.set("maxPrice", maxPrice);
    }

    if (featuredOnly) {
      query.set("featured", "true");
    }

    Object.entries(attrFilters).forEach(([code, value]) => {
      if (value !== "") {
        query.set(`attr_${code}`, value);
      }
    });

    navigate(`/products?${query.toString()}`);
  };

  // Reset filters.
  const reset = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedCats([]);
    setFeaturedOnly(false);
    setAttrFilters({});

    navigate("/products");
  };

  return (
    <aside className="sticky top-[88px] h-fit rounded-xl border border-slate-200 bg-white p-5">
      {/* Price */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h3 className="mb-3 text-[15px] font-semibold text-slate-800">
          {t("filters.price")} ({t("common.currency")})
        </h3>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder={t("filters.from")}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="w-full rounded-md border border-slate-200 p-2 text-[13px] outline-none transition-colors focus:border-primary"
          />

          <span className="text-slate-400">—</span>

          <input
            type="number"
            min="0"
            placeholder={t("filters.to")}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-full rounded-md border border-slate-200 p-2 text-[13px] outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h3 className="mb-3 text-[15px] font-semibold text-slate-800">
          {t("filters.category")}
        </h3>

        {roots.length ? (
          <div className="space-y-2">
            {roots.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 transition-colors hover:text-primary"
              >
                <input
                  type="checkbox"
                  checked={selectedCats.includes(String(category.id))}
                  onChange={() => toggleCat(category.id)}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />

                <span>{getLocalizedValue(category, language)}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t("filters.noCategories")}</p>
        )}
      </div>

      {/* Dynamic attribute filters */}
      {facets.map((facet) => (
        <div
          key={facet.id || facet.code}
          className="mb-6 border-b border-slate-200 pb-5"
        >
          <h3 className="mb-3 text-[15px] font-semibold text-slate-800">
            {getLocalizedValue(facet, language)}
          </h3>

          {/* Select and color attributes */}
          {["select", "color"].includes(facet.type) ? (
            <div className="space-y-2">
              {(facet.options || []).map((option) => (
                <label
                  key={option.id || option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 transition-colors hover:text-primary"
                >
                  <input
                    type="radio"
                    name={`facet_${facet.code}`}
                    checked={attrFilters[facet.code] === String(option.value)}
                    onChange={() => setAttr(facet.code, String(option.value))}
                    className="border-slate-300 text-primary focus:ring-primary"
                  />

                  {facet.type === "color" && option.color_hex && (
                    <span
                      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200"
                      style={{
                        backgroundColor: option.color_hex,
                      }}
                    />
                  )}

                  <span>
                    {getLocalizedValue(option, language, "label") ||
                      option.value}
                  </span>
                </label>
              ))}

              {attrFilters[facet.code] && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setAttr(facet.code, "")}
                >
                  {t("filters.reset")}
                </button>
              )}
            </div>
          ) : facet.type === "boolean" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={attrFilters[facet.code] === "true"}
                onChange={(event) =>
                  setAttr(facet.code, event.target.checked ? "true" : "")
                }
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />

              {t("filters.yes")}
            </label>
          ) : (
            <input
              type="text"
              value={attrFilters[facet.code] || ""}
              onChange={(event) => setAttr(facet.code, event.target.value)}
              placeholder={getLocalizedValue(facet, language)}
              className="w-full rounded-md border border-slate-200 p-2 text-[13px] outline-none transition-colors focus:border-primary"
            />
          )}
        </div>
      ))}

      {/* Featured products */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h3 className="mb-3 text-[15px] font-semibold text-slate-800">
          {t("filters.featured")}
        </h3>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />

          {t("filters.featuredOnly")}
        </label>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={apply}
          className="w-full rounded-lg bg-primary py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t("filters.apply")}
        </button>

        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary"
        >
          {t("filters.clear")}
        </button>
      </div>
    </aside>
  );
}
