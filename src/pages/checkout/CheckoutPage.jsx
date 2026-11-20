import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
      setError(err.response?.data?.message || "Ошибка оформления заказа");
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

  if (meLoading) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title="Оформление заказа" noindex path="/checkout" />
        <p className="text-sm text-slate-500">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-main py-24 text-center">
        <Seo title="Оформление заказа" noindex path="/checkout" />

        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-4 text-4xl">🔐</div>

          <h1 className="mb-2 text-xl font-bold">Войдите в аккаунт</h1>

          <p className="mb-6 text-sm text-slate-500">
            Для оформления заказа необходимо авторизоваться.
          </p>

          <button
            type="button"
            onClick={openLogin}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-main max-w-lg py-20 text-center">
        <Seo title="Заказ оформлен" noindex path="/checkout" />

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
          ✓
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Заказ оформлен!
        </h1>

        <p className="mb-2 text-slate-500">Спасибо за ваш заказ.</p>

        <p className="mb-8 text-sm text-slate-500">
          Номер заказа:{" "}
          <strong className="text-slate-900">
            {done.order_number || done.id}
          </strong>
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/products"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            Продолжить покупки
          </Link>

          <Link
            to="/orders"
            className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Мои заказы
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main max-w-5xl py-8">
      <Seo title="Оформление заказа" noindex path="/checkout" />

      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-primary">
            Главная
          </Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-primary">
            Корзина
          </Link>
          <span>/</span>
          <span className="text-slate-700">Оформление</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Оформление заказа
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Заполните информацию для доставки.
        </p>
      </div>

      {cartLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Загрузка корзины...</p>
        </div>
      ) : !items.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mb-4 text-4xl">🛒</div>

          <h2 className="mb-2 text-lg font-bold">Корзина пуста</h2>

          <p className="mb-6 text-sm text-slate-500">
            Добавьте товары перед оформлением заказа.
          </p>

          <Link
            to="/products"
            className="inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover"
          >
            Перейти к покупкам
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
                Адрес доставки
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Укажите контактные данные и адрес.
              </p>
            </div>

            {[
              ["full_name", "ФИО", "text"],
              ["phone", "Телефон", "tel"],
              ["city", "Город", "text"],
              ["district", "Район", "text"],
              ["street", "Улица, дом, квартира", "text"],
            ].map(([key, label, type]) => (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="mb-1.5 block text-[13px] font-semibold text-slate-700"
                >
                  {label}
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
                  placeholder={label}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            ))}

            {/* Payment */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Оплата</h2>

              <div className="space-y-2">
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
                      Наличными при получении
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Оплата курьеру
                    </p>
                  </div>
                </label>

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
                      Картой при получении
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Оплата при доставке
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
                Комментарий к заказу
              </label>

              <textarea
                id="notes"
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder="Дополнительная информация..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !items.length}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? "Оформляем заказ..." : "Подтвердить заказ"}
            </button>
          </form>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-slate-900">
                Ваш заказ
              </h2>

              <div className="mb-5 max-h-80 space-y-4 overflow-y-auto">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  const quantity = Number(item.quantity || 0);

                  const variantDescription = getVariantDescription(item, "ru");

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {getProductName(item, "ru")}
                        </p>

                        {variantDescription && (
                          <p className="mt-1 text-xs text-slate-400">
                            {variantDescription}
                          </p>
                        )}

                        {item?.variant?.sku && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            SKU: {item.variant.sku}
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

              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Товары</span>

                  <span className="font-medium text-slate-800">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Доставка</span>

                  <span className="font-medium text-slate-800">
                    {shipping ? formatPrice(shipping) : "Бесплатно"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4 text-lg font-bold">
                  <span>Итого</span>

                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                Итоговая стоимость заказа будет подтверждена при оформлении.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
