import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Seo from "../../components/Seo";
import FiltersSidebar from "../../components/FiltersSidebar";
import ProductCard from "../../components/ProductCard";
import { useProducts } from "./hooks";
import { useCategories } from "../categories/hooks";
import { useAddToCart } from "../cart/hooks";
import { useUi } from "../../context/UiContext";

function formatPrice(value, language) {
  const locales = {
    en: "en-US",
    tm: "tk-TM",
    ru: "ru-RU",
  };

  return `${Number(value || 0).toLocaleString(
    locales[language] || "en-US",
  )} TMT`;
}

function getLocalizedValue(item, field, language) {
  if (!item) return "";

  return (
    item.translations?.[language]?.[field] ||
    item.translations?.en?.[field] ||
    item.translations?.ru?.[field] ||
    item[field] ||
    ""
  );
}

function getAttributeCode(attribute) {
  return (
    attribute.code ||
    attribute.attribute?.code ||
    attribute.attribute_code ||
    ""
  );
}

function getOptionKey(attribute) {
  return String(
    attribute.option_id ??
      attribute.option?.id ??
      attribute.attribute_option_id ??
      attribute.display ??
      attribute.value ??
      "",
  );
}

function getOptionLabel(attribute, language) {
  const option = attribute.option || attribute.attributeOption;

  return (
    getLocalizedValue(option, "name", language) ||
    getLocalizedValue(option, "label", language) ||
    getLocalizedValue(attribute, "display", language) ||
    attribute.display ||
    attribute.value ||
    ""
  );
}

function getVariantDimensions(variants, language) {
  const dimensions = new Map();

  variants.forEach((variant) => {
    (variant.attributes || []).forEach((attribute) => {
      const code = getAttributeCode(attribute);

      if (!code) return;

      if (!dimensions.has(code)) {
        dimensions.set(code, {
          code,
          name:
            getLocalizedValue(attribute, "name", language) ||
            getLocalizedValue(attribute.attribute, "name", language) ||
            code,
          options: new Map(),
        });
      }

      const key = getOptionKey(attribute);
      const label = getOptionLabel(attribute, language);

      if (!key || !label) return;

      dimensions.get(code).options.set(key, {
        key,
        label,
        color: attribute.color_hex || attribute.option?.color_hex || null,
      });
    });
  });

  return [...dimensions.values()].map((dimension) => ({
    ...dimension,
    options: [...dimension.options.values()],
  }));
}

