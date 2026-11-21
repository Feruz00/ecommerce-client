import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Seo from "../../components/Seo";
import { useCart, useRemoveFromCart, useUpdateCartItem } from "./hooks";
import { useMe } from "../auth/hooks";
import { useUi } from "../../context/UiContext";

import {
  formatPrice,
  getCartItems,
  getItemPrice,
  getItemTotal,
  getProductName,
  getProductImage,
  getVariantDescription,
} from "../../utils/cart";

export default function CartPage() {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage || i18n.language || "en";

  const { data: me } = useMe();
  const { openLogin } = useUi();

  const { data, isLoading } = useCart();

  const removeMut = useRemoveFromCart();
  const updateMut = useUpdateCartItem();

  const isUpdating = updateMut.isPending || removeMut.isPending;

  // Authentication
  if (!me?.data?.user) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title={t("cart.title")} noindex path="/cart" />

        <p className="mb-4 text-slate-500">{t("cart.loginRequired")}</p>

        <button
          type="button"
          onClick={openLogin}
          className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          {t("auth.loginBtn")}
        </button>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="container-main flex justify-center py-20">
        <Seo title={t("cart.title")} noindex path="/cart" />

        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = getCartItems(data);

  const subtotal =
    data?.data?.subtotal ??
    items.reduce((sum, item) => sum + getItemTotal(item), 0);

  // Empty cart
  if (!items.length) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title={t("cart.title")} noindex path="/cart" />

        <div className="mb-4 text-5xl">🛒</div>

        <p className="mb-4 text-slate-500">{t("cart.empty")}</p>

        <Link
          to="/products"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          {t("cart.continue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main max-w-4xl py-8">
      <Seo title={t("cart.title")} noindex path="/cart" />

      <h1 className="mb-6 text-2xl font-bold">{t("cart.title")}</h1>

      {/* Cart items */}
      <div className="mb-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {items.map((item) => {
          const name = getProductName(item, language);
          const price = getItemPrice(item);
          const img = getProductImage(item);

          const variantDescription = getVariantDescription(item, language);

          const quantity = Number(item.quantity || 1);

          return (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {/* Product image */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {img ? (
                  <img
                    src={img}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    📦
                  </div>
                )}
              </div>

              {/* Product information */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/products/${item.product?.slug || item.product_id}`}
                  className="font-semibold transition hover:text-primary"
                >
                  {name}
                </Link>

                {variantDescription && (
                  <div className="mt-1 text-xs text-slate-500">
                    {variantDescription}
                  </div>
                )}

                {item?.variant?.sku && (
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {t("product.sku")}: {item.variant.sku}
                  </div>
                )}

                <div className="mt-1 text-sm text-slate-500">
                  {formatPrice(price)}
                </div>

                {/* Quantity controls */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isUpdating}
                    aria-label={t("product.decreaseQuantity")}
                    className="h-8 w-8 rounded-lg border border-slate-200 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() =>
                      updateMut.mutate({
                        id: item.id,
                        quantity: Math.max(1, quantity - 1),
                      })
                    }
                  >
                    −
                  </button>

                  <span className="w-8 text-center">{quantity}</span>

                  <button
                    type="button"
                    disabled={isUpdating}
                    aria-label={t("product.increaseQuantity")}
                    className="h-8 w-8 rounded-lg border border-slate-200 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() =>
                      updateMut.mutate({
                        id: item.id,
                        quantity: quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price and remove */}
              <div className="shrink-0 text-right">
                <div className="font-bold">
                  {formatPrice(getItemTotal(item))}
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  className="mt-2 text-sm text-red-500 transition hover:text-red-700 disabled:opacity-40"
                  onClick={() => removeMut.mutate(item.id)}
                >
                  {t("cart.remove")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart summary */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row">
        <div className="text-xl font-bold">
          {t("cart.subtotal")}:{" "}
          <span className="text-primary">{formatPrice(subtotal)}</span>
        </div>

        <Link
          to="/checkout"
          className="rounded-lg bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-hover"
        >
          {t("cart.checkout")}
        </Link>
      </div>
    </div>
  );
}
