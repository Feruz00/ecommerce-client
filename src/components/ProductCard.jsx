import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";

import { useUi } from "../context/UiContext";
import { useAddToCart } from "../pages/cart/hooks";

function formatPrice(value, language) {
  if (value == null) return "";

  const locales = {
    en: "en-US",
    ru: "ru-RU",
    tm: "tk-TM",
  };

  return (
    Number(value).toLocaleString(locales[language] || "tk-TM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " TMT"
  );
}

function getVariantAttributes(variant) {
  return (
    variant?.attributes ||
    variant?.attributeValues ||
    variant?.attribute_values ||
    []
  );
}

function getDefaultVariant(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const activeVariants = variants.filter(
    (variant) =>
      variant.is_active !== false &&
      variant.isActive !== false &&
      variant.status !== "inactive",
  );

  return (
    activeVariants.find((variant) => Number(variant.quantity || 0) > 0) || null
  );
}

function getSelectedAttributes(variant) {
  const selectedAttributes = {};

  getVariantAttributes(variant).forEach((attribute) => {
    const code =
      attribute?.attribute?.code ||
      attribute?.code ||
      attribute?.attribute_code;

    const label =
      attribute?.display || attribute?.value_text || attribute?.value;

    if (code && label) {
      selectedAttributes[code] = label;
    }
  });

  return selectedAttributes;
}

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const addToCart = useAddToCart();
  const { openCart, openLogin } = useUi();

  const language = (i18n.resolvedLanguage || i18n.language || "en").split(
    "-",
  )[0];

  const name =
    product.translations?.[language]?.name ||
    product.translations?.en?.name ||
    product.translations?.ru?.name ||
    product.translations?.tm?.name ||
    product.name ||
    product.slug;

  const catName =
    product.category?.translations?.[language]?.name ||
    product.category?.translations?.en?.name ||
    product.category?.translations?.ru?.name ||
    product.category?.translations?.tm?.name ||
    product.category?.name ||
    "";

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const defaultVariant = hasVariants ? getDefaultVariant(product) : null;

  const stock = hasVariants
    ? Number(defaultVariant?.quantity || 0)
    : Number(product.quantity || 0);

  const price =
    hasVariants && defaultVariant?.price != null
      ? Number(defaultVariant.price)
      : Number(product.price || 0);

  const compareValue =
    hasVariants && defaultVariant?.compare_at_price != null
      ? defaultVariant.compare_at_price
      : product.compare_at_price;

  const compare = compareValue ? Number(compareValue) : null;

  const discount =
    compare && compare > price
      ? Math.round(((compare - price) / compare) * 100)
      : null;

  const image =
    (hasVariants && defaultVariant?.image) ||
    product.image ||
    product.primaryImage?.url;

  const isPending = addToCart.isPending ?? addToCart.isLoading ?? false;

  const canAddToCart =
    stock > 0 && (!hasVariants || Boolean(defaultVariant)) && !isPending;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canAddToCart) return;

    addToCart.mutate(
      {
        product_id: product.id,
        variant_id: defaultVariant?.id || null,
        quantity: 1,
        selected_attributes: defaultVariant
          ? getSelectedAttributes(defaultVariant)
          : {},
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

  return (
    <div className="group relative flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-2 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:rounded-xl sm:p-4">
      {/* Discount */}
      {discount ? (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white sm:left-3 sm:top-3 sm:px-2 sm:text-[11px]">
          -{discount}%
        </span>
      ) : null}

      <Link
        to={`/products/${product.slug || product.id}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        {/* Image */}
        <div className="mb-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-md bg-slate-100 sm:mb-3.5 sm:h-40 sm:rounded-lg">
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105 sm:p-2"
            />
          ) : (
            <span className="text-3xl sm:text-5xl">📦</span>
          )}
        </div>

        {/* Category */}
        {catName && (
          <div className="mb-1 line-clamp-1 text-[9px] text-slate-500 sm:text-xs">
            {catName}
          </div>
        )}

        {/* Name */}
        <div className="mb-2 line-clamp-2 min-h-[32px] break-words text-xs font-semibold leading-snug text-slate-800 sm:mb-3 sm:min-h-[42px] sm:text-[15px]">
          {name}
        </div>
      </Link>

      {/* Price and button */}
      <div className="mt-auto flex min-w-0 items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-col">
          {compare && compare > price ? (
            <span className="truncate text-[9px] text-slate-400 line-through sm:text-xs">
              {formatPrice(compare, language)}
            </span>
          ) : null}

          <span className="truncate text-xs font-bold text-slate-900 sm:text-lg">
            {formatPrice(price, language)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          title={stock <= 0 ? t("product.outOfStock") : t("product.addToCart")}
          aria-label={t("product.addToCart")}
          className="
            flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
            bg-primary text-white transition-colors hover:bg-primary-hover
            disabled:cursor-not-allowed disabled:opacity-50
            sm:h-auto sm:w-auto sm:px-3.5 sm:py-2
          "
        >
          {isPending ? (
            <span className="text-[10px] sm:text-[13px]">
              {t("common.loading")}
            </span>
          ) : stock <= 0 ? (
            <span className="hidden text-[13px] sm:inline">
              {t("product.outOfStock")}
            </span>
          ) : (
            <>
              <ShoppingCart size={15} className="sm:hidden" />
              <span className="hidden text-[13px] font-semibold sm:inline">
                {t("product.addToCart")}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
