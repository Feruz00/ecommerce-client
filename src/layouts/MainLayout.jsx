import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Header from "../components/Header";
import LoginModal from "../components/LoginModal";
import CartDrawer from "../components/CartDrawer";

export default function MainLayout() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-auto">
        <div className="container-main py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="text-xl font-extrabold text-white mb-3">
              <span className="text-blue-400">TECH</span>STORE
            </div>

            <p className="text-sm leading-relaxed">{t("footer.description")}</p>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {t("footer.shop")}
            </h4>

            <div className="flex flex-col gap-2 text-sm">
              <Link to="/products" className="hover:text-white transition">
                {t("footer.allProducts")}
              </Link>

              <Link
                to="/products?featured=true"
                className="hover:text-white transition"
              >
                {t("footer.bestSellers")}
              </Link>

              <Link to="/cart" className="hover:text-white transition">
                {t("nav.cart")}
              </Link>
            </div>
          </div>

          {/* Language */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {t("footer.language")}
            </h4>

            <div className="flex gap-2">
              {["en", "tm", "ru"].map((lang) => {
                const isActive = currentLanguage?.startsWith(lang);

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => changeLanguage(lang)}
                    aria-label={`${t("footer.language")}: ${lang.toUpperCase()}`}
                    aria-pressed={isActive}
                    className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 text-center text-xs text-slate-500 py-4">
          © {new Date().getFullYear()} TechStore. {t("footer.rights")}
        </div>
      </footer>

      <LoginModal />
      <CartDrawer />
    </div>
  );
}
