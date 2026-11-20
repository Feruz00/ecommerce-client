import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ProductCard from "../../components/ProductCard";
import Seo from "../../components/Seo";
import { useProduct } from "./hooks";
import { useAddToCart } from "../cart/hooks";
import { useUi } from "../../context/UiContext";
import { formatPrice } from "../../utils/cart";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function getLocalizedValue(item, field, language) {
  if (!item) return "";

  return (
    item?.translations?.[language]?.[field] ||
    item?.translations?.en?.[field] ||
    item?.translations?.ru?.[field] ||
    item?.[field] ||
    ""
  );
}

function getVariantAttributes(variant) {
  return (
    variant?.attributeValues ||
    variant?.attribute_values ||
    variant?.attributes ||
    variant?.options ||
    []
  );
}

function getAttributeCode(entry) {
  const attribute =
    entry?.attribute || entry?.definition || entry?.attributeDefinition;

  return String(
    attribute?.code ||
      attribute?.slug ||
      attribute?.key ||
      entry?.attribute_code ||
      entry?.code ||
      attribute?.id ||
      entry?.attribute_id ||
      "",
  );
}

function getAttributeName(entry, language) {
  const attribute =
    entry?.attribute || entry?.definition || entry?.attributeDefinition;

  return (
    getLocalizedValue(attribute, "name", language) ||
    getLocalizedValue(entry, "name", language) ||
    attribute?.code ||
    entry?.attribute_code ||
    ""
  );
}

function getOption(entry) {
  return (
    entry?.option || entry?.attributeOption || entry?.attribute_option || null
  );
}

function getOptionLabel(entry, language) {
  const option = getOption(entry);

  return (
    getLocalizedValue(option, "name", language) ||
    getLocalizedValue(option, "label", language) ||
    getLocalizedValue(entry, "value_text", language) ||
    getLocalizedValue(entry, "display", language) ||
    getLocalizedValue(entry, "value", language) ||
    ""
  );
}

function getOptionKey(entry) {
  const option = getOption(entry);

  const value =
    entry?.option_id ??
    option?.id ??
    entry?.attribute_option_id ??
    entry?.value_text ??
    entry?.display ??
    entry?.value ??
    "";

  return String(value);
}

function getVariantImage(variant) {
  if (!variant) return null;

  const image =
    variant?.imageFile ||
    variant?.image_file ||
    variant?.image ||
    variant?.images?.[0];

  if (typeof image === "string") return image;

  return image?.url || image?.path || null;
}

function getProductImages(product) {
  if (product?.images?.length) {
    return product.images
      .map((image) =>
        typeof image === "string" ? image : image?.url || image?.path,
      )
      .filter(Boolean);
  }

  if (product?.image) {
    return [
      typeof product.image === "string" ? product.image : product.image?.url,
    ].filter(Boolean);
  }

  if (product?.primaryImage?.url) {
    return [product.primaryImage.url];
  }

  return [];
}

function getVariantPrice(variant, product) {
  if (
    variant?.price !== null &&
    variant?.price !== undefined &&
    variant?.price !== ""
  ) {
    return Number(variant.price);
  }

  return Number(product?.price || 0);
}

function getVariantComparePrice(variant, product) {
  if (
    variant?.compare_at_price !== null &&
    variant?.compare_at_price !== undefined &&
    variant?.compare_at_price !== ""
  ) {
    return Number(variant.compare_at_price);
  }

  if (
    variant?.compareAtPrice !== null &&
    variant?.compareAtPrice !== undefined &&
    variant?.compareAtPrice !== ""
  ) {
    return Number(variant.compareAtPrice);
  }

  return product?.compare_at_price ? Number(product.compare_at_price) : null;
}

/* -------------------------------------------------------
   Component
------------------------------------------------------- */

