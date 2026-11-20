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

  // Close catalog when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target)) {
        closeCatalog();
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
  };

  // Logout
  const onLogout = () => {
    setUserOpen(false);
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="container-main flex items-center justify-between h-[72px] gap-5">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-primary tracking-tight shrink-0"
        >
          TECHSTORE
        </Link>

        {/* Catalog */}
        <div className="relative hidden md:block" ref={catalogRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCatalog();
            }}
            aria-expanded={catalogOpen}
            className="bg-primary hover:bg-primary-hover text-white px-[18px] py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
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

        {/* Search */}
        <form
          onSubmit={onSearch}
          className="flex-1 max-w-[560px] relative hidden sm:block"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="w-full py-[11px] px-4 border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />

          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 bg-primary hover:bg-primary-hover text-white px-4 rounded-md font-medium text-sm"
          >
            {t("header.searchButton")}
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language */}
          <div className="hidden lg:flex gap-1">
            {["en", "tm", "ru"].map((lang) => {
              const isActive = currentLanguage?.startsWith(lang);

              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => changeLanguage(lang)}
                  aria-label={`${t("footer.language")}: ${lang.toUpperCase()}`}
                  aria-pressed={isActive}
                  className={`px-2 py-1 rounded text-xs font-semibold uppercase transition-colors ${
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                aria-expanded={userOpen}
                className="flex flex-col items-center text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              >
                <svg
                  className="w-[22px] h-[22px] mb-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                <span className="max-w-[72px] truncate">{user.first_name}</span>
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-mega py-1 z-50">
                  <button
                    type="button"
                    disabled={logoutMutation.isPending}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                    onClick={onLogout}
                  >
                    {logoutMutation.isPending
                      ? t("common.loading")
                      : t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Login */
            <button
              type="button"
              onClick={openLogin}
              className="flex flex-col items-center text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <svg
                className="w-[22px] h-[22px] mb-0.5"
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
            className="flex flex-col items-center text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 relative"
          >
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-1.5 bg-red-500 text-white text-[11px] font-bold px-1.5 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            )}

            <svg
              className="w-[22px] h-[22px] mb-0.5"
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
    </header>
  );
}
