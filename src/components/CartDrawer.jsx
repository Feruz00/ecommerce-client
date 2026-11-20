import { Link } from "react-router-dom";

import { useUi } from "../context/UiContext";

import {
  useCart,
  useRemoveFromCart,
  useUpdateCartItem,
} from "../pages/cart/hooks";

import {
  formatPrice,
  getItemPrice,
  getItemTotal,
  getProductName,
  getVariantDescription,
  getProductImage,
  getCartItems,
} from "../utils/cart";

export default function CartDrawer() {
  const { cartOpen, closeCart } = useUi();

  const { data, isLoading, isError } = useCart();

  const removeMut = useRemoveFromCart();
  const updateMut = useUpdateCartItem();

  if (!cartOpen) return null;

  const items = getCartItems(data);

  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const isUpdating = updateMut.isPending || removeMut.isPending;

  return (
    <div
      className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/50 backdrop-blur-[2px]"
      onClick={closeCart}
    >
      <div
        className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Корзина</h3>

            <p className="mt-0.5 text-xs text-slate-400">
              {items.length} товаров
            </p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Закрыть корзину"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {isLoading && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />

              <p className="text-sm text-slate-500">Загрузка корзины...</p>
            </div>
          )}

          {isError && (
            <div className="py-12 text-center">
              <p className="text-sm text-red-500">
                Не удалось загрузить корзину.
              </p>
            </div>
          )}

          {!isLoading && !isError && !items.length && (
            <div className="py-16 text-center">
              <div className="mb-4 text-5xl">🛒</div>

              <h4 className="font-semibold text-slate-800">Корзина пуста</h4>

              <p className="mt-2 text-sm text-slate-400">
                Добавьте товары, чтобы продолжить покупки.
              </p>

              <Link
                to="/products"
                onClick={closeCart}
                className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Перейти к покупкам
              </Link>
            </div>
          )}

          {!isLoading &&
            !isError &&
            items.map((item) => {
              const name = getProductName(item, "ru");
              const price = getItemPrice(item);
              const quantity = Number(item.quantity || 1);
              const image = getProductImage(item);

              const variantDescription = getVariantDescription(item, "ru");

              return (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-slate-100 py-4"
                >
                  {/* Image */}
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>

                  {/* Product */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                      {name}
                    </p>

                    {variantDescription && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                        {variantDescription}
                      </p>
                    )}

                    {item?.variant?.sku && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        SKU: {item.variant.sku}
                      </p>
                    )}

                    <p className="mt-1 text-[13px] font-semibold text-primary">
                      {formatPrice(price)}
                    </p>

                    {/* Quantity */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={quantity <= 1 || isUpdating}
                        onClick={() =>
                          updateMut.mutate({
                            id: item.id,
                            quantity: Math.max(1, quantity - 1),
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="min-w-6 text-center text-sm font-semibold text-slate-800">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateMut.mutate({
                            id: item.id,
                            quantity: quantity + 1,
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total and remove */}
                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(getItemTotal(item))}
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => removeMut.mutate(item.id)}
                      className="text-xs font-medium text-red-400 transition hover:text-red-600 disabled:opacity-40"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Итого:</span>

              <span className="text-xl font-bold text-slate-900">
                {formatPrice(total)}
              </span>
            </div>

            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full rounded-xl bg-primary py-3.5 text-center font-semibold text-white transition hover:bg-primary-hover"
            >
              Оформить заказ
            </Link>

            <Link
              to="/cart"
              onClick={closeCart}
              className="mt-3 block w-full text-center text-sm font-medium text-slate-500 transition hover:text-primary"
            >
              Открыть корзину
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