export default function ProductDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const language = (i18n.resolvedLanguage || i18n.language || "tm").split(
    "-",
  )[0];

  const { data, isLoading } = useProduct(id);

  const addToCart = useAddToCart();

  const { openCart, openLogin } = useUi();

  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});

  const p = data?.data?.product;

  const variants = p?.variants || [];
  const attributes = p?.attributes || [];

  /* -------------------------------------------------------
     Active variants
  ------------------------------------------------------- */

  const activeVariants = useMemo(() => {
    return variants.filter(
      (variant) => variant?.is_active !== false && variant?.isActive !== false,
    );
  }, [variants]);

  const hasVariants = variants.length > 0;

  /* -------------------------------------------------------
     Build variant dimensions

     Example:
     Color:
       White
       Black

     Storage:
       128 GB
       256 GB
       512 GB
  ------------------------------------------------------- */

  const variantDims = useMemo(() => {
    const dimensions = new Map();

    activeVariants.forEach((variant) => {
      const entries = getVariantAttributes(variant);

      entries.forEach((entry) => {
        const code = getAttributeCode(entry);

        if (!code) return;

        if (!dimensions.has(code)) {
          dimensions.set(code, {
            code,
            name: getAttributeName(entry, language),
            options: new Map(),
          });
        }

        const key = getOptionKey(entry);
        const label = getOptionLabel(entry, language);

        if (!key || !label) return;

        const option = getOption(entry);

        dimensions.get(code).options.set(key, {
          key,
          label,
          color: entry?.color_hex || option?.color_hex || option?.color || null,
        });
      });
    });

    return Array.from(dimensions.values()).map((dimension) => ({
      ...dimension,
      options: Array.from(dimension.options.values()),
    }));
  }, [activeVariants, language]);

  /* -------------------------------------------------------
     Reset selection when product changes
  ------------------------------------------------------- */

  useEffect(() => {
    setSelected({});
    setQty(1);
  }, [id]);

  /* -------------------------------------------------------
     Select first available variant automatically
  ------------------------------------------------------- */

  useEffect(() => {
    if (!activeVariants.length || !variantDims.length) {
      setSelected({});
      return;
    }

    const firstVariant =
      activeVariants.find((variant) => Number(variant.quantity || 0) > 0) ||
      activeVariants[0];

    const initialSelection = {};

    getVariantAttributes(firstVariant).forEach((entry) => {
      const code = getAttributeCode(entry);
      const key = getOptionKey(entry);

      if (code && key) {
        initialSelection[code] = key;
      }
    });

    setSelected(initialSelection);
    setQty(1);
  }, [id, activeVariants, variantDims]);

  /* -------------------------------------------------------
     Variant matching

     Every dimension must match the selected option.
  ------------------------------------------------------- */

  const matchesSelection = (variant, selection) => {
    const entries = getVariantAttributes(variant);

    return variantDims.every((dimension) => {
      const selectedValue = selection[dimension.code];

      if (selectedValue === undefined || selectedValue === "") {
        return false;
      }

      const entry = entries.find(
        (item) => getAttributeCode(item) === dimension.code,
      );

      if (!entry) return false;

      return getOptionKey(entry) === String(selectedValue);
    });
  };

  const matchedVariant = useMemo(() => {
    if (!activeVariants.length || !variantDims.length) {
      return null;
    }

    const allSelected = variantDims.every(
      (dimension) =>
        selected[dimension.code] !== undefined &&
        selected[dimension.code] !== "",
    );

    if (!allSelected) return null;

    return (
      activeVariants.find((variant) => matchesSelection(variant, selected)) ||
      null
    );
  }, [activeVariants, variantDims, selected]);

  /* -------------------------------------------------------
     Loading and not found
  ------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="container-main flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container-main py-20 text-center text-slate-500">
        {t("product.notFound")}
      </div>
    );
  }

  /* -------------------------------------------------------
     Product information
  ------------------------------------------------------- */

  const name = getLocalizedValue(p, "name", language);
  const desc = getLocalizedValue(p, "description", language);
  const categoryName = getLocalizedValue(p.category, "name", language);

  const images = getProductImages(p);

  const mainImg = getVariantImage(matchedVariant) || images[0] || null;

  /* -------------------------------------------------------
     Price and stock

     Variant price has priority over product price.
  ------------------------------------------------------- */

  const price = hasVariants
    ? matchedVariant
      ? getVariantPrice(matchedVariant, p)
      : Number(p.price || 0)
    : Number(p.price || 0);

  const compare = hasVariants
    ? matchedVariant
      ? getVariantComparePrice(matchedVariant, p)
      : p.compare_at_price
        ? Number(p.compare_at_price)
        : null
    : p.compare_at_price
      ? Number(p.compare_at_price)
      : null;

  const stock = hasVariants
    ? matchedVariant
      ? Number(matchedVariant.quantity || 0)
      : 0
    : Number(p.quantity || 0);

  /* -------------------------------------------------------
     Can add to cart?
  ------------------------------------------------------- */

  const canAddToCart =
    (!hasVariants || Boolean(matchedVariant)) &&
    stock > 0 &&
    qty > 0 &&
    qty <= stock &&
    !addToCart.isPending;

  /* -------------------------------------------------------
     Check option availability

     Check the complete combination, not only one attribute.
  ------------------------------------------------------- */

  const isOptionAvailable = (dimensionCode, optionKey) => {
    const nextSelection = {
      ...selected,
      [dimensionCode]: String(optionKey),
    };

    return activeVariants.some((variant) => {
      const entries = getVariantAttributes(variant);

      return variantDims.every((dimension) => {
        const selectedValue = nextSelection[dimension.code];

        // This dimension has not been selected yet.
        if (selectedValue === undefined || selectedValue === "") {
          return true;
        }

        const entry = entries.find(
          (item) => getAttributeCode(item) === dimension.code,
        );

        return Boolean(entry) && getOptionKey(entry) === String(selectedValue);
      });
    });
  };

  /* -------------------------------------------------------
     Change selected variant option
  ------------------------------------------------------- */

  const handleVariantChange = (dimensionCode, optionKey) => {
    setSelected((current) => ({
      ...current,
      [dimensionCode]: String(optionKey),
    }));

    setQty(1);
  };

  /* -------------------------------------------------------
     Add to cart

     IMPORTANT:
     Send variant_id separately.
  ------------------------------------------------------- */

  const handleAdd = () => {
    if (!canAddToCart) return;

    const selectedAttributes = {};

    if (matchedVariant) {
      getVariantAttributes(matchedVariant).forEach((entry) => {
        const code = getAttributeCode(entry);
        const label = getOptionLabel(entry, language);

        if (code && label) {
          selectedAttributes[code] = label;
        }
      });
    }

    addToCart.mutate(
      {
        product_id: p.id,

        // The actual variant ID is important.
        variant_id: matchedVariant?.id || null,

        quantity: Number(qty),

        // Human-readable snapshot of the selected attributes.
        selected_attributes: selectedAttributes,
      },
      {
        onSuccess: () => {
          openCart();
        },

        onError: (err) => {
          if (err?.response?.status === 401) {
            openLogin();
          }
        },
      },
    );
  };

  /* -------------------------------------------------------
     SEO
  ------------------------------------------------------- */

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: desc || name,
    image: mainImg,
    sku: matchedVariant?.sku || p.sku,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "TMT",
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="container-main py-8">
      <Seo
        title={name}
        description={(desc || name || "").slice(0, 160)}
        path={`/products/${p.slug || p.id}`}
        image={mainImg}
        type="product"
        jsonLd={jsonLd}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">
          {t("nav.home")}
        </Link>

        <span>/</span>

        <Link to="/products" className="hover:text-primary">
          {t("header.catalog")}
        </Link>

        <span>/</span>

        <span className="text-slate-800">{name}</span>
      </nav>

      <div className="mb-16 grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Product image */}
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {mainImg ? (
            <img
              src={mainImg}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-8xl">📦</span>
          )}
        </div>

        {/* Product details */}
        <div>
          {categoryName && (
            <p className="mb-1 text-sm font-medium text-primary">
              {categoryName}
            </p>
          )}

          <h1 className="mb-3 text-2xl font-bold text-slate-900 md:text-3xl">
            {name}
          </h1>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="text-amber-400">
              {"★".repeat(Math.round(p.rating_avg || 0))}
            </span>

            <span>
              ({p.rating_count || 0} {t("product.reviews")})
            </span>
          </div>

          {/* Price */}
          <div className="mb-6 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatPrice(price, language)}
            </span>

            {compare && compare > price && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(compare, language)}
              </span>
            )}
          </div>

          {desc && (
            <p className="mb-6 leading-relaxed text-slate-600">{desc}</p>
          )}

          {/* Variants */}
          {hasVariants && (
            <div className="mb-6 space-y-5">
              {variantDims.map((dimension) => {
                const selectedOption = dimension.options.find(
                  (option) => option.key === selected[dimension.code],
                );

                return (
                  <div key={dimension.code}>
                    <div className="mb-2 text-sm font-semibold text-slate-800">
                      {dimension.name}

                      {selectedOption && (
                        <span className="ml-2 font-normal text-primary">
                          {selectedOption.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dimension.options.map((option) => {
                        const active = selected[dimension.code] === option.key;

                        const available = isOptionAvailable(
                          dimension.code,
                          option.key,
                        );

                        return (
                          <button
                            key={option.key}
                            type="button"
                            disabled={!available}
                            onClick={() =>
                              handleVariantChange(dimension.code, option.key)
                            }
                            className={`
                              flex items-center gap-2 rounded-lg border px-3 py-2
                              text-sm font-medium transition
                              ${
                                active
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                  : "border-slate-200 hover:border-primary"
                              }
                              ${
                                !available
                                  ? "cursor-not-allowed opacity-30 line-through"
                                  : ""
                              }
                            `}
                          >
                            {option.color && (
                              <span
                                className="h-4 w-4 shrink-0 rounded-full border border-slate-300"
                                style={{
                                  backgroundColor: option.color,
                                }}
                              />
                            )}

                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!activeVariants.length && (
                <p className="text-sm text-red-500">
                  Этот товар сейчас недоступен.
                </p>
              )}

              {activeVariants.length > 0 && !matchedVariant && (
                <p className="text-sm text-amber-600">
                  Выберите все характеристики товара.
                </p>
              )}

              {matchedVariant && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Выбранный вариант
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {matchedVariant.sku || "—"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Цена варианта
                    </span>

                    <span className="text-sm font-bold text-primary">
                      {formatPrice(price, language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity and add to cart */}
          <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex w-fit items-center overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                disabled={qty <= 1}
                className="h-11 w-11 hover:bg-slate-50 disabled:opacity-40"
                onClick={() => setQty((current) => Math.max(1, current - 1))}
              >
                −
              </button>

              <span className="w-12 text-center font-semibold">{qty}</span>

              <button
                type="button"
                disabled={qty >= stock || stock <= 0}
                className="h-11 w-11 hover:bg-slate-50 disabled:opacity-40"
                onClick={() =>
                  setQty((current) => Math.min(stock, current + 1))
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAddToCart}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addToCart.isPending
                ? t("common.loading")
                : stock <= 0
                  ? t("product.outOfStock")
                  : t("product.addToCart")}
            </button>
          </div>

          {/* Stock */}
          <p className="mb-8 text-sm text-slate-500">
            {t("product.inStock")}:{" "}
            <span className="font-semibold text-slate-800">{stock}</span>{" "}
            {t("product.pieces")}
          </p>

          {/* Specifications */}
          {attributes.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                {t("product.specifications")}
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {attributes.map((attribute, index) => {
                    const attributeName = getAttributeName(attribute, language);

                    const attributeValue = getOptionLabel(attribute, language);

                    return (
                      <tr
                        key={attribute.attribute_id || attribute.id || index}
                        className="border-t border-slate-100"
                      >
                        <td className="w-1/2 px-4 py-3 text-slate-500">
                          {attributeName}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {attributeValue}
                          {attribute.unit ? ` ${attribute.unit}` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {p.related?.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            {t("product.related")}
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {p.related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