function ProductVariants({ product, language }) {
  const { t } = useTranslation();
  const addToCart = useAddToCart();
  const { openCart, openLogin } = useUi();

  const variants = product.variants || [];

  const dimensions = useMemo(
    () => getVariantDimensions(variants, language),
    [variants, language],
  );

  const [selected, setSelected] = useState(() => {
    const firstVariant =
      variants.find((variant) => Number(variant.quantity) > 0) || variants[0];

    const initial = {};

    (firstVariant?.attributes || []).forEach((attribute) => {
      const code = getAttributeCode(attribute);

      if (code) {
        initial[code] = getOptionKey(attribute);
      }
    });

    return initial;
  });

  const [quantity, setQuantity] = useState(1);

  const matchedVariant = useMemo(() => {
    if (!variants.length || !dimensions.length) return null;

    if (!dimensions.every((dimension) => selected[dimension.code])) {
      return null;
    }

    return (
      variants.find((variant) =>
        dimensions.every((dimension) => {
          const attribute = (variant.attributes || []).find(
            (item) => getAttributeCode(item) === dimension.code,
          );

          return (
            attribute && getOptionKey(attribute) === selected[dimension.code]
          );
        }),
      ) || null
    );
  }, [variants, dimensions, selected]);

  const isOptionAvailable = (dimensionCode, optionKey) => {
    const nextSelection = {
      ...selected,
      [dimensionCode]: optionKey,
    };

    return variants.some((variant) =>
      (variant.attributes || []).every((attribute) => {
        const code = getAttributeCode(attribute);

        if (!nextSelection[code]) return true;

        return getOptionKey(attribute) === nextSelection[code];
      }),
    );
  };

  const stock = Number(matchedVariant?.quantity || 0);

  const price =
    matchedVariant?.price != null
      ? Number(matchedVariant.price)
      : Number(product.price || 0);

  const handleAdd = () => {
    if (!matchedVariant || stock < quantity || stock <= 0) return;

    const selectedAttributes = {};

    (matchedVariant.attributes || []).forEach((attribute) => {
      const code = getAttributeCode(attribute);

      if (code) {
        selectedAttributes[code] = getOptionLabel(attribute, language);
      }
    });

    addToCart.mutate(
      {
        product_id: product.id,
        quantity,
        selected_attributes: {
          variant_id: matchedVariant.id,
          ...selectedAttributes,
        },
      },
      {
        onSuccess: () => openCart(),
        onError: (error) => {
          if (error?.response?.status === 401) {
            openLogin();
          }
        },
      },
    );
  };

  if (!variants.length) return null;

  return (
    <div className="border-t border-slate-100 mt-3 pt-3">
      <div className="space-y-3">
        {dimensions.map((dimension) => (
          <div key={dimension.code}>
            <p className="text-xs font-semibold text-slate-600 mb-2">
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
                    className={`
                      inline-flex items-center gap-1.5
                      px-2.5 py-1.5 rounded-md border text-xs
                      transition
                      ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary"
                      }
                      ${!available ? "opacity-30 cursor-not-allowed" : ""}
                    `}
                  >
                    {option.color && (
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
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

      <div className="flex items-center justify-between gap-3 mt-4">
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

        {matchedVariant && (
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="w-8 h-8 hover:bg-slate-50 disabled:opacity-40"
            >
              −
            </button>

            <span className="w-8 text-center text-xs font-semibold">
              {quantity}
            </span>

            <button
              type="button"
              disabled={quantity >= stock || stock <= 0}
              onClick={() =>
                setQuantity((current) => Math.min(stock, current + 1))
              }
              className="w-8 h-8 hover:bg-slate-50 disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={
          !matchedVariant ||
          stock <= 0 ||
          quantity > stock ||
          addToCart.isPending
        }
        className="
          w-full mt-3 py-2.5 rounded-lg text-sm font-semibold
          bg-primary text-white hover:bg-primary-hover
          transition disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {addToCart.isPending
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

function ProductListingCard({ product, language, t }) {
  const [expanded, setExpanded] = useState(false);

  const hasVariants = (product.variants || []).length > 0;

  return (
    <div className="min-w-0">
      <ProductCard product={product} />

      {hasVariants && (
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl px-3 pb-3 -mt-1">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="
              w-full flex items-center justify-between gap-2
              text-xs font-semibold text-primary
              hover:text-primary-hover transition py-2
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

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();

  const language = (i18n.resolvedLanguage || i18n.language || "tm").split(
    "-",
  )[0];

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

  const { data, isLoading } = useProducts(query);
  const { data: catsData } = useCategories();

  const products = data?.data?.products || [];
  const totalPages = data?.totalPages || 1;
  const categories = catsData?.data?.categories || [];

  const setSort = (sort) => {
    const next = new URLSearchParams(params);

    next.set("sort", sort);
    next.delete("page");

    setParams(next);
  };

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
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/" className="hover:text-primary">
          {t("nav.home")}
        </Link>

        <span>/</span>

        <span className="text-slate-800">{t("header.catalog")}</span>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-7 mb-16">
        <FiltersSidebar categories={categories} />

        <div className="min-w-0">
          {/* Heading and sorting */}
          <div className="flex justify-between items-center mb-5 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>

              {!isLoading && (
                <p className="text-xs text-slate-500 mt-1">
                  {t("products.results", {
                    count: data?.total || products.length,
                  })}
                </p>
              )}
            </div>

            <select
              className="
                px-3 py-2 border border-slate-200 rounded-lg
                bg-white text-sm outline-none
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

          {/* Loading */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Products */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductListingCard
                    key={product.id}
                    product={product}
                    language={language}
                    t={t}
                  />
                ))}

                {!products.length && (
                  <div className="col-span-full text-center py-16">
                    <div className="text-4xl mb-3">📦</div>

                    <p className="text-slate-700 font-semibold">
                      {t("products.empty")}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {t("products.emptyDescription")}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center flex-wrap gap-2 mt-8">
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
                        w-9 h-9 rounded-lg text-sm font-medium
                        transition
                        ${
                          pageNumber === query.page
                            ? "bg-primary text-white"
                            : "bg-white border border-slate-200 hover:border-primary"
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
    </div>
  );
}
