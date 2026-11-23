import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

  // Prefer the first available variant.
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col relative transition-all hover:-translate-y-0.5 hover:shadow-lift group">
      {discount ? (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
          -{discount}%
        </span>
      ) : null}

      <Link
        to={`/products/${product.slug || product.id}`}
        className="flex flex-col flex-1 min-w-0"
      >
        <div className="h-40 bg-slate-100 rounded-lg flex items-center justify-center mb-3.5 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-5xl">📦</span>
          )}
        </div>

        <div className="text-xs text-slate-500 mb-1">{catName}</div>

        <div className="text-[15px] font-semibold mb-3 flex-1 line-clamp-2 leading-snug">
          {name}
        </div>
      </Link>

      <div className="flex items-center justify-between mt-auto gap-2">
        <div className="flex flex-col min-w-0">
          {compare && compare > price ? (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(compare, language)}
            </span>
          ) : null}

          <span className="text-lg font-bold truncate">
            {formatPrice(price, language)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="
            shrink-0 bg-primary hover:bg-primary-hover
            text-white px-3.5 py-2 rounded-lg
            text-[13px] font-semibold transition-colors
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isPending
            ? t("common.loading")
            : stock <= 0
              ? t("product.outOfStock")
              : t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
