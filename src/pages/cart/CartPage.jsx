import { Link } from "react-router-dom";
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
  const { data: me } = useMe();
  const { openLogin } = useUi();
  const { data, isLoading } = useCart();
  const removeMut = useRemoveFromCart();
  const updateMut = useUpdateCartItem();

  if (!me?.data?.user) {
    return (
      <div className="container-main text-center py-24">
        <Seo title="Корзина" noindex path="/cart" />
        <p className="text-slate-500 mb-4">Войдите, чтобы увидеть корзину</p>
        <button
          type="button"
          onClick={openLogin}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold"
        >
          Войти
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-main py-20 flex justify-center">
        <Seo title="Корзина" noindex path="/cart" />
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = getCartItems(data);
  const subtotal =
    data?.data?.subtotal ?? items.reduce((s, i) => s + getItemTotal(i), 0);

  if (!items.length) {
    return (
      <div className="container-main text-center py-24">
        <Seo title="Корзина" noindex path="/cart" />
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-slate-500 mb-4">Корзина пуста</p>
        <Link
          to="/products"
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold inline-block"
        >
          В каталог
        </Link>
      </div>
    );
  }

  const isUpdating = updateMut.isPending || removeMut.isPending;

  return (
    <div className="container-main py-8 max-w-4xl">
      <Seo title="Корзина" noindex path="/cart" />
      <h1 className="text-2xl font-bold mb-6">Корзина</h1>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-6">
        {items.map((item) => {
          const name = getProductName(item, "ru");
          const price = getItemPrice(item);
          const img = getProductImage(item);
          const variantDescription = getVariantDescription(item, "ru");
          const quantity = Number(item.quantity || 1);

          return (
            <div key={item.id} className="flex gap-4 p-4 items-center">
              <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                {img ? (
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    📦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.product?.slug || item.product_id}`}
                  className="font-semibold hover:text-primary"
                >
                  {name}
                </Link>

                {variantDescription && (
                  <div className="text-xs text-slate-500 mt-1">
                    {variantDescription}
                  </div>
                )}

                {item?.variant?.sku && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    SKU: {item.variant.sku}
                  </div>
                )}

                <div className="text-sm text-slate-500 mt-1">
                  {formatPrice(price)}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isUpdating}
                    className="w-8 h-8 border rounded-lg disabled:opacity-40"
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
                    className="w-8 h-8 border rounded-lg disabled:opacity-40"
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

              <div className="text-right">
                <div className="font-bold">
                  {formatPrice(getItemTotal(item))}
                </div>
                <button
                  type="button"
                  disabled={isUpdating}
                  className="text-red-500 text-sm mt-2 disabled:opacity-40"
                  onClick={() => removeMut.mutate(item.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xl font-bold">
          Итого: <span className="text-primary">{formatPrice(subtotal)}</span>
        </div>
        <Link
          to="/checkout"
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
