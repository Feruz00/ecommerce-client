import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X } from "lucide-react";

import BannerCarousel from "../components/BannerCarousel";
import FiltersSidebar from "../components/FiltersSidebar";
import ProductCard from "../components/ProductCard";
import Seo from "../components/Seo";
import { useProducts, useBanners } from "./products/hooks";
import { useCategories } from "./categories/hooks";

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { t } = useTranslation();

  const sort = params.get("sort") || "created_at";
  const productParams = { limit: 12, sort };

  if (params.get("featured")) {
    productParams.featured = params.get("featured");
  }

  if (params.get("category")) {
    productParams.category = params.get("category");
  }

  const { data: bannersData } = useBanners();
  const { data: catsData } = useCategories();
  const { data: productsData, isLoading } = useProducts(productParams);

  const banners = bannersData?.data?.banners || [];
  const categories = catsData?.data?.categories || [];
  const products = productsData?.data?.products || [];

  return (
    <div className="container-main pb-8 sm:pb-12">
      <Seo
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
      />

      <BannerCarousel banners={banners} />

      <section
        className="mb-10 grid grid-cols-1 gap-5 lg:mb-16 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-7"
        id="catalog"
      >
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <FiltersSidebar categories={categories} />
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              {t("home.popularProducts")}
            </h2>

            <div className="flex w-full gap-2 sm:w-auto">
              {/* Mobile and tablet filter button */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary lg:hidden sm:flex-none"
              >
                <SlidersHorizontal size={16} />
                {t("filters.title")}
              </button>

              <select
                aria-label={t("home.popularProducts")}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary sm:flex-none"
                value={sort}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  next.set("sort", e.target.value);
                  setParams(next);
                }}
              >
                <option value="created_at">{t("home.sortNewest")}</option>
                <option value="price">{t("home.sortPriceAsc")}</option>
                <option value="price_desc">{t("home.sortPriceDesc")}</option>
                <option value="sold_count">{t("home.sortPopular")}</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border border-slate-100 bg-white sm:h-72"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}

              {!products.length && (
                <p className="col-span-full py-12 text-center text-sm text-slate-500 sm:py-16 sm:text-base">
                  {t("home.noProducts")}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Mobile and tablet filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="absolute inset-y-0 left-0 flex w-[min(88%,360px)] flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {t("filters.title")}
              </h3>

              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <FiltersSidebar categories={categories} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
