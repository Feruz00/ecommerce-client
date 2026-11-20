import { Link } from 'react-router-dom';
import { useAddToCart } from '../pages/cart/hooks';
import { useUi } from '../context/UiContext';

function formatPrice(n) {
  if (n == null) return '';
  return Number(n).toLocaleString('ru-RU') + ' TMT';
}

export default function ProductCard({ product }) {
  const addMut = useAddToCart();
  const { openCart, openLogin } = useUi();

  const name = product.name || product.translations?.ru?.name || product.translations?.en?.name || product.slug;
  const catName =
    product.category?.name ||
    product.category?.translations?.ru?.name ||
    product.category?.translations?.en?.name ||
    '';
  const price = Number(product.price);
  const compare = product.compare_at_price ? Number(product.compare_at_price) : null;
  const discount =
    compare && compare > price ? Math.round(((compare - price) / compare) * 100) : null;
  const image = product.image || product.primaryImage?.url;

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addMut.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => openCart(),
        onError: (err) => {
          if (err?.response?.status === 401) openLogin();
        },
      }
    );
  };

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col relative transition-all hover:-translate-y-0.5 hover:shadow-lift group"
    >
      {discount ? (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
          -{discount}%
        </span>
      ) : null}

      <div className="h-40 bg-slate-100 rounded-lg flex items-center justify-center mb-3.5 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-5xl">📦</span>
        )}
      </div>

      <div className="text-xs text-slate-500 mb-1">{catName}</div>
      <div className="text-[15px] font-semibold mb-3 flex-1 line-clamp-2 leading-snug">{name}</div>

      <div className="flex items-center justify-between mt-auto gap-2">
        <div className="flex flex-col min-w-0">
          {compare && compare > price ? (
            <span className="text-xs text-slate-400 line-through">{formatPrice(compare)}</span>
          ) : null}
          <span className="text-lg font-bold truncate">{formatPrice(price)}</span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={addMut.isPending}
          className="shrink-0 bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60"
        >
          В корзину
        </button>
      </div>
    </Link>
  );
}
