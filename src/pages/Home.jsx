import { useSearchParams } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { useProducts, useBanners } from './products/hooks';
import { useCategories } from './categories/hooks';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'created_at';
  const productParams = { limit: 12, sort };
  if (params.get('featured')) productParams.featured = params.get('featured');
  if (params.get('category')) productParams.category = params.get('category');

  const { data: bannersData } = useBanners();
  const { data: catsData } = useCategories();
  const { data: productsData, isLoading } = useProducts(productParams);

  const banners = bannersData?.data?.banners || [];
  const categories = catsData?.data?.categories || [];
  const products = productsData?.data?.products || [];

  return (
    <div className="container-main">
      <Seo
        title="Главная"
        description="TechStore — смартфоны, ноутбуки, аудиотехника и аксессуары. Доставка и гарантия."
        path="/"
      />
      <BannerCarousel banners={banners} />

      <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-7 mb-16" id="catalog">
        <div className="hidden lg:block">
          <FiltersSidebar categories={categories} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-5 gap-3 flex-wrap">
            <h2 className="text-xl font-bold">Популярные товары</h2>
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
              value={sort}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                next.set('sort', e.target.value);
                setParams(next);
              }}
            >
              <option value="created_at">По новизне</option>
              <option value="price">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="sold_count">По популярности</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-white border border-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {!products.length && (
                <p className="col-span-full text-center text-slate-500 py-16">Товары не найдены</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
