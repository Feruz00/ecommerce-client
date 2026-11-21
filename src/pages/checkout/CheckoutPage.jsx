import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Seo from "../../components/Seo";

import { useCart } from "../cart/hooks";
import { useMe } from "../auth/hooks";

import { checkout } from "./api";
import { useUi } from "../../context/UiContext";

import {
  formatPrice,
  getItemPrice,
  getItemTotal,
  getProductName,
  getVariantDescription,
  getCartItems,
} from "../../utils/cart";

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();

  const language = i18n.resolvedLanguage || i18n.language || "en";

  const { openLogin } = useUi();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useMe();
  const { data: cartData, isLoading: cartLoading } = useCart();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    district: "",
    street: "",
    payment_method: "cash",
    notes: "",
  });

  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const mutation = useMutation({
    mutationFn: checkout,

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      setDone(response?.data?.order || response?.data || response?.order);
    },

    onError: (err) => {
      setError(err.response?.data?.message || t("checkout.submitError"));
    },
  });

  const user = me?.data?.user;
  const items = getCartItems(cartData);

  const subtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const shipping = subtotal > 500 ? 0 : 20;
  const total = subtotal + shipping;

  const set = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setError("");

    mutation.mutate({
      shipping_address: {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        street: form.street.trim(),
      },
      payment_method: form.payment_method,
      note: form.notes.trim(),
    });
  };

  // Loading user
  if (meLoading) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title={t("checkout.title")} noindex path="/checkout" />

        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title={t("checkout.title")} noindex path="/checkout" />

        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-4 text-4xl">🔐</div>

          <h1 className="mb-2 text-xl font-bold">{t("checkout.loginTitle")}</h1>

          <p className="mb-6 text-sm text-slate-500">
            {t("checkout.loginDescription")}
          </p>

          <button
            type="button"
            onClick={openLogin}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            {t("auth.loginBtn")}
          </button>
        </div>
      </div>
    );
  }

  // Successful checkout
  if (done) {
    return (
      <div className="container-main max-w-lg py-20 text-center">
        <Seo title={t("checkout.successTitle")} noindex path="/checkout" />

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
          ✓
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          {t("checkout.successTitle")}
        </h1>

        <p className="mb-2 text-slate-500">
          {t("checkout.successDescription")}
        </p>

        <p className="mb-8 text-sm text-slate-500">
          {t("checkout.orderNumber")}:{" "}
          <strong className="text-slate-900">
            {done.order_number || done.id}
          </strong>
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/products"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            {t("cart.continue")}
          </Link>

          <Link
            to="/orders"
            className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("nav.orders")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main max-w-5xl py-8">
      <Seo title={t("checkout.title")} noindex path="/checkout" />

      {/* Page header */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="transition hover:text-primary">
            {t("nav.home")}
          </Link>

          <span>/</span>

          <Link to="/cart" className="transition hover:text-primary">
            {t("cart.title")}
          </Link>

          <span>/</span>

          <span className="text-slate-700">{t("checkout.breadcrumb")}</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("checkout.title")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">{t("checkout.subtitle")}</p>
      </div>

      {cartLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">{t("checkout.loadingCart")}</p>
        </div>
      ) : !items.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mb-4 text-4xl">🛒</div>

          <h2 className="mb-2 text-lg font-bold">{t("cart.empty")}</h2>

          <p className="mb-6 text-sm text-slate-500">
            {t("checkout.emptyDescription")}
          </p>

          <Link
            to="/products"
            className="inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            {t("cart.continue")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-5">
          {/* Shipping form */}
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 md:col-span-3"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("checkout.shippingTitle")}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {t("checkout.shippingDescription")}
              </p>
            </div>

            {/* Address fields */}
            {[
              ["full_name", "fullName", "text"],
              ["phone", "phone", "tel"],
              ["city", "city", "text"],
              ["district", "district", "text"],
              ["street", "street", "text"],
            ].map(([key, translationKey, type]) => (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="mb-1.5 block text-[13px] font-semibold text-slate-700"
                >
                  {t(`checkout.fields.${translationKey}`)}

                  {key !== "district" && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <input
                  id={key}
                  required={key !== "district"}
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={t(`checkout.fields.${translationKey}`)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            ))}

            {/* Payment */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                {t("checkout.paymentTitle")}
              </h2>

              <div className="space-y-2">
                {/* Cash */}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    form.payment_method === "cash"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={form.payment_method === "cash"}
                    onChange={set("payment_method")}
                    className="h-4 w-4 accent-indigo-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t("checkout.cashTitle")}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {t("checkout.cashDescription")}
                    </p>
                  </div>
                </label>

                {/* Card */}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    form.payment_method === "card"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={form.payment_method === "card"}
                    onChange={set("payment_method")}
                    className="h-4 w-4 accent-indigo-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t("checkout.cardTitle")}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {t("checkout.cardDescription")}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-[13px] font-semibold text-slate-700"
              >
                {t("checkout.notes")}
              </label>

              <textarea
                id="notes"
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder={t("checkout.notesPlaceholder")}
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending || !items.length}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending
                ? t("checkout.submitting")
                : t("checkout.confirmOrder")}
            </button>
          </form>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-slate-900">
                {t("checkout.orderSummary")}
              </h2>

              <div className="mb-5 max-h-80 space-y-4 overflow-y-auto">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  const quantity = Number(item.quantity || 0);

                  const name = getProductName(item, language);

                  const variantDescription = getVariantDescription(
                    item,
                    language,
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {name}
                        </p>

                        {variantDescription && (
                          <p className="mt-1 text-xs text-slate-400">
                            {variantDescription}
                          </p>
                        )}

                        {item?.variant?.sku && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {t("product.sku")}: {item.variant.sku}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {formatPrice(price)} × {quantity}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-slate-800">
                        {formatPrice(getItemTotal(item))}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t("checkout.products")}
                  </span>

                  <span className="font-medium text-slate-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {t("checkout.shipping")}
                  </span>

                  <span className="font-medium text-slate-800">
                    {shipping
                      ? formatPrice(shipping)
                      : t("checkout.freeShipping")}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4 text-lg font-bold">
                  <span>{t("cart.subtotal")}</span>

                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                {t("checkout.confirmationNote")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
