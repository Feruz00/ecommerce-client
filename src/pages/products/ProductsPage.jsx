import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Seo from "../../components/Seo";
import FiltersSidebar from "../../components/FiltersSidebar";
import ProductCard from "../../components/ProductCard";

import { useProducts } from "./hooks";
import { useCategories } from "../categories/hooks";
import { useAddToCart } from "../cart/hooks";
import { useUi } from "../../context/UiContext";
import { SlidersHorizontal, X } from "lucide-react";
/* -------------------------------------------------------
   Localization helpers
------------------------------------------------------- */

function formatPrice(value, language) {
  const locales = {
    en: "en-US",
    ru: "ru-RU",
    tm: "tk-TM",
  };

  return `${Number(value || 0).toLocaleString(locales[language] || "tk-TM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} TMT`;
}

function getLocalizedValue(item, field, language) {
  if (!item) return "";

  const translations = item.translations || {};
  const lang = language?.split("-")[0] || "tm";

  return (
    translations[lang]?.[field] ||
    translations.en?.[field] ||
    translations.ru?.[field] ||
    translations.tm?.[field] ||
    item[field] ||
    ""
  );
}

/* -------------------------------------------------------
   Variant helpers
------------------------------------------------------- */

function getVariantAttributes(variant) {
  const possibleAttributes = [
    variant?.attributes,
    variant?.attributeValues,
    variant?.attribute_values,
    variant?.options,
  ];

  return (
    possibleAttributes.find(
      (attributes) => Array.isArray(attributes) && attributes.length > 0,
    ) || []
  );
}

function getAttributeCode(attribute) {
  return (
    attribute?.attribute?.code ||
    attribute?.definition?.code ||
    attribute?.attributeDefinition?.code ||
    attribute?.attribute_definition?.code ||
    attribute?.code ||
    attribute?.attribute_code ||
    attribute?.attribute?.slug ||
    attribute?.attribute?.key ||
    ""
  );
}

function getOptionKey(attribute) {
  const option =
    attribute?.option ||
    attribute?.attributeOption ||
    attribute?.attribute_option;

  const value =
    attribute?.option_id ??
    option?.id ??
    attribute?.attribute_option_id ??
    attribute?.value_id ??
    attribute?.valueId ??
    attribute?.display ??
    attribute?.value_text ??
    attribute?.value ??
    "";

  return value === null || value === undefined ? "" : String(value);
}

function getOptionLabel(attribute, language) {
  const option =
    attribute?.option ||
    attribute?.attributeOption ||
    attribute?.attribute_option;

  return (
    getLocalizedValue(option, "name", language) ||
    getLocalizedValue(option, "label", language) ||
    getLocalizedValue(attribute, "display", language) ||
    getLocalizedValue(attribute, "value", language) ||
    attribute?.value_text ||
    attribute?.display ||
    attribute?.value ||
    ""
  );
}

function getVariantStock(variant) {
  return Math.max(
    0,
    Number(
      variant?.quantity ??
        variant?.stock_quantity ??
        variant?.stock ??
        variant?.available_quantity ??
        0,
    ) || 0,
  );
}

function isVariantActive(variant) {
  return (
    variant?.is_active !== false &&
    variant?.isActive !== false &&
    variant?.status !== "inactive"
  );
}

function getActiveVariants(product) {
  return (product?.variants || []).filter(isVariantActive);
}

function getVariantDimensions(variants, language) {
  const dimensions = new Map();

  variants.forEach((variant) => {
    getVariantAttributes(variant).forEach((attribute) => {
      const code = getAttributeCode(attribute);

      if (!code) return;

      if (!dimensions.has(code)) {
        const attributeDefinition =
          attribute?.attribute ||
          attribute?.definition ||
          attribute?.attributeDefinition ||
          attribute?.attribute_definition;

        dimensions.set(code, {
          code,
          name:
            getLocalizedValue(attributeDefinition, "name", language) ||
            getLocalizedValue(attribute, "name", language) ||
            code,
          options: new Map(),
        });
      }

      const key = getOptionKey(attribute);
      const label = getOptionLabel(attribute, language);

      if (!key || !label) return;

      const option =
        attribute?.option ||
        attribute?.attributeOption ||
        attribute?.attribute_option;

      dimensions.get(code).options.set(key, {
        key,
        label,
        color:
          attribute?.color_hex || option?.color_hex || option?.colorHex || null,
      });
    });
  });

  return [...dimensions.values()].map((dimension) => ({
    ...dimension,
    options: [...dimension.options.values()],
  }));
}

