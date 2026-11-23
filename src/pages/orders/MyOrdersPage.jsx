import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  CalendarDays,
  ChevronRight,
  ShoppingBag,
  Truck,
  Store,
  CreditCard,
  MapPin,
  Phone,
  User,
  X,
  RefreshCw,
  LoaderCircle,
  FileText,
} from "lucide-react";

import Seo from "../../components/Seo";
import { useMyOrders, useMyOrder } from "./hooks";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  processing: "bg-violet-50 text-violet-700 ring-violet-200",
  shipped: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TMT`;
}

function formatDate(value, locale) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status, t) {
  return t(`orders.status.${status}`, {
    defaultValue: status,
  });
}

function StatusBadge({ status, t }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {getStatusLabel(status, t)}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-3 w-36 rounded bg-slate-100" />
        </div>
        <div className="h-7 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="mb-5 h-16 rounded-xl bg-slate-100" />
      <div className="flex justify-between">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-5 w-28 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function EmptyOrders({ t }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShoppingBag size={30} />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {t("orders.emptyTitle")}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {t("orders.emptyDescription")}
      </p>

      <a
        href="/products"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        {t("orders.startShopping")}
      </a>
    </div>
  );
}

function OrderDetailsModal({ orderId, onClose, t, locale }) {
  const { data, isLoading, isError, refetch, isFetching } = useMyOrder(orderId);

  const order = data?.data?.order;

  const address = order?.shipping_address || {};
  const items = order?.items || [];
  const payments = order?.payments || [];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              {t("orders.orderDetails")}
            </h2>
            {order?.order_number && (
              <p className="mt-1 truncate text-xs text-slate-500">
                {t("orders.orderNumber")}: {order.order_number}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : isError || !order ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{t("orders.detailsError")}</p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={15} />
                {t("common.retry")}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Order status and date */}
              <section className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={order.status} t={t} />
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={14} />
                    {formatDate(order.created_at, locale)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {t("orders.paymentMethod")}
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                      {t(`orders.paymentMethods.${order.payment_method}`, {
                        defaultValue: order.payment_method,
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {t("orders.deliveryMethod")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.delivery_method === "pickup"
                        ? t("orders.pickup")
                        : t("orders.delivery")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Products */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Package size={17} />
                  {t("orders.products")} ({items.length})
                </h3>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {items.map((item) => {
                    const attributes =
                      item.selected_attributes &&
                      typeof item.selected_attributes === "object"
                        ? Object.entries(item.selected_attributes).filter(
                            ([key, value]) =>
                              key !== "variant_id" &&
                              value !== null &&
                              value !== undefined &&
                              value !== "",
                          )
                        : [];

                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 p-3 sm:p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold text-slate-900">
                            {item.product_name}
                          </p>

                          {item.product_sku && (
                            <p className="mt-1 text-xs text-slate-500">
                              SKU: {item.product_sku}
                            </p>
                          )}

                          {attributes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {attributes.map(([key, value]) => (
                                <span
                                  key={key}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                                >
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 text-xs text-slate-500">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-900">
                          {formatPrice(item.total)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Shipping information */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  {order.delivery_method === "pickup" ? (
                    <Store size={17} />
                  ) : (
                    <MapPin size={17} />
                  )}
                  {t("orders.shippingInformation")}
                </h3>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <User
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <div>
                      <p className="text-xs text-slate-500">
                        {t("orders.customerName")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {address.full_name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3">
                    <Phone
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <div>
                      <p className="text-xs text-slate-500">
                        {t("orders.phone")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {address.phone || "—"}
                      </p>
                    </div>
                  </div>

                  {order.delivery_method === "delivery" && (
                    <div className="mt-4 flex items-start gap-3">
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          {t("orders.address")}
                        </p>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-900">
                          {[address.city, address.district, address.street]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment information */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CreditCard size={17} />
                  {t("orders.paymentInformation")}
                </h3>

                <div className="rounded-xl border border-slate-100 p-4">
                  {payments.length ? (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {t(`orders.paymentMethods.${payment.method}`, {
                                defaultValue: payment.method,
                              })}
                            </p>
                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {t(`orders.paymentStatuses.${payment.status}`, {
                                defaultValue: payment.status,
                              })}
                            </p>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {formatPrice(payment.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {t("orders.noPaymentInformation")}
                    </p>
                  )}
                </div>
              </section>

              {/* Order note */}
              {order.note && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <FileText size={17} />
                    {t("orders.orderNote")}
                  </h3>
                  <p className="rounded-xl border border-slate-100 p-4 text-sm leading-6 text-slate-600">
                    {order.note}
                  </p>
                </section>
              )}

              {/* Total summary */}
              <section className="rounded-xl bg-slate-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3 text-slate-500">
                    <span>{t("orders.subtotal")}</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-3 text-slate-500">
                    <span>{t("orders.shippingCost")}</span>
                    <span>{formatPrice(order.shipping_cost)}</span>
                  </div>

                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-600">
                      <span>{t("orders.discount")}</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-900">
                        {t("orders.total")}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const locale = i18n.resolvedLanguage || i18n.language || "en";

  const { data, isLoading, isError, refetch, isFetching } = useMyOrders({
    page,
    limit: 10,
    ...(status !== "all" ? { status } : {}),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <div className="container-main min-h-[60vh] pb-10 pt-5 sm:pb-14 sm:pt-8">
      <Seo
        title={t("orders.seoTitle")}
        description={t("orders.seoDescription")}
        path="/orders"
      />

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
            <Package size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {t("orders.title")}
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {t("orders.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex min-w-max gap-2">
          {STATUSES.map((item) => {
            const active = status === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => changeStatus(item)}
                className={`min-h-9 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
                }`}
              >
                {item === "all" ? t("orders.all") : getStatusLabel(item, t)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <OrderSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-white px-5 py-14 text-center">
          <p className="text-sm text-red-600">{t("orders.loadError")}</p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {isFetching ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {t("common.retry")}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrders t={t} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 sm:text-sm">
              {t("orders.ordersFound", { count: pagination.total })}
            </p>

            {isFetching && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <LoaderCircle size={14} className="animate-spin" />
                {t("common.loading")}
              </span>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => {
              const items = order.items || [];
              const itemCount = items.reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              );

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 p-4 sm:p-5">
                    {/* Order heading */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">
                          {t("orders.orderNumber")}
                        </p>
                        <h2 className="mt-1 break-all text-sm font-bold text-slate-900 sm:text-base">
                          #{order.order_number}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />
                          {formatDate(order.created_at, locale)}
                        </p>
                      </div>

                      <StatusBadge status={order.status} t={t} />
                    </div>

                    {/* Product summary */}
                    <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <ShoppingBag size={15} />
                        {t("orders.products")}
                        <span className="text-slate-400">({itemCount})</span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 text-xs"
                          >
                            <span className="min-w-0 truncate text-slate-600">
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="shrink-0 font-medium text-slate-800">
                              {formatPrice(item.total)}
                            </span>
                          </div>
                        ))}

                        {items.length > 2 && (
                          <p className="pt-1 text-xs text-primary">
                            {t("orders.moreProducts", {
                              count: items.length - 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order footer */}
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {order.delivery_method === "pickup" ? (
                            <Store size={14} />
                          ) : (
                            <Truck size={14} />
                          )}
                          {order.delivery_method === "pickup"
                            ? t("orders.pickup")
                            : t("orders.delivery")}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CreditCard size={14} />
                          {t(`orders.paymentMethods.${order.payment_method}`, {
                            defaultValue: order.payment_method,
                          })}
                        </div>
                      </div>

                      <div className="ml-auto text-right">
                        <p className="text-xs text-slate-500">
                          {t("orders.total")}
                        </p>
                        <p className="mt-0.5 text-base font-bold text-slate-900">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                      >
                        {t("orders.viewDetails")}
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("common.previous")}
              </button>

              <span className="px-3 text-sm text-slate-600">
                {t("orders.pageOf", {
                  page: pagination.page,
                  total: pagination.totalPages,
                })}
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("common.next")}
              </button>
            </div>
          )}
        </>
      )}

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          t={t}
          locale={locale}
        />
      )}
    </div>
  );
}
