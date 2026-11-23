import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useUi } from "../context/UiContext";
import { useMe, useLogout } from "../pages/auth/hooks";
import { useCart } from "../pages/cart/hooks";
import { useCategories } from "../pages/categories/hooks";

import MegaMenu from "./MegaMenu";

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const {
    openLogin,
    openCart,
    catalogOpen,
    toggleCatalog,
    closeCatalog,
    setCatalogOpen,
  } = useUi();

  const { data: meData } = useMe();
  const { data: cartData } = useCart();
  const { data: catsData } = useCategories();

  const logoutMutation = useLogout();

  const [search, setSearch] = useState("");
  const [userOpen, setUserOpen] = useState(false);

  const catalogRef = useRef(null);
  const userRef = useRef(null);

  const user = meData?.data?.user;

  const cartCount =
    cartData?.data?.itemCount ?? cartData?.data?.items?.length ?? 0;

  const categories = catsData?.data?.categories || [];

  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  // Language
  const changeLanguage = (lang) => {
    if (!["en", "tm", "ru"].includes(lang)) return;

    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target)) {
        closeCatalog();
      }

      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };

    document.addEventListener("click", onDoc);

    return () => {
      document.removeEventListener("click", onDoc);
    };
  }, [closeCatalog]);

  // Search
  const onSearch = (e) => {
    e.preventDefault();

    const value = search.trim();

    if (!value) return;

    navigate(`/products?search=${encodeURIComponent(value)}`);
    closeCatalog();
  };

  // Logout
  const onLogout = () => {
    setUserOpen(false);
    logoutMutation.mutate();
  };

  // Catalog toggle
  const handleCatalogToggle = (e) => {
    e.stopPropagation();
    toggleCatalog();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="container-main">
        {/* Main header row */}
        <div className="flex min-h-[64px] items-center justify-between gap-2 sm:min-h-[72px] sm:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="shrink-0 text-xl font-extrabold tracking-tight text-primary sm:text-2xl"
          >
            TECHSTORE
          </Link>

          {/* Desktop catalog */}
          <div className="relative hidden shrink-0 md:block" ref={catalogRef}>
            <button
              type="button"
              onClick={handleCatalogToggle}
              aria-expanded={catalogOpen}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <span>☰</span>
              <span>{t("header.catalog")}</span>
            </button>

            <MegaMenu
              open={catalogOpen}
              categories={categories}
              onClose={closeCatalog}
              onSelect={() => setCatalogOpen(false)}
            />
          </div>

          {/* Desktop search */}
          <form
            onSubmit={onSearch}
            className="relative hidden max-w-[560px] flex-1 sm:block"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-[11px] pr-32 text-sm outline-none transition-colors focus:border-primary"
            />

            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t("header.searchButton")}
            </button>
          </form>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Desktop language */}
            <div className="hidden gap-1 lg:flex">
              {["en", "tm", "ru"].map((lang) => {
                const isActive = currentLanguage?.startsWith(lang);

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => changeLanguage(lang)}
                    aria-label={`${t("footer.language")}: ${lang.toUpperCase()}`}
                    aria-pressed={isActive}
                    className={`rounded px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* User */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  aria-expanded={userOpen}
                  aria-label={user.first_name}
                  className="flex flex-col items-center rounded-lg px-2 py-1.5 text-xs font-medium transition hover:bg-slate-100"
                >
                  <svg
                    className="mb-0.5 h-[22px] w-[22px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                  <span className="max-w-[65px] truncate">
                    {user.first_name}
                  </span>
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-mega">
                    {/* My Orders */}
                    <Link
                      to="/orders"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <svg
                        className="h-5 w-5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 3h18v18H3z" />
                        <path d="M8 8h8M8 12h8M8 16h5" />
                      </svg>

                      <span>{t("nav.myOrders")}</span>
                    </Link>

                    <div className="border-t border-slate-100" />

                    {/* Logout */}
                    <button
                      type="button"
                      disabled={logoutMutation.isPending}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      onClick={onLogout}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 17l5-5-5-5M15 12H3" />
                        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                      </svg>

                      <span>
                        {logoutMutation.isPending
                          ? t("common.loading")
                          : t("nav.logout")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="flex flex-col items-center rounded-lg px-2 py-1.5 text-xs font-medium transition hover:bg-slate-100"
              >
                <svg
                  className="mb-0.5 h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                <span>{t("nav.login")}</span>
              </button>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`${t("nav.cart")}: ${cartCount}`}
              className="relative flex flex-col items-center rounded-lg px-2 py-1.5 text-xs font-medium transition hover:bg-slate-100"
            >
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}

              <svg
                className="mb-0.5 h-[22px] w-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>

              <span>{t("nav.cart")}</span>
            </button>
          </div>
        </div>

        {/* Mobile and tablet search/catalog row */}
        <div className="flex items-center gap-2 pb-3 sm:hidden">
          {/* Mobile catalog */}
          <div className="relative shrink-0" ref={catalogRef}>
            <button
              type="button"
              onClick={handleCatalogToggle}
              aria-expanded={catalogOpen}
              aria-label={t("header.catalog")}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <span>☰</span>
              <span className="max-w-[85px] truncate">
                {t("header.catalog")}
              </span>
            </button>

            <MegaMenu
              open={catalogOpen}
              categories={categories}
              onClose={closeCatalog}
              onSelect={() => setCatalogOpen(false)}
            />
          </div>

          {/* Mobile search */}
          <form onSubmit={onSearch} className="relative min-w-0 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              className="h-11 w-full rounded-lg border-2 border-slate-200 px-3 pr-10 text-sm outline-none transition-colors focus:border-primary"
            />

            <button
              type="submit"
              aria-label={t("header.searchButton")}
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