function getVariantAttribute(variant, dimensionCode) {
  return getVariantAttributes(variant).find(
    (attribute) => getAttributeCode(attribute) === dimensionCode,
  );
}

function matchesVariantSelection(
  variant,
  dimensions,
  selection,
  excludedDimension = null,
) {
  return dimensions.every((dimension) => {
    if (dimension.code === excludedDimension) return true;

    const selectedValue = selection[dimension.code];

    if (!selectedValue) return true;

    const attribute = getVariantAttribute(variant, dimension.code);

    return attribute && getOptionKey(attribute) === String(selectedValue);
  });
}

/* -------------------------------------------------------
   Variant selector
------------------------------------------------------- */

function ProductVariants({ product, language }) {
  const { t } = useTranslation();
  const addToCart = useAddToCart();
  const { openCart, openLogin } = useUi();
  const variants = useMemo(
    () => getActiveVariants(product),
    [product?.variants],
  );

  const dimensions = useMemo(
    () => getVariantDimensions(variants, language),
    [variants, language],
  );

  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Select the first available variant when the product variants load.
  useEffect(() => {
    const firstAvailableVariant =
      variants.find((variant) => getVariantStock(variant) > 0) || variants[0];

    const initialSelection = {};

    getVariantAttributes(firstAvailableVariant).forEach((attribute) => {
      const code = getAttributeCode(attribute);
      const key = getOptionKey(attribute);

      if (code && key) {
        initialSelection[code] = key;
      }
    });

    setSelected(initialSelection);
    setQuantity(1);
  }, [variants]);

  // Find the variant matching all selected attributes.
  const matchedVariant = useMemo(() => {
    if (!variants.length) return null;

    // Some products may have variants without selectable attributes.
    if (!dimensions.length) {
      return (
        variants.find((variant) => getVariantStock(variant) > 0) || variants[0]
      );
    }

    const allSelected = dimensions.every((dimension) =>
      Boolean(selected[dimension.code]),
    );

    if (!allSelected) return null;

    return (
      variants.find((variant) =>
        dimensions.every((dimension) => {
          const attribute = getVariantAttribute(variant, dimension.code);

          return (
            attribute &&
            getOptionKey(attribute) === String(selected[dimension.code])
          );
        }),
      ) || null
    );
  }, [variants, dimensions, selected]);

  const stock = getVariantStock(matchedVariant);

  const price =
    matchedVariant?.price !== null && matchedVariant?.price !== undefined
      ? Number(matchedVariant.price)
      : Number(product?.price || 0);

  // Reset quantity when the selected variant changes.
  useEffect(() => {
    setQuantity(1);
  }, [matchedVariant?.id]);

  // An option is available only if it can produce an in-stock variant.
  const isOptionAvailable = (dimensionCode, optionKey) => {
    const nextSelection = {
      ...selected,
      [dimensionCode]: optionKey,
    };

    return variants.some((variant) => {
      if (getVariantStock(variant) <= 0) return false;

      return (
        matchesVariantSelection(
          variant,
          dimensions,
          nextSelection,
          dimensionCode,
        ) &&
        (() => {
          const attribute = getVariantAttribute(variant, dimensionCode);

          return attribute && getOptionKey(attribute) === String(optionKey);
        })()
      );
    });
  };

  const handleAdd = () => {
    if (!matchedVariant || stock <= 0 || quantity < 1 || quantity > stock) {
      return;
    }

    const selectedAttributes = {};

    getVariantAttributes(matchedVariant).forEach((attribute) => {
      const code = getAttributeCode(attribute);
      const label = getOptionLabel(attribute, language);

      if (code && label) {
        selectedAttributes[code] = label;
      }
    });

    addToCart.mutate(
      {
        product_id: product.id,
        variant_id: matchedVariant.id,
        quantity: Number(quantity),
        selected_attributes: selectedAttributes,
      },
      {
        onSuccess: () => {
          openCart();
        },
        onError: (error) => {
          if (error?.response?.status === 401) {
            openLogin();
          }
        },
      },
    );
  };

  if (!variants.length) return null;

  const isPending = addToCart.isPending ?? addToCart.isLoading ?? false;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="space-y-3">
        {dimensions.map((dimension) => (
          <div key={dimension.code}>
            <p className="mb-2 text-xs font-semibold text-slate-600">
              {dimension.name}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {dimension.options.map((option) => {
                const active = selected[dimension.code] === option.key;
                const available = isOptionAvailable(dimension.code, option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSelected((current) => ({
                        ...current,
                        [dimension.code]: option.key,
                      }));
                      setQuantity(1);
                    }}
                    aria-pressed={active}
                    className={`
                      inline-flex items-center gap-1.5
                      rounded-md border px-2.5 py-1.5
                      text-xs transition
                      ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary"
                      }
                      ${
                        !available
                          ? "cursor-not-allowed opacity-30"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    {option.color && (
                      <span
                        className="h-3 w-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: option.color }}
                      />
                    )}

                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Price, stock and quantity */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {formatPrice(price, language)}
          </p>

          <p className="text-xs text-slate-500">
            {matchedVariant
              ? `${t("product.inStock")}: ${stock}`
              : t("product.selectVariant")}
          </p>
        </div>

        {matchedVariant && stock > 0 && (
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label={t("product.decreaseQuantity")}
              className="h-8 w-8 hover:bg-slate-50 disabled:opacity-40"
            >
              −
            </button>

            <span className="w-8 text-center text-xs font-semibold">
              {quantity}
            </span>

            <button
              type="button"
              disabled={quantity >= stock}
              onClick={() =>
                setQuantity((current) => Math.min(stock, current + 1))
              }
              aria-label={t("product.increaseQuantity")}
              className="h-8 w-8 hover:bg-slate-50 disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Add to cart */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={
          !matchedVariant || stock <= 0 || quantity > stock || isPending
        }
        className="
          mt-3 w-full rounded-lg bg-primary py-2.5
          text-sm font-semibold text-white
          transition hover:bg-primary-hover
          disabled:cursor-not-allowed disabled:opacity-40
        "
      >
        {isPending
          ? t("common.loading")
          : !matchedVariant
            ? t("product.selectVariant")
            : stock <= 0
              ? t("product.outOfStock")
              : t("product.addToCart")}
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   Product listing card
------------------------------------------------------- */

function ProductListingCard({ product, language, t }) {
  const [expanded, setExpanded] = useState(false);

  const hasVariants = getActiveVariants(product).length > 0;

  return (
    <div className="min-w-0">
      <ProductCard product={product} />

      {hasVariants && (
        <div className="-mt-1 rounded-b-xl border border-slate-200 border-t-0 bg-white px-3 pb-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="
              flex w-full items-center justify-between gap-2
              py-2 text-xs font-semibold text-primary
              transition hover:text-primary-hover
            "
          >
            <span>
              {expanded
                ? t("product.hideVariants")
                : t("product.chooseOptions")}
            </span>

            <span
              className={`
                text-lg leading-none transition-transform
                ${expanded ? "rotate-45" : ""}
              `}
            >
              +
            </span>
          </button>

          {expanded && (
            <ProductVariants product={product} language={language} />
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Products page
------------------------------------------------------- */

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const language = (i18n.resolvedLanguage || i18n.language || "tm").split(
    "-",
  )[0];

  // Build API query from URL parameters.
  const query = {
    page: Number(params.get("page") || 1),
    limit: 12,
    category: params.get("category") || undefined,
    search: params.get("search") || undefined,
    featured: params.get("featured") || undefined,
    sort: params.get("sort") || "created_at",
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
  };

  params.forEach((value, key) => {
    if (key.startsWith("attr_") && value) {
      query[key] = value;
    }
  });

  const { data, isLoading, isError } = useProducts(query);
  const { data: catsData } = useCategories();

  const products = data?.data?.products || [];
  const totalPages = data?.totalPages || 1;
  const categories = catsData?.data?.categories || [];

  // Sorting.
  const setSort = (sort) => {
    const next = new URLSearchParams(params);

    next.set("sort", sort);
    next.delete("page");

    setParams(next);
  };

  // Pagination.
  const setPage = (page) => {
    const next = new URLSearchParams(params);

    next.set("page", String(page));
    setParams(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const pageTitle = query.search
    ? t("products.searchTitle", { search: query.search })
    : t("products.title");

  return (
    <div className="container-main py-6">
      <Seo
        title={pageTitle}
        description={t("products.description")}
        path="/products"
      />

      {/* Breadcrumbs */}
      <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">
          {t("nav.home")}
        </Link>

        <span>/</span>

        <span className="text-slate-800">{t("header.catalog")}</span>
      </div>

      <section className="mb-16 grid grid-cols-1 gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <FiltersSidebar categories={categories} />
        </aside>

        <div className="min-w-0">
          {/* Heading and sorting */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>

              {!isLoading && !isError && (
                <p className="mt-1 text-xs text-slate-500">
                  {t("products.results", {
                    count: data?.total || products.length,
                  })}
                </p>
              )}
            </div>

            <select
              className="
                rounded-lg border border-slate-200
                bg-white px-3 py-2 text-sm outline-none
                focus:border-primary
              "
              value={query.sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={t("products.sort")}
            >
              <option value="created_at">{t("products.sortNewest")}</option>

              <option value="price">{t("products.sortPriceAsc")}</option>

              <option value="price_desc">{t("products.sortPriceDesc")}</option>

              <option value="sold_count">{t("products.sortPopular")}</option>
            </select>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="
            inline-flex min-h-10 flex-1 items-center
            justify-center gap-2 rounded-lg
            border border-slate-200 bg-white px-3 py-2
            text-sm font-medium text-slate-700
            transition hover:border-primary hover:text-primary
            lg:hidden sm:flex-none
          "
            >
              <SlidersHorizontal size={16} />
              {t("filters.title")}
            </button>

            {/* Sorting */}
            <select
              className="
            min-h-10 min-w-0 flex-1 rounded-lg
            border border-slate-200 bg-white px-3 py-2
            text-sm outline-none focus:border-primary
            sm:flex-none
          "
              value={query.sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={t("products.sort")}
            >
              <option value="created_at">{t("products.sortNewest")}</option>
              <option value="price">{t("products.sortPriceAsc")}</option>
              <option value="price_desc">{t("products.sortPriceDesc")}</option>
              <option value="sold_count">{t("products.sortPopular")}</option>
            </select>
          </div>
          {/* Loading */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="
                    h-72 animate-pulse rounded-xl
                    border border-slate-200 bg-white
                  "
                />
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-slate-700">
                {t("common.error")}
              </p>
            </div>
          ) : (
            <>
              {/* Products */}
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                {products.map((product) => (
                  <ProductListingCard
                    key={product.id}
                    product={product}
                    language={language}
                    t={t}
                  />
                ))}

                {!products.length && (
                  <div className="col-span-full py-16 text-center">
                    <div className="mb-3 text-4xl">📦</div>

                    <p className="font-semibold text-slate-700">
                      {t("products.empty")}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {t("products.emptyDescription")}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      aria-current={
                        pageNumber === query.page ? "page" : undefined
                      }
                      className={`
                        h-9 w-9 rounded-lg text-sm font-medium
                        transition
                        ${
                          pageNumber === query.page
                            ? "bg-primary text-white"
                            : "border border-slate-200 bg-white hover:border-primary"
                        }
                      `}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      {filtersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          {/* Drawer */}
          <div
            className="
      absolute inset-y-0 left-0 flex
      w-[min(88%,360px)] flex-col
      overflow-hidden bg-white shadow-2xl
    "
          >
            {/* Header */}
            <div
              className="
        flex items-center justify-between
        border-b border-slate-100 px-4 py-4
      "
            >
              <h3 className="text-base font-bold text-slate-900">
                {t("filters.title")}
              </h3>

              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setFiltersOpen(false)}
                className="
            flex h-9 w-9 items-center justify-center
            rounded-lg text-slate-500
            transition hover:bg-slate-100 hover:text-slate-900
          "
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <FiltersSidebar
                categories={categories}
                onApply={() => setFiltersOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
